// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { openDatabase } from "../src/db.js";

function setup() {
  const db = openDatabase(":memory:");
  return { db, app: buildApp(db) };
}

async function createProject(app: ReturnType<typeof setup>["app"], name = "Test project") {
  const res = await app.inject({ method: "POST", url: "/projects", payload: { name } });
  return res.json() as { id: string; name: string; status: string };
}

async function createTask(app: ReturnType<typeof setup>["app"], projectId: string, title = "Task") {
  const res = await app.inject({
    method: "POST",
    url: `/projects/${projectId}/tasks`,
    payload: { title },
  });
  return res.json() as { id: string; state: string };
}

describe("health", () => {
  it("returns ok", async () => {
    const { app } = setup();
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});

describe("projects", () => {
  it("creates, reads, updates and lists a project", async () => {
    const { app } = setup();
    const project = await createProject(app, "Alpha");
    expect(project.status).toBe("active");

    const got = await app.inject({ method: "GET", url: `/projects/${project.id}` });
    expect(got.statusCode).toBe(200);

    const patched = await app.inject({
      method: "PATCH",
      url: `/projects/${project.id}`,
      payload: { status: "archived", goal: "Ship it" },
    });
    expect(patched.json()).toMatchObject({ status: "archived", goal: "Ship it" });

    const archived = await app.inject({ method: "GET", url: "/projects?status=archived" });
    expect(archived.json()).toHaveLength(1);
    const active = await app.inject({ method: "GET", url: "/projects?status=active" });
    expect(active.json()).toHaveLength(0);
  });

  it("rejects an empty name with 400", async () => {
    const { app } = setup();
    const res = await app.inject({ method: "POST", url: "/projects", payload: { name: "  " } });
    expect(res.statusCode).toBe(400);
  });

  it("returns 404 for an unknown project", async () => {
    const { app } = setup();
    const res = await app.inject({ method: "GET", url: "/projects/nope" });
    expect(res.statusCode).toBe(404);
  });

  it("deletes a project with its tasks but keeps audit events", async () => {
    const { app, db } = setup();
    const project = await createProject(app);
    const task = await createTask(app, project.id);

    const del = await app.inject({ method: "DELETE", url: `/projects/${project.id}` });
    expect(del.statusCode).toBe(204);

    const taskAfter = await app.inject({ method: "GET", url: `/tasks/${task.id}` });
    expect(taskAfter.statusCode).toBe(404);

    const events = db
      .prepare("SELECT type FROM audit_events WHERE project_id = ? ORDER BY created_at")
      .all(project.id) as { type: string }[];
    expect(events.map((e) => e.type)).toContain("project.deleted");
    expect(events.map((e) => e.type)).toContain("project.created");
  });
});

describe("tasks", () => {
  it("starts planned and follows allowed transitions", async () => {
    const { app } = setup();
    const project = await createProject(app);
    const task = await createTask(app, project.id);
    expect(task.state).toBe("planned");

    for (const to of ["in_progress", "waiting_for_approval", "in_progress", "completed"]) {
      const res = await app.inject({
        method: "POST",
        url: `/tasks/${task.id}/transition`,
        payload: { to },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json()).toMatchObject({ state: to });
    }
  });

  it("rejects invalid transitions with 409", async () => {
    const { app } = setup();
    const project = await createProject(app);
    const task = await createTask(app, project.id);

    const skip = await app.inject({
      method: "POST",
      url: `/tasks/${task.id}/transition`,
      payload: { to: "completed" },
    });
    expect(skip.statusCode).toBe(409);

    await app.inject({ method: "POST", url: `/tasks/${task.id}/transition`, payload: { to: "cancelled" } });
    const revive = await app.inject({
      method: "POST",
      url: `/tasks/${task.id}/transition`,
      payload: { to: "in_progress" },
    });
    expect(revive.statusCode).toBe(409);
  });

  it("allows retry of a failed task as a new planned task state", async () => {
    const { app } = setup();
    const project = await createProject(app);
    const task = await createTask(app, project.id);
    for (const to of ["in_progress", "failed", "planned"]) {
      const res = await app.inject({
        method: "POST",
        url: `/tasks/${task.id}/transition`,
        payload: { to },
      });
      expect(res.statusCode).toBe(200);
    }
  });

  it("rejects a parent task from another project", async () => {
    const { app } = setup();
    const a = await createProject(app, "A");
    const b = await createProject(app, "B");
    const parent = await createTask(app, a.id);
    const res = await app.inject({
      method: "POST",
      url: `/projects/${b.id}/tasks`,
      payload: { title: "Child", parent_task_id: parent.id },
    });
    expect(res.statusCode).toBe(400);
  });

  it("records transitions in the audit log without user content", async () => {
    const { app, db } = setup();
    const project = await createProject(app);
    const task = await createTask(app, project.id, "Secret title");
    await app.inject({ method: "POST", url: `/tasks/${task.id}/transition`, payload: { to: "in_progress" } });

    const row = db
      .prepare("SELECT detail FROM audit_events WHERE task_id = ? AND type = 'task.transition'")
      .get(task.id) as { detail: string };
    expect(JSON.parse(row.detail)).toEqual({ from: "planned", to: "in_progress" });
    const all = db.prepare("SELECT detail FROM audit_events").all() as { detail: string }[];
    expect(all.some((e) => e.detail.includes("Secret title"))).toBe(false);
  });
});
