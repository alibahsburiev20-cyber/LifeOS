// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { RouteContext } from "./context.js";

// Memory (see docs/phase-0/03-data-model.md). Memories are explicit, reviewable and editable.
// Deleting a memory removes its content; audit events never contain memory text.

type Row = Record<string, unknown>;

const KINDS = ["preference", "fact", "decision", "context"] as const;
const STATUSES = ["confirmed", "preference", "inferred"] as const;

const text = z.string().trim().min(1).max(5_000);

const memoryCreate = z.object({
  scope: z.enum(["global", "project"]),
  project_id: z.string().min(1).optional(),
  text,
  kind: z.enum(KINDS).optional(),
  status: z.enum(STATUSES).optional(),
  source: z.string().max(1_000).optional(),
  pinned: z.boolean().optional(),
});

const memoryUpdate = z.object({
  text: text.optional(),
  kind: z.enum(KINDS).optional(),
  status: z.enum(STATUSES).optional(),
  source: z.string().max(1_000).optional(),
  pinned: z.boolean().optional(),
});

const memoryQuery = z.object({
  scope: z.enum(["global", "project"]).optional(),
  project_id: z.string().min(1).optional(),
  status: z.enum(STATUSES).optional(),
  q: z.string().max(200).optional(),
});

const UPDATABLE = ["text", "kind", "status", "source", "pinned"] as const;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");
const present = (row: Row) => ({ ...row, pinned: row.pinned === 1 });

export function registerMemoryRoutes(app: FastifyInstance, ctx: RouteContext): void {
  const { db, audit, now, notFound } = ctx;

  const getMemory = (id: string) =>
    db.prepare("SELECT * FROM memories WHERE id = ?").get(id) as Row | undefined;
  const projectExists = (id: string) =>
    db.prepare("SELECT 1 AS present FROM projects WHERE id = ?").get(id) !== undefined;

  app.post("/memories", async (req, reply) => {
    const body = memoryCreate.parse(req.body);
    if (body.scope === "global" && body.project_id) {
      return reply.status(400).send({ error: "global_memory_has_no_project" });
    }
    if (body.scope === "project") {
      if (!body.project_id) return reply.status(400).send({ error: "project_id_required" });
      if (!projectExists(body.project_id)) return notFound(reply);
    }

    const id = randomUUID();
    const ts = now();
    const kind = body.kind ?? "fact";
    const status = body.status ?? "confirmed";
    db.prepare(
      "INSERT INTO memories (id, scope, project_id, text, kind, status, source, pinned, recorded_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      id,
      body.scope,
      body.project_id ?? null,
      body.text,
      kind,
      status,
      body.source ?? "",
      body.pinned ? 1 : 0,
      ts,
      ts,
    );
    audit("memory.created", { project_id: body.project_id }, { scope: body.scope, kind, status });
    return reply.status(201).send(present(getMemory(id) as Row));
  });

  app.get("/memories", async (req) => {
    const q = memoryQuery.parse(req.query);
    const where: string[] = [];
    const params: unknown[] = [];
    if (q.scope) {
      where.push("scope = ?");
      params.push(q.scope);
    }
    if (q.project_id) {
      where.push("project_id = ?");
      params.push(q.project_id);
    }
    if (q.status) {
      where.push("status = ?");
      params.push(q.status);
    }
    if (q.q) {
      where.push("text LIKE ? ESCAPE '\\'");
      params.push(`%${escapeLike(q.q)}%`);
    }
    const sql = `SELECT * FROM memories${
      where.length > 0 ? ` WHERE ${where.join(" AND ")}` : ""
    } ORDER BY pinned DESC, recorded_at DESC`;
    return (db.prepare(sql).all(...params) as Row[]).map(present);
  });

  app.get("/memories/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const memory = getMemory(id);
    return memory ? present(memory) : notFound(reply);
  });

  app.patch("/memories/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = memoryUpdate.parse(req.body);
    const existing = getMemory(id);
    if (!existing) return notFound(reply);

    const sets: string[] = [];
    const values: unknown[] = [];
    const fields: string[] = [];
    for (const key of UPDATABLE) {
      const value = body[key];
      if (value !== undefined) {
        sets.push(`${key} = ?`);
        values.push(key === "pinned" ? (value ? 1 : 0) : value);
        fields.push(key);
      }
    }
    if (sets.length === 0) return reply.status(400).send({ error: "no_fields" });

    sets.push("updated_at = ?");
    values.push(now(), id);
    db.prepare(`UPDATE memories SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    audit("memory.updated", { project_id: (existing.project_id as string | null) ?? undefined }, { fields });
    return present(getMemory(id) as Row);
  });

  // Deletion removes the content for good; only non-content metadata stays in the audit log.
  app.delete("/memories/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = getMemory(id);
    if (!existing) return notFound(reply);
    db.prepare("DELETE FROM memories WHERE id = ?").run(id);
    audit("memory.deleted", { project_id: (existing.project_id as string | null) ?? undefined });
    return reply.status(204).send();
  });
}
