# @lifeos/server

Phase 1 skeleton of the LifeOS server (see `docs/adr/0002-technology-stack.md`).

**Status: experimental. Tests and type checks run in CI, but the server has not been used in a real deployment.**

## What exists

- Fastify HTTP API with Zod validation
- SQLite (WAL, foreign keys on) with versioned migrations (`PRAGMA user_version`)
- Projects and tasks, with the task state machine from `docs/phase-0/03-data-model.md`
- Append-only audit events that store ids and states only, never user content
- Single-user authentication: a passphrase chosen on first run, hashed with scrypt; sessions are random tokens in an `HttpOnly`, `SameSite=Strict` cookie (7 days); only token hashes are stored
- Login rate limit: 5 failed attempts per client address within 15 minutes, then HTTP 429 (kept in memory, resets on restart)
- Origin check on state-changing requests (a browser-supplied `Origin` must match `Host`)

## Not implemented yet

Conversations, memory, runs, approvals, the model gateway, export/import, passphrase change, and the web client.

## Security notes

- The server listens on `127.0.0.1` by default.
- **First-run setup is open:** whoever reaches `POST /auth/setup` first chooses the passphrase. Complete setup yourself before exposing the server to anyone else.
- For anything other than localhost, serve over HTTPS (for example behind a reverse proxy) and set `COOKIE_SECURE=true`. Without HTTPS, passphrases and session cookies cross the network in clear text.
- Behind a reverse proxy the client address seen by the rate limiter is the proxy's, so all users share one limit until trusted-proxy handling is added.
- If you forget the passphrase there is no recovery yet; delete the database file to start over (this deletes your data).

## Run

```bash
nvm use            # Node 22
pnpm install
pnpm dev:server    # http://127.0.0.1:3000
pnpm test
```

Environment variables: `HOST` (default `127.0.0.1`), `PORT` (default `3000`), `DATABASE_PATH` (default `./data/lifeos.db`), `COOKIE_SECURE` (`true` when served over HTTPS).

## API

Public: `GET /health`, `GET /auth/status`, `POST /auth/setup`, `POST /auth/login`. Everything else needs a valid session cookie and returns `401` otherwise.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/auth/status` | `{ configured, authenticated }` |
| POST | `/auth/setup` | First run only. Body `{ "passphrase": "<12-200 characters>" }`; `409` if already set up |
| POST | `/auth/login` | Body `{ "passphrase": "..." }`; `401` wrong, `429` too many attempts |
| POST | `/auth/logout` | Ends the session |
| POST / GET | `/projects` | Create / list (`?status=active\|archived`) |
| GET / PATCH / DELETE | `/projects/:id` | Read / update / delete (cascades tasks) |
| POST / GET | `/projects/:id/tasks` | Create / list tasks |
| GET | `/tasks/:id` | Read a task |
| POST | `/tasks/:id/transition` | Body `{ "to": "<state>" }`; `409` if not allowed |
