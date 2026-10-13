// SPDX-License-Identifier: Apache-2.0
import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Database as Db } from "better-sqlite3";
import { z } from "zod";

// Single-user authentication for Phase 1 (see docs/adr/0002-technology-stack.md and 0004).
// Local passphrase hashed with scrypt, opaque random session token in an HttpOnly cookie.

type ScryptFn = (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;
const scrypt = promisify(scryptCb) as unknown as ScryptFn;

export const SESSION_COOKIE = "lifeos_session";
export const MIN_PASSPHRASE_LENGTH = 12;
const MAX_PASSPHRASE_LENGTH = 200;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const KEY_LENGTH = 32;
const DEFAULT_N = 2 ** 16;
const MAX_N = 2 ** 20;
const R = 8;
const P = 1;
const MAX_FAILURES = 5;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

export type AuditFn = (
  type: string,
  ids: { project_id?: string; task_id?: string },
  detail?: Record<string, unknown>,
  actor?: "user" | "agent" | "system",
) => void;

export interface AuthOptions {
  /** Add the Secure attribute to the session cookie. Set to true when served over HTTPS. */
  secureCookies?: boolean;
  /** scrypt cost parameter N for new hashes (power of two). Lower only in tests. */
  scryptN?: number;
}

const memoryLimit = (n: number) => 128 * n * R * 2;

export async function hashPassphrase(passphrase: string, n = DEFAULT_N): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(passphrase, salt, KEY_LENGTH, {
    N: n,
    r: R,
    p: P,
    maxmem: memoryLimit(n),
  });
  return ["scrypt", n, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

export async function verifyPassphrase(passphrase: string, stored: string): Promise<boolean> {
  const [scheme, nStr, rStr, pStr, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !nStr || !rStr || !pStr || !saltB64 || !hashB64) return false;
  const n = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (![n, r, p].every((v) => Number.isInteger(v) && v > 0) || n > MAX_N) return false;

  const expected = Buffer.from(hashB64, "base64");
  const actual = await scrypt(passphrase, Buffer.from(saltB64, "base64"), expected.length, {
    N: n,
    r,
    p,
    maxmem: 128 * n * r * 2,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() === name) return part.slice(index + 1).trim();
  }
  return undefined;
}

function sessionCookie(token: string, maxAgeSeconds: number, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSeconds}${
    secure ? "; Secure" : ""
  }`;
}

const passphraseSetup = z.object({
  passphrase: z.string().min(MIN_PASSPHRASE_LENGTH).max(MAX_PASSPHRASE_LENGTH),
});
const passphraseLogin = z.object({ passphrase: z.string().min(1).max(MAX_PASSPHRASE_LENGTH) });

// Reachable without a session.
const PUBLIC_PATHS = new Set(["/health", "/auth/status", "/auth/setup", "/auth/login"]);

export function registerAuth(
  app: FastifyInstance,
  db: Db,
  options: AuthOptions,
  audit: AuditFn,
): void {
  const secure = options.secureCookies ?? false;
  const n = options.scryptN ?? DEFAULT_N;
  // In memory only: resets when the server restarts. Keyed by client address.
  const failures = new Map<string, { count: number; first: number }>();

  const isConfigured = () =>
    db.prepare("SELECT 1 AS present FROM auth_credentials WHERE id = 1").get() !== undefined;

  const isAuthenticated = (req: FastifyRequest) => {
    const token = readCookie(req.headers.cookie, SESSION_COOKIE);
    if (!token) return false;
    const row = db
      .prepare("SELECT expires_at FROM sessions WHERE token_hash = ?")
      .get(hashToken(token)) as { expires_at: string } | undefined;
    return row !== undefined && new Date(row.expires_at).getTime() > Date.now();
  };

  const startSession = (reply: FastifyReply) => {
    const token = randomBytes(32).toString("hex");
    const now = Date.now();
    db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(new Date(now).toISOString());
    db.prepare("INSERT INTO sessions (token_hash, created_at, expires_at) VALUES (?, ?, ?)").run(
      hashToken(token),
      new Date(now).toISOString(),
      new Date(now + SESSION_TTL_MS).toISOString(),
    );
    reply.header("Set-Cookie", sessionCookie(token, SESSION_TTL_MS / 1000, secure));
  };

  app.addHook("onRequest", async (req, reply) => {
    // Defence in depth on top of SameSite=Strict: a browser-supplied Origin must match Host.
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.headers.origin;
      if (origin !== undefined) {
        let originHost: string | undefined;
        try {
          originHost = new URL(origin).host;
        } catch {
          originHost = undefined;
        }
        if (originHost !== req.headers.host) {
          return reply.status(403).send({ error: "bad_origin" });
        }
      }
    }

    const path = req.url.split("?")[0] ?? "";
    if (PUBLIC_PATHS.has(path)) return;
    if (!isAuthenticated(req)) {
      return reply
        .status(401)
        .send({ error: isConfigured() ? "unauthorized" : "setup_required" });
    }
  });

  app.get("/auth/status", async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    return { configured: isConfigured(), authenticated: isAuthenticated(req) };
  });

  // First run only. Whoever reaches the server first chooses the passphrase,
  // so the server must stay on localhost (or behind HTTPS and a firewall) until this is done.
  app.post("/auth/setup", async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const { passphrase } = passphraseSetup.parse(req.body);
    if (isConfigured()) return reply.status(409).send({ error: "already_configured" });

    const hash = await hashPassphrase(passphrase, n);
    const ts = new Date().toISOString();
    try {
      db.prepare(
        "INSERT INTO auth_credentials (id, password_hash, created_at, updated_at) VALUES (1, ?, ?, ?)",
      ).run(hash, ts, ts);
    } catch {
      return reply.status(409).send({ error: "already_configured" });
    }
    startSession(reply);
    audit("auth.setup", {});
    return reply.status(201).send({ ok: true });
  });

  app.post("/auth/login", async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const key = req.ip;
    const now = Date.now();

    const entry = failures.get(key);
    if (entry && now - entry.first < FAILURE_WINDOW_MS && entry.count >= MAX_FAILURES) {
      reply.header("Retry-After", String(Math.ceil((FAILURE_WINDOW_MS - (now - entry.first)) / 1000)));
      return reply.status(429).send({ error: "too_many_attempts" });
    }

    const { passphrase } = passphraseLogin.parse(req.body);
    const row = db.prepare("SELECT password_hash FROM auth_credentials WHERE id = 1").get() as
      | { password_hash: string }
      | undefined;
    if (!row) return reply.status(409).send({ error: "setup_required" });

    if (!(await verifyPassphrase(passphrase, row.password_hash))) {
      if (failures.size > 1000) failures.clear();
      const current = failures.get(key);
      if (!current || now - current.first >= FAILURE_WINDOW_MS) {
        failures.set(key, { count: 1, first: now });
      } else {
        current.count += 1;
      }
      audit("auth.login_failed", {}, {}, "system");
      return reply.status(401).send({ error: "invalid_credentials" });
    }

    failures.delete(key);
    startSession(reply);
    audit("auth.login", {});
    return { ok: true };
  });

  app.post("/auth/logout", async (req, reply) => {
    reply.header("Cache-Control", "no-store");
    const token = readCookie(req.headers.cookie, SESSION_COOKIE);
    if (token) db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(hashToken(token));
    reply.header("Set-Cookie", sessionCookie("", 0, secure));
    audit("auth.logout", {});
    return reply.status(204).send();
  });
}
