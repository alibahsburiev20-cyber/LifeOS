# @lifeos/server

Phase 1 skeleton of the LifeOS server (see `docs/adr/0002-technology-stack.md`).

**Status: experimental and not yet run in CI. The code was written without being executed. Run `pnpm install && pnpm test` before relying on it.**

**There is no authentication yet.** The server listens on `127.0.0.1` by default. Do not set `HOST` to a network address.

## What exists

- Fastify HTTP API with Zod validation
- SQLite (WAL, foreign keys on) with versioned migrations (`PRAGMA user_version`)
- Projects and tasks, with the task state machine from `docs/phase-0/03-data-model.md` (plus a terminal `cancelled` state)
- Append-only audit events that store ids and states only, never user content

## Not implemented yet

Authentication, conversations, memory, runs, approvals, the model gateway, export/import, and the web client.

## Run

```bash
nvm use            # Node 22
pnpm install
pnpm dev:server    # http://127.0.0.1:3000
pnpm test
```

Environment variables: `HOST` (default `127.0.0.1`), `PORT` (default `3000`), `DATABASE_PATH` (default `./data/lifeos.db`).

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Liveness |
| POST / GET | `/projects` | Create / list (`?status=active\|archived`) |
| GET / PATCH / DELETE | `/projects/:id` | Read / update / delete (cascades tasks) |
| POST / GET | `/projects/:id/tasks` | Create / list tasks |
| GET | `/tasks/:id` | Read a task |
| POST | `/tasks/:id/transition` | Body `{ "to": "<state>" }`; `409` if not allowed |
