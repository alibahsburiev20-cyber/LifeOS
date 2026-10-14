# @lifeos/server

Phase 1 skeleton of the LifeOS server (see `docs/adr/0002-technology-stack.md`).

**Status: experimental. Tests and type checks run in CI, but the server has not been used in a real deployment.**

## What exists

- Fastify HTTP API with Zod validation
- SQLite (WAL, foreign keys on) with versioned migrations (`PRAGMA user_version`)
- Projects and tasks, with the task state machine from `docs/phase-0/03-data-model.md`
- Memory: explicit, editable entries with scope (global or project), kind, status (`confirmed`, `preference`, `inferred`), source, pinned flag, and text search. Deleting a memory removes its content; project memories are removed with their project
- Conversations and messages per project
- Model providers and assistant replies (ADR 0003): an OpenAI-compatible adapter that works with a local model server (for example Ollama) or a hosted endpoint with the user's own API key. `POST /conversations/:id/reply` sends the project's description, goal and instructions, the user's confirmed memories, and the recent conversation to the chosen model and stores the answer as an assistant message. Unconfirmed (`inferred`) memories are never sent
- API keys are encrypted at rest (AES-256-GCM) and never returned by the API
- Append-only audit events that store ids and states only, never user content (memory text, message text, prompts, replies and keys are never logged)
- Single-user authentication: a passphrase chosen on first run, hashed with scrypt; sessions are random tokens in an `HttpOnly`, `SameSite=Strict` cookie (7 days); only token hashes are stored
- Login rate limit: 5 failed attempts per client address within 15 minutes, then HTTP 429 (kept in memory, resets on restart)
- Origin check on state-changing requests (a browser-supplied `Origin` must match `Host`)

## Not implemented yet

Streaming replies, tool use and actions by the assistant, usage and cost limits, per-project model choice, private sessions, export/import, passphrase change, and the web client.

## Security notes

- The server listens on `127.0.0.1` by default.
- **First-run setup is open:** whoever reaches `POST /auth/setup` first chooses the passphrase. Complete setup yourself before exposing the server to anyone else.
- For anything other than localhost, serve over HTTPS (for example behind a reverse proxy) and set `COOKIE_SECURE=true`. Without HTTPS, passphrases and session cookies cross the network in clear text.
- Behind a reverse proxy the client address seen by the rate limiter is the proxy's, so all users share one limit until trusted-proxy handling is added.
- If you forget the passphrase there is no recovery yet; delete the database file to start over (this deletes your data).
- **Model privacy:** whatever the model needs to answer (project text, confirmed memories, conversation) is sent to the provider you configure. With a hosted provider it is governed by that provider's terms; use a local model to keep everything on your machine.
- **Encryption key:** by default the key is created next to the database as `secret.key` (owner-only permissions). Anyone who can read both files can read the stored API keys. For stronger protection set `LIFEOS_SECRET_KEY` (32 random bytes, base64) and keep it outside the data directory. If the key is lost, re-enter the provider keys.
- API keys are only accepted over HTTPS, except for loopback addresses (`localhost`, `127.0.0.1`). The server does not follow redirects when calling a model server, so a key cannot be forwarded to another host.
- The provider address is chosen by the logged-in user and the server will call it, including addresses on your local network. That is intended for local models; do not give access to people you do not trust.
- Replies are not rate-limited or budgeted yet; a hosted provider bills you for every call.

## Run

```bash
nvm use            # Node 22
pnpm install
pnpm dev:server    # http://127.0.0.1:3000
pnpm test
```

Environment variables: `HOST` (default `127.0.0.1`), `PORT` (default `3000`), `DATABASE_PATH` (default `./data/lifeos.db`), `COOKIE_SECURE` (`true` when served over HTTPS), `LIFEOS_SECRET_KEY` (optional, see above).

## API

Public: `GET /health`, `GET /auth/status`, `POST /auth/setup`, `POST /auth/login`. Everything else needs a valid session cookie and returns `401` otherwise.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/auth/status` | `{ configured, authenticated }` |
| POST | `/auth/setup` | First run only. Body `{ "passphrase": "<12-200 characters>" }`; `409` if already set up |
| POST | `/auth/login` | Body `{ "passphrase": "..." }`; `401` wrong, `429` too many attempts |
| POST | `/auth/logout` | Ends the session |
| POST / GET | `/projects` | Create / list (`?status=active\|archived`) |
| GET / PATCH / DELETE | `/projects/:id` | Read / update / delete (cascades tasks, conversations, project memories) |
| POST / GET | `/projects/:id/tasks` | Create / list tasks |
| GET | `/tasks/:id` | Read a task |
| POST | `/tasks/:id/transition` | Body `{ "to": "<state>" }`; `409` if not allowed |
| POST / GET | `/memories` | Create (`scope`, `text`, optional `project_id`, `kind`, `status`, `source`, `pinned`) / list (`?scope=`, `project_id=`, `status=`, `q=`) |
| GET / PATCH / DELETE | `/memories/:id` | Read / edit / delete permanently |
| POST / GET | `/projects/:id/conversations` | Create (optional `title`) / list (`?archived=true\|false`) |
| GET / PATCH / DELETE | `/conversations/:id` | Read / rename or archive / delete with messages |
| POST / GET | `/conversations/:id/messages` | Add a user message (`content`) / list in order (`?limit=`) |
| POST | `/conversations/:id/reply` | Ask the model to answer the last user message. Optional body `{ "provider_id": "..." }`. `409` if no provider or nothing to answer, `502` if the model fails |
| POST / GET | `/providers` | Add (`name`, `kind` `local` or `hosted`, `base_url`, `model`, optional `api_key`, `is_default`) / list. Keys are never returned, only `has_key` |
| GET / PATCH / DELETE | `/providers/:id` | Read / edit (`api_key` to rotate, `clear_key`, `is_default`) / delete |
