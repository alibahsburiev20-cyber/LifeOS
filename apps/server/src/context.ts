// SPDX-License-Identifier: Apache-2.0
import type { Database as Db } from "better-sqlite3";
import type { FastifyReply } from "fastify";
import type { AuditFn } from "./auth.js";

/** Shared helpers handed to route modules so they do not depend on app.ts internals. */
export interface RouteContext {
  db: Db;
  audit: AuditFn;
  now: () => string;
  notFound: (reply: FastifyReply) => FastifyReply;
}
