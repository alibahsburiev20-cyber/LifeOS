// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import { SESSION_COOKIE } from "../src/auth.js";
import { openDatabase } from "../src/db.js";

const PASSPHRASE = "correct horse battery";

// Low scrypt cost keeps the tests fast; production uses the default.
function setup(secureCookies = false) {
  const db = openDatabase(":memory:");
  const app = buildApp(db, { auth: { scryptN: 1024, secureCookies } });
  return { db, app };
}

type TestApp = ReturnType<typeof setup>["app"];

function rawSetCookie(res: { headers: Record<string, unknown> }): string {
  const value = res.headers["set-cookie"];
  return String(Array.isArray(value) ? value[0] : value);
}

function sessionCookieOf(res: { headers: Record<string, unknown> }): string {
  return rawSetCookie(res).split(";")[0] as string;
}

async function setupAndLogin(app: TestApp): Promise<string> {
  const res = await app.inject({
    method: "POST",
    url: "/auth/setup",
    payload: { passphrase: PASSPHRASE },
  });
  expect(res.statusCode).toBe(201);
  return sessionCookieOf(res);
}

describe("authentication", () => {
  it("keeps /health public and everything else locked before setup", async () => {
    const { app } = setup();
    expect((await app.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);

    const projects = await app.inject({ method: "GET", url: "/projects" });
    expect(projects.statusCode).toBe(401);
    expect(projects.json()).toEqual({ error: "setup_required" });

    const status = await app.inject({ method: "GET", url: "/auth/status" });
    expect(status.json()).toEqual({ configured: false, authenticated: false });
  });

  it("rejects a short passphrase", async () => {
    const { app } = setup();
    const res = await app.inject({
      method: "POST",
      url: "/auth/setup",
      payload: { passphrase: "short" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("sets up, issues a session and protects the API", async () => {
    const { app } = setup();
    const cookie = await setupAndLogin(app);

    const ok = await app.inject({ method: "GET", url: "/projects", headers: { cookie } });
    expect(ok.statusCode).toBe(200);

    const anonymous = await app.inject({ method: "GET", url: "/projects" });
    expect(anonymous.statusCode).toBe(401);
    expect(anonymous.json()).toEqual({ error: "unauthorized" });

    const status = await app.inject({ method: "GET", url: "/auth/status", headers: { cookie } });
    expect(status.json()).toEqual({ configured: true, authenticated: true });
  });

  it("refuses a second setup", async () => {
    const { app } = setup();
    await setupAndLogin(app);
    const again = await app.inject({
      method: "POST",
      url: "/auth/setup",
      payload: { passphrase: "another passphrase!" },
    });
    expect(again.statusCode).toBe(409);
  });

  it("logs in with the right passphrase and rejects a wrong one", async () => {
    const { app } = setup();
    await setupAndLogin(app);

    const wrong = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { passphrase: "wrong passphrase!!" },
    });
    expect(wrong.statusCode).toBe(401);
    expect(wrong.headers["set-cookie"]).toBeUndefined();

    const right = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { passphrase: PASSPHRASE },
    });
    expect(right.statusCode).toBe(200);
    const cookie = sessionCookieOf(right);
    const res = await app.inject({ method: "GET", url: "/projects", headers: { cookie } });
    expect(res.statusCode).toBe(200);
  });

  it("invalidates the session on logout", async () => {
    const { app } = setup();
    const cookie = await setupAndLogin(app);

    const out = await app.inject({ method: "POST", url: "/auth/logout", headers: { cookie } });
    expect(out.statusCode).toBe(204);

    const after = await app.inject({ method: "GET", url: "/projects", headers: { cookie } });
    expect(after.statusCode).toBe(401);
  });

  it("locks out after repeated failed logins", async () => {
    const { app } = setup();
    await setupAndLogin(app);

    for (let i = 0; i < 5; i++) {
      const res = await app.inject({
        method: "POST",
        url: "/auth/login",
        payload: { passphrase: "wrong passphrase!!" },
      });
      expect(res.statusCode).toBe(401);
    }
    const blocked = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { passphrase: PASSPHRASE },
    });
    expect(blocked.statusCode).toBe(429);
    expect(blocked.headers["retry-after"]).toBeDefined();
  });

  it("sets HttpOnly and SameSite=Strict, and Secure only when configured", async () => {
    const plain = setup(false);
    const res = await plain.app.inject({
      method: "POST",
      url: "/auth/setup",
      payload: { passphrase: PASSPHRASE },
    });
    const header = rawSetCookie(res);
    expect(header).toContain(`${SESSION_COOKIE}=`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("SameSite=Strict");
    expect(header).not.toContain("Secure");

    const secure = setup(true);
    const res2 = await secure.app.inject({
      method: "POST",
      url: "/auth/setup",
      payload: { passphrase: PASSPHRASE },
    });
    expect(rawSetCookie(res2)).toContain("Secure");
  });

  it("rejects expired sessions", async () => {
    const { app, db } = setup();
    const cookie = await setupAndLogin(app);
    db.prepare("UPDATE sessions SET expires_at = ?").run("2000-01-01T00:00:00.000Z");

    const res = await app.inject({ method: "GET", url: "/projects", headers: { cookie } });
    expect(res.statusCode).toBe(401);
  });

  it("blocks state-changing requests from a foreign Origin", async () => {
    const { app } = setup();
    const cookie = await setupAndLogin(app);

    const foreign = await app.inject({
      method: "POST",
      url: "/projects",
      headers: { cookie, origin: "https://evil.example" },
      payload: { name: "x" },
    });
    expect(foreign.statusCode).toBe(403);

    const same = await app.inject({
      method: "POST",
      url: "/projects",
      headers: { cookie, host: "app.test:3000", origin: "http://app.test:3000" },
      payload: { name: "x" },
    });
    expect(same.statusCode).toBe(201);
  });

  it("never stores the passphrase or logs it", async () => {
    const { app, db } = setup();
    await setupAndLogin(app);
    await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { passphrase: "wrong passphrase!!" },
    });

    const row = db.prepare("SELECT password_hash FROM auth_credentials").get() as {
      password_hash: string;
    };
    expect(row.password_hash.startsWith("scrypt$")).toBe(true);
    expect(row.password_hash).not.toContain(PASSPHRASE);

    const events = db.prepare("SELECT type, detail FROM audit_events").all() as {
      type: string;
      detail: string;
    }[];
    const types = events.map((e) => e.type);
    expect(types).toContain("auth.setup");
    expect(types).toContain("auth.login_failed");
    expect(events.some((e) => e.detail.includes(PASSPHRASE))).toBe(false);
    expect(events.some((e) => e.detail.includes("wrong passphrase"))).toBe(false);
  });
});
