// SPDX-License-Identifier: Apache-2.0
import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { openDatabase } from "../src/db.js";
import { createSecretBox } from "../src/secrets.js";

function setup() {
  const db = openDatabase(":memory:");
  return { db, app: buildApp(db, { secretKey: randomBytes(32) }) };
}

type TestApp = ReturnType<typeof setup>["app"];

const post = (app: TestApp, url: string, payload: object) =>
  app.inject({ method: "POST", url, payload });

const provider = (overrides: object = {}) => ({
  name: "Local",
  kind: "local",
  base_url: "http://127.0.0.1:11434/v1",
  model: "llama",
  ...overrides,
});

describe("secret box", () => {
  it("round-trips, randomizes, and rejects tampering or the wrong key", () => {
    const box = createSecretBox(randomBytes(32));
    const a = box.encrypt("sk-abc");
    const b = box.encrypt("sk-abc");
    expect(a).not.toBe(b);
    expect(box.decrypt(a)).toBe("sk-abc");

    const parts = a.split(":");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => box.decrypt(parts.join(":"))).toThrow();
    expect(() => createSecretBox(randomBytes(32)).decrypt(a)).toThrow();
    expect(() => box.decrypt("garbage")).toThrow();
  });

  it("requires a 32-byte key", () => {
    expect(() => createSecretBox(randomBytes(16))).toThrow();
  });
});

describe("providers", () => {
  it("never returns or stores the API key in clear text", async () => {
    const { app, db } = setup();
    const res = await post(
      app,
      "/providers",
      provider({ kind: "hosted", base_url: "https://api.example.com/v1", api_key: "sk-secret-value" }),
    );
    expect(res.statusCode).toBe(201);
    expect(res.body).not.toContain("sk-secret-value");
    expect(res.json()).toMatchObject({ has_key: true, is_default: true });
    expect(res.json()).not.toHaveProperty("api_key_enc");

    const list = await app.inject({ method: "GET", url: "/providers" });
    expect(list.body).not.toContain("sk-secret-value");

    const row = db.prepare("SELECT api_key_enc FROM model_providers").get() as {
      api_key_enc: string;
    };
    expect(row.api_key_enc.startsWith("v1:")).toBe(true);
    expect(row.api_key_enc).not.toContain("sk-secret-value");

    const events = db.prepare("SELECT detail FROM audit_events").all() as { detail: string }[];
    expect(events.some((e) => e.detail.includes("sk-secret-value"))).toBe(false);
  });

  it("makes the first provider the default and lets the user switch", async () => {
    const { app } = setup();
    const a = (await post(app, "/providers", provider({ name: "A" }))).json() as { id: string };
    const b = (
      await post(app, "/providers", provider({ name: "B", is_default: true }))
    ).json() as { id: string };

    const list = (await app.inject({ method: "GET", url: "/providers" })).json() as {
      id: string;
      is_default: boolean;
    }[];
    expect(list.find((p) => p.id === a.id)?.is_default).toBe(false);
    expect(list.find((p) => p.id === b.id)?.is_default).toBe(true);

    const patched = await app.inject({
      method: "PATCH",
      url: `/providers/${a.id}`,
      payload: { is_default: true },
    });
    expect(patched.json()).toMatchObject({ is_default: true });
    const after = (await app.inject({ method: "GET", url: "/providers" })).json() as {
      is_default: boolean;
    }[];
    expect(after.filter((p) => p.is_default)).toHaveLength(1);
  });

  it("validates addresses and refuses keys over plain http to other hosts", async () => {
    const { app } = setup();
    expect((await post(app, "/providers", provider({ base_url: "not a url" }))).statusCode).toBe(400);
    expect((await post(app, "/providers", provider({ base_url: "ftp://example.com" }))).statusCode).toBe(400);

    const insecure = await post(
      app,
      "/providers",
      provider({ kind: "hosted", base_url: "http://example.com/v1", api_key: "k" }),
    );
    expect(insecure.statusCode).toBe(400);
    expect(insecure.json()).toEqual({ error: "key_requires_https" });

    const loopback = await post(app, "/providers", provider({ api_key: "k" }));
    expect(loopback.statusCode).toBe(201);
  });

  it("rotates and clears keys and re-checks transport rules on update", async () => {
    const { app } = setup();
    const created = (await post(app, "/providers", provider({ api_key: "old" }))).json() as {
      id: string;
    };

    const rotate = await app.inject({
      method: "PATCH",
      url: `/providers/${created.id}`,
      payload: { api_key: "new" },
    });
    expect(rotate.json()).toMatchObject({ has_key: true });

    const moveToHttp = await app.inject({
      method: "PATCH",
      url: `/providers/${created.id}`,
      payload: { base_url: "http://example.com/v1" },
    });
    expect(moveToHttp.statusCode).toBe(400);

    const conflicting = await app.inject({
      method: "PATCH",
      url: `/providers/${created.id}`,
      payload: { api_key: "x", clear_key: true },
    });
    expect(conflicting.statusCode).toBe(400);

    const cleared = await app.inject({
      method: "PATCH",
      url: `/providers/${created.id}`,
      payload: { clear_key: true },
    });
    expect(cleared.json()).toMatchObject({ has_key: false });

    const nowHttp = await app.inject({
      method: "PATCH",
      url: `/providers/${created.id}`,
      payload: { base_url: "http://example.com/v1" },
    });
    expect(nowHttp.statusCode).toBe(200);
  });

  it("deletes a provider", async () => {
    const { app } = setup();
    const created = (await post(app, "/providers", provider())).json() as { id: string };
    expect((await app.inject({ method: "DELETE", url: `/providers/${created.id}` })).statusCode).toBe(204);
    expect((await app.inject({ method: "GET", url: `/providers/${created.id}` })).statusCode).toBe(404);
  });

  it("requires a session when authentication is enabled", async () => {
    const db = openDatabase(":memory:");
    const app = buildApp(db, { auth: { scryptN: 1024 } });
    expect((await app.inject({ method: "GET", url: "/providers" })).statusCode).toBe(401);
    expect((await app.inject({ method: "POST", url: "/conversations/x/reply" })).statusCode).toBe(401);
  });
});
