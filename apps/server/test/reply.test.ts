// SPDX-License-Identifier: Apache-2.0
import { randomBytes } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { openDatabase } from "../src/db.js";

type ModelRequest = { model: string; messages: { role: string; content: string }[] };

interface Fake {
  url: string;
  requests: { authorization: string | undefined; body: ModelRequest }[];
  close(): Promise<void>;
}

interface FakeReply {
  status?: number;
  body?: unknown;
  delayMs?: number;
  headers?: Record<string, string>;
}

const fakes: Fake[] = [];
afterEach(async () => {
  await Promise.all(fakes.splice(0).map((fake) => fake.close()));
});

// A tiny OpenAI-compatible model server that records what it receives.
async function startFake(respond: (body: ModelRequest) => FakeReply): Promise<Fake> {
  const requests: Fake["requests"] = [];
  const server: Server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      const body = JSON.parse(raw) as ModelRequest;
      requests.push({ authorization: req.headers.authorization, body });
      const out = respond(body);
      const send = () => {
        res.writeHead(out.status ?? 200, {
          "content-type": "application/json",
          ...(out.headers ?? {}),
        });
        res.end(JSON.stringify(out.body ?? {}));
      };
      if (out.delayMs) setTimeout(send, out.delayMs);
      else send();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  const fake: Fake = {
    url: `http://127.0.0.1:${port}/v1`,
    requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
  fakes.push(fake);
  return fake;
}

const okBody = (content: string) => ({ choices: [{ message: { role: "assistant", content } }] });

function setup(options: { gatewayTimeoutMs?: number } = {}) {
  const db = openDatabase(":memory:");
  return { db, app: buildApp(db, { secretKey: randomBytes(32), ...options }) };
}

type TestApp = ReturnType<typeof setup>["app"];

const post = (app: TestApp, url: string, payload: object = {}) =>
  app.inject({ method: "POST", url, payload });

async function createProject(app: TestApp, fields: object = { name: "Project" }) {
  return (await post(app, "/projects", fields)).json() as { id: string };
}

async function conversationWithMessage(app: TestApp, projectId: string, content = "Hello") {
  const conversation = (await post(app, `/projects/${projectId}/conversations`)).json() as {
    id: string;
  };
  await post(app, `/conversations/${conversation.id}/messages`, { content });
  return conversation;
}

async function addProvider(app: TestApp, url: string, extra: object = {}) {
  const res = await post(app, "/providers", {
    name: "Local",
    kind: "local",
    base_url: url,
    model: "test-model",
    ...extra,
  });
  expect(res.statusCode).toBe(201);
  return res.json() as { id: string };
}

describe("assistant reply", () => {
  it("sends project context and confirmed memory to the model and stores the reply", async () => {
    const fake = await startFake(() => ({ body: okBody("Here is a plan.") }));
    const { app, db } = setup();
    const project = await createProject(app, {
      name: "Thesis",
      goal: "Finish chapter 2",
      instructions: "Answer briefly",
    });
    const other = await createProject(app, { name: "Other" });
    await post(app, "/memories", { scope: "global", text: "User prefers examples" });
    await post(app, "/memories", {
      scope: "project",
      project_id: project.id,
      text: "Deadline is Friday",
    });
    await post(app, "/memories", { scope: "global", text: "Might like jazz", status: "inferred" });
    await post(app, "/memories", { scope: "project", project_id: other.id, text: "Other project secret" });
    await addProvider(app, fake.url, { api_key: "sk-test-123" });
    const conversation = await conversationWithMessage(app, project.id, "Help me plan");

    const res = await post(app, `/conversations/${conversation.id}/reply`);
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      role: "assistant",
      content: "Here is a plan.",
    });
    expect((res.json() as { model_ref: string }).model_ref).toContain("test-model");

    expect(fake.requests).toHaveLength(1);
    const request = fake.requests[0] as Fake["requests"][number];
    expect(request.authorization).toBe("Bearer sk-test-123");
    expect(request.body.model).toBe("test-model");

    const system = request.body.messages[0] as { role: string; content: string };
    expect(system.role).toBe("system");
    for (const expected of ["Thesis", "Finish chapter 2", "Answer briefly", "User prefers examples", "Deadline is Friday"]) {
      expect(system.content).toContain(expected);
    }
    expect(system.content).not.toContain("Might like jazz");
    expect(system.content).not.toContain("Other project secret");
    expect(request.body.messages.at(-1)).toEqual({ role: "user", content: "Help me plan" });

    const events = db.prepare("SELECT type, detail FROM audit_events").all() as {
      type: string;
      detail: string;
    }[];
    expect(events.map((e) => e.type)).toContain("message.assistant_created");
    expect(events.some((e) => e.detail.includes("Here is a plan."))).toBe(false);
    expect(events.some((e) => e.detail.includes("Help me plan"))).toBe(false);
    expect(events.some((e) => e.detail.includes("sk-test-123"))).toBe(false);

    // The last message is now from the assistant, so there is nothing to answer.
    const again = await post(app, `/conversations/${conversation.id}/reply`);
    expect(again.statusCode).toBe(409);
    expect(again.json()).toEqual({ error: "nothing_to_answer" });
  });

  it("explains what is missing before calling any model", async () => {
    const { app } = setup();
    const project = await createProject(app);
    expect((await post(app, "/conversations/nope/reply")).statusCode).toBe(404);

    const empty = (await post(app, `/projects/${project.id}/conversations`)).json() as { id: string };
    const noProvider = await post(app, `/conversations/${empty.id}/reply`);
    expect(noProvider.statusCode).toBe(409);
    expect(noProvider.json()).toEqual({ error: "no_provider_configured" });

    await addProvider(app, "http://127.0.0.1:1/v1");
    const noMessages = await post(app, `/conversations/${empty.id}/reply`);
    expect(noMessages.statusCode).toBe(400);
    expect(noMessages.json()).toEqual({ error: "empty_conversation" });

    const unknownProvider = await post(app, `/conversations/${empty.id}/reply`, {
      provider_id: "nope",
    });
    expect(unknownProvider.statusCode).toBe(404);
  });

  it("returns 502 and stores nothing when the model fails", async () => {
    const { app, db } = setup();
    const project = await createProject(app);
    const conversation = await conversationWithMessage(app, project.id);

    const failing = await startFake(() => ({ status: 500, body: { error: "boom" } }));
    const badShape = await startFake(() => ({ body: { nothing: true } }));
    const redirecting = await startFake(() => ({
      status: 302,
      headers: { location: "http://127.0.0.1:1/elsewhere" },
    }));

    const cases: [string, string | undefined][] = [
      [failing.url, "bad_status"],
      [badShape.url, "bad_response"],
      [redirecting.url, undefined],
      ["http://127.0.0.1:1/v1", "unreachable"],
    ];
    for (const [url, reason] of cases) {
      const provider = await addProvider(app, url, { name: `P-${url}`, is_default: true });
      const res = await post(app, `/conversations/${conversation.id}/reply`, {
        provider_id: provider.id,
      });
      expect(res.statusCode).toBe(502);
      expect(res.json()).toMatchObject({ error: "model_unavailable" });
      if (reason) expect(res.json()).toMatchObject({ reason });
    }

    const messages = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE role = 'assistant'").get() as {
      n: number;
    };
    expect(messages.n).toBe(0);
    const failures = db
      .prepare("SELECT actor FROM audit_events WHERE type = 'model.call_failed'")
      .all() as { actor: string }[];
    expect(failures).toHaveLength(cases.length);
    expect(failures.every((f) => f.actor === "system")).toBe(true);
  });

  it("times out slow models", async () => {
    const slow = await startFake(() => ({ body: okBody("late"), delayMs: 1500 }));
    const { app } = setup({ gatewayTimeoutMs: 100 });
    const project = await createProject(app);
    const conversation = await conversationWithMessage(app, project.id);
    await addProvider(app, slow.url);

    const res = await post(app, `/conversations/${conversation.id}/reply`);
    expect(res.statusCode).toBe(502);
    expect(res.json()).toMatchObject({ reason: "timeout" });
  });

  it("reports an unreadable stored key instead of calling the model", async () => {
    const fake = await startFake(() => ({ body: okBody("unused") }));
    const { app, db } = setup();
    const project = await createProject(app);
    const conversation = await conversationWithMessage(app, project.id);
    await addProvider(app, fake.url, { api_key: "sk-test" });
    db.prepare("UPDATE model_providers SET api_key_enc = 'v1:AAAA:AAAA:AAAA'").run();

    const res = await post(app, `/conversations/${conversation.id}/reply`);
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({ error: "provider_key_unreadable" });
    expect(fake.requests).toHaveLength(0);
  });
});
