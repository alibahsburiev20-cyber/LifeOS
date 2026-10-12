# Phase 0 — Specification and Design

**Status:** Draft for owner review. Nothing here describes implemented functionality.

Phase 0 turns the product vision in the root `README.md` into decisions that Phase 1 (local-first MVP) can be built against.

| # | Document | Purpose |
|---|----------|---------|
| 1 | [Scope](01-scope.md) | What is confirmed for the MVP, what is deferred, what is only an idea |
| 2 | [Threat model](02-threat-model.md) | Assets, actors, threats, and required mitigations |
| 3 | [Data model](03-data-model.md) | Entities, task state machine, export format |
| 4 | [Permissions](04-permissions.md) | Risk tiers, grants, approvals, kill switch |
| 5 | [Success criteria](05-success-criteria.md) | Phase 0 exit checklist and Phase 1 acceptance criteria |
| ADR | [0001 License](../adr/0001-license.md) | License options and a proposal (not yet decided) |

## Open decisions (owner input needed)

1. License (see ADR 0001). No `LICENSE` file is added until this is decided.
2. Primary implementation stack. Deliberately not chosen here; see Scope, section 6.
3. First supported model path for the MVP (local model server vs. user-supplied API key).
4. Whether the project name `LifeOS` is final.
