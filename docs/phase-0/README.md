# Phase 0 — Specification and Design

**Status:** Drafts complete; decisions recorded as ADRs. Awaiting owner review. Nothing here describes implemented functionality.

Phase 0 turns the product vision in the root `README.md` into decisions that Phase 1 (local-first MVP) can be built against.

| # | Document | Purpose |
|---|----------|---------|
| 1 | [Scope](01-scope.md) | What is confirmed for the MVP, what is deferred, what is only an idea |
| 2 | [Threat model](02-threat-model.md) | Assets, actors, threats, and required mitigations |
| 3 | [Data model](03-data-model.md) | Entities, task state machine, export format |
| 4 | [Permissions](04-permissions.md) | Risk tiers, grants, approvals, kill switch |
| 5 | [Success criteria](05-success-criteria.md) | Phase 0 exit checklist and Phase 1 acceptance criteria |

## Decisions (ADRs)

| ADR | Decision | Status |
|-----|----------|--------|
| [0001](../adr/0001-license.md) | Apache-2.0 | Accepted |
| [0002](../adr/0002-technology-stack.md) | TypeScript, React PWA, Node.js + Fastify, SQLite; sandbox deferred | Accepted, validated by a spike |
| [0003](../adr/0003-model-path.md) | OpenAI-compatible adapter; local runtime (Ollama) first, user's own key second | Accepted |
| [0004](../adr/0004-project-name-and-instance-model.md) | Keep the name LifeOS for now; one user per instance | Accepted |

These decisions were delegated by the repository owner and can be changed with a new ADR. The license decision should be revisited before the first external code contribution is merged.

## Still needed from the owner

- Review and approval of documents 1–5 and ADRs 0001–0004.
- Confirmation of the copyright holder line in `NOTICE` (currently "LifeOS contributors").
