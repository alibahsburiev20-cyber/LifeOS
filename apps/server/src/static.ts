// SPDX-License-Identifier: Apache-2.0
import { readFileSync } from "node:fs";
import type { FastifyInstance } from "fastify";

// Serves the web interface (apps/server/public). Only these three exact paths are served,
// so nothing else on disk can be reached through this module.

const FILES: Record<string, { name: string; type: string }> = {
  "/": { name: "index.html", type: "text/html; charset=utf-8" },
  "/app.js": { name: "app.js", type: "text/javascript; charset=utf-8" },
  "/app.css": { name: "app.css", type: "text/css; charset=utf-8" },
};

// No inline scripts or styles, no external resources, no framing.
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export function registerStatic(app: FastifyInstance): void {
  const directory = new URL("../public/", import.meta.url);
  for (const [path, file] of Object.entries(FILES)) {
    const content = readFileSync(new URL(file.name, directory));
    app.get(path, async (_req, reply) =>
      reply
        .header("Content-Type", file.type)
        .header("Cache-Control", "no-cache")
        .header("Content-Security-Policy", CONTENT_SECURITY_POLICY)
        .header("X-Content-Type-Options", "nosniff")
        .header("X-Frame-Options", "DENY")
        .header("Referrer-Policy", "no-referrer")
        .send(content),
    );
  }
}
