// SPDX-License-Identifier: Apache-2.0
import type { Database as Db } from "better-sqlite3";
import type { FastifyInstance } from "fastify";
import { buildApp, type AppOptions } from "./app.js";
import { registerStatic } from "./static.js";

/** The API plus the web interface. index.ts uses this; API-only tests use buildApp. */
export function buildServer(db: Db, options: AppOptions = {}): FastifyInstance {
  const app = buildApp(db, options);
  registerStatic(app);
  return app;
}
