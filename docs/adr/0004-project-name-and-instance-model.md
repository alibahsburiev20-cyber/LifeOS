# ADR 0004: Project name and instance model

- **Status:** Accepted (decision delegated by the repository owner on 2026-10-12)
- **Date:** 2026-10-12

## Name

The working name **LifeOS** is kept for Phase 1. Before the first public release, check for existing trademarks and well-known products with the same name; if there is a conflict, rename before publishing packages or domains. `NOTICE` and `README.md` already state independence from OpenAI and Dots.

## Instance model

One instance serves **one user** in Phase 1. Reasons: it fits the local-first, self-hosted goal, removes a large class of tenancy threats (T14), and keeps the MVP small.

Multi-user and shared workspaces belong to Phase 6 and require security gate G4 and a new ADR.

## Defaults decided here

- Activity log retention default: 90 days, configurable, with export before deletion.
- Approvals: per run for T2 actions by default, per action for T3 and T4 (see `docs/phase-0/04-permissions.md`).
- In Phase 1 approvals are shown in-app only; push delivery arrives with Phase 2 notification work.
- PWA support target: current and previous major versions of Chrome on Android, Safari on iOS, and desktop Chrome, Firefox, and Safari.
