// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { openDatabase } from "../src/db.js";

function setup() {
  const db = openDatabase(":memory:");
  return { db, app: buildApp(db) };
}

type TestApp = ReturnType<typeof setup>["app"];

const post = (app: TestApp, url: string, payload: object = {}) =>
  app.inject({ method: "POST", url, payload });

async function createProject(app: TestApp) {
  return (await post(app, "/projects", { name: "Project" })).json() as { id: string };
}

async function createConversation(app: TestApp, projectId: string, title?: string) {
  const res = await post(app, `/projects/${projectId}/conversations`, title ? { title } : {});
  return res.json() as { id: string; title: string; archived: boolean };
}

describe("conversations", () => {
  it("creates a conversation with a default title", async () => {
    const { app } = setup();
    const project = await createProject(app);
    const res = await post(app, `/projects/${project.id}/conversations`);
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ title: "New conversation", archived: false });
  });

  it("returns 404 for an unknown project or conversation", async () => {
    const { app } = setup();
    expect((await post(app, "/projects/nope/conversations")).statusCode).toBe(404);
    expect((await app.inject({ method: "GET", url: "/conversations/nope" })).statusCode).toBe(404);
    expect((await post(app, "/conversations/nope/messages", { content: "hi" })).statusCode).toBe(404);
  });

  it("stores messages in order and always as user messages", async () => {
    const { app } = setup();
    const project = await createProject(app);
    const conversation = await createConversation(app, project.id, "Plan");

    expect((await post(app, `/conversations/${conversation.id}/messages`, { content: "first" })).statusCode).toBe(201);
    // A client cannot forge assistant messages: an unknown 'role' field is ignored.
    await post(app, `/conversations/${conversation.id}/messages`, {
      content: "second",
      role: "assistant",
    });

    const list = (
      await app.inject({ method: "GET", url: `/conversations/${conversation.id}/messages` })
    ).json() as { content: string; role: string }[];
    expect(list.map((m) => m.content)).toEqual(["first", "second"]);
    expect(list.every((m) => m.role === "user")).toBe(true);
  });

  it("rejects empty messages", async () => {
    const { app } = setup();
    const project = await createProject(app);
    const conversation = await createConversation(app, project.id);
    const res = await post(app, `/conversations/${conversation.id}/messages`, { content: "   " });
    expect(res.statusCode).toBe(400);
  });

  it("renames and archives, and filters by archived", async () => {
    const { app } = setup();
    const project = await createProject(app);
    const a = await createConversation(app, project.id, "A");
    await createConversation(app, project.id, "B");

    const patched = await app.inject({
      method: "PATCH",
      url: `/conversations/${a.id}`,
      payload: { title: "A renamed", archived: true },
    });
    expect(patched.json()).toMatchObject({ title: "A renamed", archived: true });

    const archived = await app.inject({
      method: "GET",
      url: `/projects/${project.id}/conversations?archived=true`,
    });
    expect(archived.json()).toHaveLength(1);
    const active = await app.inject({
      method: "GET",
      url: `/projects/${project.id}/conversations?archived=false`,
    });
    expect(active.json()).toHaveLength(1);
    const all = await app.inject({ method: "GET", url: `/projects/${project.id}/conversations` });
    expect(all.json()).toHaveLength(2);

    const empty = await app.inject({ method: "PATCH", url: `/conversations/${a.id}`, payload: {} });
    expect(empty.statusCode).toBe(400);
  });

  it("deletes messages with their conversation and with their project", async () => {
    const { app, db } = setup();
    const project = await createProject(app);
    const first = await createConversation(app, project.id);
    const second = await createConversation(app, project.id);
    await post(app, `/conversations/${first.id}/messages`, { content: "a" });
    await post(app, `/conversations/${second.id}/messages`, { content: "b" });

    expect((await app.inject({ method: "DELETE", url: `/conversations/${first.id}` })).statusCode).toBe(204);
    const afterOne = db.prepare("SELECT COUNT(*) AS n FROM messages").get() as { n: number };
    expect(afterOne.n).toBe(1);

    await app.inject({ method: "DELETE", url: `/projects/${project.id}` });
    const afterProject = db.prepare("SELECT COUNT(*) AS n FROM messages").get() as { n: number };
    expect(afterProject.n).toBe(0);
  });

  it("keeps message text out of the audit log", async () => {
    const { app, db } = setup();
    const project = await createProject(app);
    const conversation = await createConversation(app, project.id, "Private title");
    await post(app, `/conversations/${conversation.id}/messages`, { content: "very private words" });

    const events = db.prepare("SELECT type, detail FROM audit_events").all() as {
      type: string;
      detail: string;
    }[];
    expect(events.map((e) => e.type)).toContain("message.created");
    expect(events.some((e) => e.detail.includes("very private words"))).toBe(false);
    expect(events.some((e) => e.detail.includes("Private title"))).toBe(false);
  });
});
