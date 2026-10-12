# ADR 0002: Technology stack for Phase 1

- **Status:** Accepted (decision delegated by the repository owner on 2026-10-12)
- **Date:** 2026-10-12
- **Revisit:** after the Phase 1 spike below, or earlier through a new ADR

## Context

`docs/phase-0/01-scope.md` lists requirements on the stack: self-hostable on modest hardware, local-first storage, a model adapter interface, a sandbox boundary defined before code execution, documented connector interfaces, and a phone-first PWA.

## Decision

| Concern | Choice | Rationale |
|---------|--------|-----------|
| Language | TypeScript for client and server | One language, large contributor pool, strong tooling |
| Client | React + Vite, built as a PWA | Mature PWA tooling, large ecosystem, works in a mobile browser |
| Server | Node.js (current LTS) with Fastify | Light, fast, simple to self-host as one process |
| Database | SQLite in WAL mode, schema migrations in code | Zero-ops, single-file backup, fits single-user instances; FTS5 for search |
| Background jobs | In-process queue persisted in SQLite | No Redis or broker needed in Phases 1-2 |
| Model access | Adapter layer, baseline OpenAI-compatible HTTP API (ADR 0003) | Works with local runtimes and many hosted providers |
| Auth (single user) | Local passphrase, hashed with a modern password hash; session cookie; passkeys later | Fits ADR 0004 |
| Secrets | Encrypted at rest, key from environment or OS keyring, referenced by handle | Matches threat T5 |
| Packaging | One container image with compose file, plus plain `npm start` | Easy self-hosting |
| Repository layout | pnpm workspaces: `apps/web`, `apps/server`, `packages/core`, `packages/model-gateway`, `packages/connectors` | Clear module boundaries |
| Tests | Vitest (unit), Playwright (end-to-end, mobile viewport) | Covers criteria P1-8 and P1-10 |
| Sandbox (Phase 3) | **Not decided here.** A separate ADR with a design review is required before gate G2 | Avoids committing to an unreviewed isolation design |

Vector search and embeddings are deferred; Phase 1 uses SQLite full-text search. An optional SQLite vector extension can be evaluated later.

## Spike before committing (time-boxed, about one week)

Build a vertical slice: create a project, send a chat message through the model gateway to a local model, create a task, save a reviewable memory, export and re-import. Measure:

1. Idle memory use of the server below 300 MB.
2. Cold start below 5 seconds on modest hardware.
3. Core flows usable on a mid-range Android phone in a mobile browser.
4. Export/import round trip passes (P1-9).

If two or more criteria fail, write a new ADR and reconsider the client framework or runtime.

## Alternatives considered

- Svelte or SvelteKit for the client: smaller bundles, smaller contributor pool.
- Python (FastAPI) backend: stronger ML ecosystem, but two languages and heavier PWA toolchain.
- Postgres: more capable, but adds operations burden for a personal, self-hosted app.
- Rust or Go backend: efficient, but slower to iterate for a spec-stage project.

## Consequences

- Contributors need Node.js and pnpm.
- Multi-user and horizontal scaling are explicitly out of scope until Phase 6; moving to Postgres then would be a separate decision.
