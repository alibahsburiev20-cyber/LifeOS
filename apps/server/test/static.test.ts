// SPDX-License-Identifier: Apache-2.0
import { describe, expect, it } from "vitest";
import { openDatabase } from "../src/db.js";
import { buildApp } from "../src/app.js";
import { buildServer } from "../src/server.js";

function setup() {
  const db = openDatabase(":memory:");
  return buildServer(db, { auth: { scryptN: 1024 } });
}

describe("web interface", () => {
  it("serves the page without a session, with strict security headers", async () => {
    const res = await setup().inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");

    const csp = String(res.headers["content-security-policy"]);
    expect(csp).toContain("default-src 'none'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("uses no inline script, style or event handler in the page", async () => {
    const html = (await setup().inject({ method: "GET", url: "/" })).body;
    expect(html).toMatch(/<script[^>]*\bsrc="\/app\.js"/);
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)/i);
    expect(html).not.toMatch(/\sstyle=/i);
    expect(html).not.toMatch(/\son[a-z]+=/i);
  });

  it("serves the script and the stylesheet", async () => {
    const app = setup();
    const js = await app.inject({ method: "GET", url: "/app.js" });
    expect(js.statusCode).toBe(200);
    expect(js.headers["content-type"]).toContain("javascript");
    expect(js.body).toContain("use strict");

    const css = await app.inject({ method: "GET", url: "/app.css" });
    expect(css.statusCode).toBe(200);
    expect(css.headers["content-type"]).toContain("text/css");
  });

  it("never inserts text as HTML (no injection sinks in the script)", async () => {
    const js = (await setup().inject({ method: "GET", url: "/app.js" })).body;
    expect(js).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function/);
  });

  it("keeps the data API protected and exposes nothing else", async () => {
    const app = setup();
    expect((await app.inject({ method: "GET", url: "/projects" })).statusCode).toBe(401);
    expect((await app.inject({ method: "GET", url: "/auth/status" })).statusCode).toBe(200);
    expect((await app.inject({ method: "GET", url: "/package.json" })).statusCode).not.toBe(200);
    expect((await app.inject({ method: "GET", url: "/../package.json" })).statusCode).not.toBe(200);
  });

  it("does not serve the page from the API-only app", async () => {
    const app = buildApp(openDatabase(":memory:"));
    expect((await app.inject({ method: "GET", url: "/" })).statusCode).toBe(404);
  });
});
