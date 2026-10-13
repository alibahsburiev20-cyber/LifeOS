// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import Fastify, { type FastifyError, type FastifyInstance, type FastifyReply } from "fastify";
import type { Database as Db } from "better-sqlite3";
import { z } from "zod";
import { registerAuth, type AuditFn, type AuthOptions } from "./auth.js";
import { canTransition, TASK_STATES, type TaskState } from "./tasks.js";

type Row = Record<string, unknown>;

export interface AppOptions {
  /**
   * Enables authentication. Production (index.ts) always passes this.
   * Leaving it undefined disables authentication and is meant for internal tests only.
   */
  auth?: AuthOptions;
}

const projectCreate = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(10_000).optional(),
  goal: z.string().max(10_000).optional(),
  instructions: z.string().max(20_000).optional(),
});

const projectUpdate = projectCreate
  .partial()
  .extend({ status: z.enum(["active", "archived"]).optional() });

const taskCreate = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().max(10_000).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  definition_of_done: z.string().max(5_000).optional(),
  parent_task_id: z.string().min(1).optional(),
});

const transitionBody = z.object({ to: z.enum(TASK_STATES) });

const PROJECT_FIELDS = ["name", "description", "goal", "instructions", "status"] as const;

export function buildApp(db: Db, options: AppOptions = {}): FastifyInstance {
  const app = Fastify({ logger: false });
  const now = () => new Date().toISOString();

  const getProject = (id: string) =>
    db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as Row | undefined;
  const getTask = (id: string) =>
    db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Row | undefined;
  const notFound = (reply: FastifyReply) => reply.status(404).send({ error: "not_found" });

  // API calls are made by the user in Phase 1. Detail must never contain user content.
  const audit: AuditFn = (type, ids, detail = {}, actor = "user") => {
    db.prepare(
      "INSERT INTO audit_events (id, created_at, actor, type, project_id, task_id, detail) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      randomUUID(),
      now(),
      actor,
      type,
      ids.project_id ?? null,
      ids.task_id ?? null,
      JSON.stringify(detail),
    );
  };

  app.setErrorHandler((err: FastifyError, _req, reply) => {
    if (err instanceof z.ZodError) {
      return reply.status(400).send({ error: "validation_error", issues: err.issues });
    }
    const status = err.statusCode ?? 500;
    return reply
      .status(status)
      .send({ error: status < 500 ? err.message : "internal_error" });
  });

  // Must be registered before the routes below so that its hook covers all of them.
  if (options.auth) {
    registerAuth(app, db, options.auth, audit);
  }

  app.get("/health", async () => ({ status: "ok" }));

  // ---- Projects ----

  app.post("/projects", async (req, reply) => {
    const body = projectCreate.parse(req.body);
    const id = randomUUID();
    const ts = now();
    db.prepare(
      "INSERT INTO projects (id, name, description, goal, instructions, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'active', ?, ?)",
    ).run(id, body.name, body.description ?? "", body.goal ?? "", body.instructions ?? "", ts, ts);
    audit("project.created", { project_id: id });
    return reply.status(201).send(getProject(id));
  });

  app.get("/projects", async (req) => {
    const q = z
      .object({ status: z.enum(["active", "archived"]).optional() })
      .parse(req.query);
    return q.status
      ? db.prepare("SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC").all(q.status)
      : db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
  });

  app.get("/projects/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const project = getProject(id);
    return project ?? notFound(reply);
  });

  app.patch("/projects/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = projectUpdate.parse(req.body);
    if (!getProject(id)) return notFound(reply);

    const sets: string[] = [];
    const values: unknown[] = [];
    for (const key of PROJECT_FIELDS) {
      if (body[key] !== undefined) {
        sets.push(`${key} = ?`);
        values.push(body[key]);
      }
    }
    if (sets.length === 0) {
      return reply.status(400).send({ error: "no_fields" });
    }
    sets.push("updated_at = ?");
    values.push(now(), id);
    db.prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    audit("project.updated", { project_id: id }, { fields: Object.keys(body) });
    return getProject(id);
  });

  app.delete("/projects/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    if (result.changes === 0) return notFound(reply);
    audit("project.deleted", { project_id: id });
    return reply.status(204).send();
  });

  // ---- Tasks ----

  app.post("/projects/:id/tasks", async (req, reply) => {
    const { id: projectId } = req.params as { id: string };
    const body = taskCreate.parse(req.body);
    if (!getProject(projectId)) return notFound(reply);

    if (body.parent_task_id) {
      const parent = getTask(body.parent_task_id);
      if (!parent || parent.project_id !== projectId) {
        return reply.status(400).send({ error: "invalid_parent_task" });
      }
    }

    const id = randomUUID();
    const ts = now();
    db.prepare(
      "INSERT INTO tasks (id, project_id, parent_task_id, title, description, state, priority, definition_of_done, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'planned', ?, ?, 'user', ?, ?)",
    ).run(
      id,
      projectId,
      body.parent_task_id ?? null,
      body.title,
      body.description ?? "",
      body.priority ?? 0,
      body.definition_of_done ?? "",
      ts,
      ts,
    );
    audit("task.created", { project_id: projectId, task_id: id });
    return reply.status(201).send(getTask(id));
  });

  app.get("/projects/:id/tasks", async (req, reply) => {
    const { id: projectId } = req.params as { id: string };
    if (!getProject(projectId)) return notFound(reply);
    return db
      .prepare("SELECT * FROM tasks WHERE project_id = ? ORDER BY priority DESC, created_at ASC")
      .all(projectId);
  });

  app.get("/tasks/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const task = getTask(id);
    return task ?? notFound(reply);
  });

  app.post("/tasks/:id/transition", async (req, reply) => {
    const { id } = req.params as { id: string };
    const { to } = transitionBody.parse(req.body);
    const task = getTask(id);
    if (!task) return notFound(reply);

    const from = task.state as TaskState;
    if (!canTransition(from, to)) {
      return reply.status(409).send({ error: "invalid_transition", from, to });
    }
    db.prepare("UPDATE tasks SET state = ?, updated_at = ? WHERE id = ?").run(to, now(), id);
    audit("task.transition", { project_id: task.project_id as string, task_id: id }, { from, to });
    return getTask(id);
  });

  return app;
}
