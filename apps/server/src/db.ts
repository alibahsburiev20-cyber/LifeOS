// SPDX-License-Identifier: Apache-2.0
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import type { Database as Db } from "better-sqlite3";

// Each entry is applied once, in order. Never edit an applied entry; append a new one.
const MIGRATIONS: string[] = [
  `
  CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    goal TEXT NOT NULL DEFAULT '',
    instructions TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    state TEXT NOT NULL DEFAULT 'planned' CHECK (state IN (
      'planned', 'in_progress', 'waiting_for_approval',
      'blocked', 'completed', 'failed', 'cancelled'
    )),
    priority INTEGER NOT NULL DEFAULT 0,
    definition_of_done TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT 'user' CHECK (created_by IN ('user', 'agent')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_tasks_project ON tasks(project_id);

  -- Append-only. No foreign keys on purpose: events outlive deleted projects.
  -- 'detail' holds ids and states only, never user content.
  CREATE TABLE audit_events (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    actor TEXT NOT NULL CHECK (actor IN ('user', 'agent', 'system')),
    type TEXT NOT NULL,
    project_id TEXT,
    task_id TEXT,
    detail TEXT NOT NULL DEFAULT '{}'
  );
  CREATE INDEX idx_audit_project ON audit_events(project_id);
  `,
  `
  -- Single-user authentication (one row only). Stores a salted scrypt hash, never the passphrase.
  CREATE TABLE auth_credentials (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  -- Only a SHA-256 hash of each session token is stored.
  CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
  );
  CREATE INDEX idx_sessions_expires ON sessions(expires_at);
  `,
];

export function migrate(db: Db): void {
  const current = db.pragma("user_version", { simple: true }) as number;
  for (let version = current; version < MIGRATIONS.length; version++) {
    const sql = MIGRATIONS[version] as string;
    db.transaction(() => {
      db.exec(sql);
      db.pragma(`user_version = ${version + 1}`);
    })();
  }
}

export function openDatabase(path: string): Db {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  return db;
}
