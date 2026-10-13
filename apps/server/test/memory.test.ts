// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { openDatabase } from "../src/db.js";

function setup() {
  const db = openDatabase(":memory:");
  return { db, app: buildApp(db) };
}

type TestApp = ReturnType<typeof setup>["app"];

const post = (app: TestApp, url: string, payload: object) =>
  app.inject({ method: "POST", url, payload });

async function createProject(app: TestApp, name = "Project") {
  return (await post(app, "/projects", { name })).json() as { id: string };
}

describe("memories", () => {
  it("creates a global memory with sensible defaults", async () => {
    const { app } = setup();
    const res = await post(app, "/memories", { scope: "global", text: "Prefers short answers" });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      scope: "global",
      project_id: null,
      kind: "fact",
      status: "confirmed",
      pinned: false,
    });
  });

  it("validates scope and project", async () => {
    const { app } = setup();
    expect((await post(app, "/memories", { scope: "project", text: "x" })).statusCode).toBe(400);
    expect(
      (await post(app, "/memories", { scope: "project", project_id: "nope", text: "x" })).statusCode,
    ).toBe(404);
    expect(
      (await post(app, "/memories", { scope: "global", project_id: "p", text: "x" })).statusCode,
    ).toBe(400);
    expect((await post(app, "/memories", { scope: "global", text: "   " })).statusCode).toBe(400);
  });

  it("filters, searches and escapes LIKE wildcards", async () => {
    const { app } = setup();
    const project = await createProject(app);
    await post(app, "/memories", { scope: "global", text: "I like coffee" });
    await post(app, "/memories", { scope: "global", text: "Deadline is Friday", status: "inferred" });
    await post(app, "/memories", { scope: "project", project_id: project.id, text: "100% done" });

    const coffee = await app.inject({ method: "GET", url: "/memories?q=coffee" });
    expect(coffee.json()).toHaveLength(1);

    const percent = await app.inject({ method: "GET", url: "/memories?q=%25" });
    expect(percent.json()).toHaveLength(1);

    const inferred = await app.inject({ method: "GET", url: "/memories?status=inferred" });
    expect(inferred.json()).toHaveLength(1);

    const inProject = await app.inject({
      method: "GET",
      url: `/memories?scope=project&project_id=${project.id}`,
    });
    expect(inProject.json()).toHaveLength(1);
  });

  it("lists pinned memories first", async () => {
    const { app } = setup();
    await post(app, "/memories", { scope: "global", text: "First" });
    await post(app, "/memories", { scope: "global", text: "Pinned", pinned: true });
    const list = (await app.inject({ method: "GET", url: "/memories" })).json() as {
      text: string;
    }[];
    expect(list[0]?.text).toBe("Pinned");
  });

  it("lets the user confirm and edit an inferred memory", async () => {
    const { app } = setup();
    const created = (
      await post(app, "/memories", { scope: "global", text: "Likes tea", status: "inferred" })
    ).json() as { id: string };

    const patched = await app.inject({
      method: "PATCH",
      url: `/memories/${created.id}`,
      payload: { status: "confirmed", text: "Likes green tea", pinned: true },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json()).toMatchObject({ status: "confirmed", text: "Likes green tea", pinned: true });

    const empty = await app.inject({ method: "PATCH", url: `/memories/${created.id}`, payload: {} });
    expect(empty.statusCode).toBe(400);
    const blank = await app.inject({
      method: "PATCH",
      url: `/memories/${created.id}`,
      payload: { text: "" },
    });
    expect(blank.statusCode).toBe(400);
  });

  it("deletes content for good and keeps text out of the audit log", async () => {
    const { app, db } = setup();
    const secret = "my secret preference";
    const created = (await post(app, "/memories", { scope: "global", text: secret })).json() as {
      id: string;
    };

    const del = await app.inject({ method: "DELETE", url: `/memories/${created.id}` });
    expect(del.statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: `/memories/${created.id}` })).statusCode).toBe(404);
    expect((await app.inject({ method: "GET", url: "/memories?q=secret" })).json()).toEqual([]);

    const count = db.prepare("SELECT COUNT(*) AS n FROM memories").get() as { n: number };
    expect(count.n).toBe(0);

    const events = db.prepare("SELECT type, detail FROM audit_events").all() as {
      type: string;
      detail: string;
    }[];
    expect(events.map((e) => e.type)).toEqual(
      expect.arrayContaining(["memory.created", "memory.deleted"]),
    );
    expect(events.some((e) => e.detail.includes(secret))).toBe(false);
  });

  it("removes project memories with their project but keeps global ones", async () => {
    const { app } = setup();
    const project = await createProject(app);
    await post(app, "/memories", { scope: "global", text: "Global" });
    await post(app, "/memories", { scope: "project", project_id: project.id, text: "Scoped" });

    await app.inject({ method: "DELETE", url: `/projects/${project.id}` });
    const list = (await app.inject({ method: "GET", url: "/memories" })).json() as {
      text: string;
    }[];
    expect(list.map((m) => m.text)).toEqual(["Global"]);
  });

  it("requires a session when authentication is enabled", async () => {
    const db = openDatabase(":memory:");
    const app = buildApp(db, { auth: { scryptN: 1024 } });
    for (const url of ["/memories", "/conversations/x", "/conversations/x/messages"]) {
      const res = await app.inject({ method: "GET", url });
      expect(res.statusCode).toBe(401);
    }
  });
});
