// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { RouteContext } from "./context.js";

// Conversations and messages. Until the model gateway exists, the API only stores
// messages written by the user; assistant messages will be written by the server later.

type Row = Record<string, unknown>;

const title = z.string().trim().min(1).max(200);

const conversationCreate = z.object({ title: title.optional() });
const conversationUpdate = z.object({ title: title.optional(), archived: z.boolean().optional() });
const messageCreate = z.object({ content: z.string().trim().min(1).max(50_000) });
const conversationQuery = z.object({ archived: z.enum(["true", "false"]).optional() });
const messageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});

const present = (row: Row) => ({ ...row, archived: row.archived === 1 });

export function registerConversationRoutes(app: FastifyInstance, ctx: RouteContext): void {
  const { db, audit, now, notFound } = ctx;

  const projectExists = (id: string) =>
    db.prepare("SELECT 1 AS present FROM projects WHERE id = ?").get(id) !== undefined;
  const getConversation = (id: string) =>
    db.prepare("SELECT * FROM conversations WHERE id = ?").get(id) as Row | undefined;

  app.post("/projects/:id/conversations", async (req, reply) => {
    const { id: projectId } = req.params as { id: string };
    const body = conversationCreate.parse(req.body ?? {});
    if (!projectExists(projectId)) return notFound(reply);

    const id = randomUUID();
    const ts = now();
    db.prepare(
      "INSERT INTO conversations (id, project_id, title, archived, created_at, updated_at) VALUES (?, ?, ?, 0, ?, ?)",
    ).run(id, projectId, body.title ?? "New conversation", ts, ts);
    audit("conversation.created", { project_id: projectId }, { conversation_id: id });
    return reply.status(201).send(present(getConversation(id) as Row));
  });

  app.get("/projects/:id/conversations", async (req, reply) => {
    const { id: projectId } = req.params as { id: string };
    const q = conversationQuery.parse(req.query);
    if (!projectExists(projectId)) return notFound(reply);

    const rows =
      q.archived === undefined
        ? db
            .prepare("SELECT * FROM conversations WHERE project_id = ? ORDER BY updated_at DESC")
            .all(projectId)
        : db
            .prepare(
              "SELECT * FROM conversations WHERE project_id = ? AND archived = ? ORDER BY updated_at DESC",
            )
            .all(projectId, q.archived === "true" ? 1 : 0);
    return (rows as Row[]).map(present);
  });

  app.get("/conversations/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const conversation = getConversation(id);
    return conversation ? present(conversation) : notFound(reply);
  });

  app.patch("/conversations/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = conversationUpdate.parse(req.body);
    const existing = getConversation(id);
    if (!existing) return notFound(reply);

    const sets: string[] = [];
    const values: unknown[] = [];
    if (body.title !== undefined) {
      sets.push("title = ?");
      values.push(body.title);
    }
    if (body.archived !== undefined) {
      sets.push("archived = ?");
      values.push(body.archived ? 1 : 0);
    }
    if (sets.length === 0) return reply.status(400).send({ error: "no_fields" });

    sets.push("updated_at = ?");
    values.push(now(), id);
    db.prepare(`UPDATE conversations SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    audit(
      "conversation.updated",
      { project_id: existing.project_id as string },
      { conversation_id: id, fields: Object.keys(body) },
    );
    return present(getConversation(id) as Row);
  });

  app.delete("/conversations/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const existing = getConversation(id);
    if (!existing) return notFound(reply);
    db.prepare("DELETE FROM conversations WHERE id = ?").run(id);
    audit("conversation.deleted", { project_id: existing.project_id as string }, { conversation_id: id });
    return reply.status(204).send();
  });

  app.post("/conversations/:id/messages", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = messageCreate.parse(req.body);
    const conversation = getConversation(id);
    if (!conversation) return notFound(reply);

    const messageId = randomUUID();
    const ts = now();
    db.transaction(() => {
      db.prepare(
        "INSERT INTO messages (id, conversation_id, role, content, model_ref, created_at) VALUES (?, ?, 'user', ?, NULL, ?)",
      ).run(messageId, id, body.content, ts);
      db.prepare("UPDATE conversations SET updated_at = ? WHERE id = ?").run(ts, id);
    })();
    audit(
      "message.created",
      { project_id: conversation.project_id as string },
      { conversation_id: id },
    );
    return reply
      .status(201)
      .send(db.prepare("SELECT * FROM messages WHERE id = ?").get(messageId));
  });

  app.get("/conversations/:id/messages", async (req, reply) => {
    const { id } = req.params as { id: string };
    const q = messageQuery.parse(req.query);
    if (!getConversation(id)) return notFound(reply);
    return db
      .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY rowid ASC LIMIT ?")
      .all(id, q.limit);
  });
}
