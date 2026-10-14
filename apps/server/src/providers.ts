// SPDX-License-Identifier: Apache-2.0
import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { RouteContext } from "./context.js";

// Model providers (ADR 0003). API keys are encrypted at rest and never returned by the API.

type Row = Record<string, unknown>;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

const providerCreate = z.object({
  name: z.string().trim().min(1).max(100),
  kind: z.enum(["local", "hosted"]),
  base_url: z.string().trim().min(1).max(500),
  model: z.string().trim().min(1).max(200),
  api_key: z.string().min(1).max(500).optional(),
  is_default: z.boolean().optional(),
});

const providerUpdate = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  base_url: z.string().trim().min(1).max(500).optional(),
  model: z.string().trim().min(1).max(200).optional(),
  api_key: z.string().min(1).max(500).optional(),
  clear_key: z.boolean().optional(),
  is_default: z.literal(true).optional(),
});

/** Returns an error code, or null when the address is acceptable. */
function transportError(baseUrl: string, hasKey: boolean): string | null {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return "invalid_base_url";
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return "invalid_base_url";
  // A key must not travel in clear text over a network.
  if (hasKey && url.protocol === "http:" && !LOOPBACK_HOSTS.has(url.hostname)) {
    return "key_requires_https";
  }
  return null;
}

function present(row: Row) {
  const { api_key_enc: encryptedKey, ...rest } = row;
  return { ...rest, has_key: encryptedKey !== null, is_default: row.is_default === 1 };
}

export function registerProviderRoutes(app: FastifyInstance, ctx: RouteContext): void {
  const { db, audit, now, notFound, secrets } = ctx;

  const getProvider = (id: string) =>
    db.prepare("SELECT * FROM model_providers WHERE id = ?").get(id) as Row | undefined;

  app.post("/providers", async (req, reply) => {
    const body = providerCreate.parse(req.body);
    const problem = transportError(body.base_url, body.api_key !== undefined);
    if (problem) return reply.status(400).send({ error: problem });

    const id = randomUUID();
    const ts = now();
    const anyExisting = db.prepare("SELECT 1 AS present FROM model_providers LIMIT 1").get() !== undefined;
    const makeDefault = body.is_default === true || !anyExisting;

    db.transaction(() => {
      if (makeDefault) db.prepare("UPDATE model_providers SET is_default = 0 WHERE is_default = 1").run();
      db.prepare(
        "INSERT INTO model_providers (id, name, kind, base_url, model, api_key_enc, is_default, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        id,
        body.name,
        body.kind,
        body.base_url,
        body.model,
        body.api_key ? secrets.encrypt(body.api_key) : null,
        makeDefault ? 1 : 0,
        ts,
        ts,
      );
    })();
    audit("provider.created", {}, { provider_id: id, kind: body.kind, has_key: body.api_key !== undefined });
    return reply.status(201).send(present(getProvider(id) as Row));
  });

  app.get("/providers", async () => {
    const rows = db.prepare("SELECT * FROM model_providers ORDER BY is_default DESC, created_at ASC").all();
    return (rows as Row[]).map(present);
  });

  app.get("/providers/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const provider = getProvider(id);
    return provider ? present(provider) : notFound(reply);
  });

  app.patch("/providers/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = providerUpdate.parse(req.body);
    const existing = getProvider(id);
    if (!existing) return notFound(reply);

    if (body.api_key !== undefined && body.clear_key) {
      return reply.status(400).send({ error: "conflicting_key_fields" });
    }
    const keepsKey = body.api_key !== undefined || (existing.api_key_enc !== null && !body.clear_key);
    const problem = transportError((body.base_url ?? existing.base_url) as string, keepsKey);
    if (problem) return reply.status(400).send({ error: problem });

    const sets: string[] = [];
    const values: unknown[] = [];
    const fields: string[] = [];
    for (const key of ["name", "base_url", "model"] as const) {
      const value = body[key];
      if (value !== undefined) {
        sets.push(`${key} = ?`);
        values.push(value);
        fields.push(key);
      }
    }
    if (body.api_key !== undefined) {
      sets.push("api_key_enc = ?");
      values.push(secrets.encrypt(body.api_key));
      fields.push("api_key");
    } else if (body.clear_key) {
      sets.push("api_key_enc = NULL");
      fields.push("clear_key");
    }
    if (sets.length === 0 && !body.is_default) return reply.status(400).send({ error: "no_fields" });

    db.transaction(() => {
      if (body.is_default) {
        db.prepare("UPDATE model_providers SET is_default = 0 WHERE is_default = 1").run();
        sets.push("is_default = 1");
        fields.push("is_default");
      }
      sets.push("updated_at = ?");
      values.push(now(), id);
      db.prepare(`UPDATE model_providers SET ${sets.join(", ")} WHERE id = ?`).run(...values);
    })();
    audit("provider.updated", {}, { provider_id: id, fields });
    return present(getProvider(id) as Row);
  });

  app.delete("/providers/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const result = db.prepare("DELETE FROM model_providers WHERE id = ?").run(id);
    if (result.changes === 0) return notFound(reply);
    audit("provider.deleted", {}, { provider_id: id });
    return reply.status(204).send();
  });
}
