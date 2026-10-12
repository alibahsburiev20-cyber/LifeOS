# Contributing to LifeOS

**Status:** Draft. LifeOS is at the specification stage (see `docs/phase-0/`). The license has not been chosen yet (see `docs/adr/0001-license.md`), so **code contributions cannot be accepted until a license is published.** Feedback on the specification is welcome now.

## What helps right now

- Clarifying requirements and finding contradictions in the Phase 0 documents.
- Reviewing the threat model and permission tiers; proposing missing threats.
- Testing free and self-hosted model options and reporting real limits and costs.
- Proposing small, verifiable milestones.

## How to propose a change

Open an issue or a pull request that states:

1. **Scope:** what changes and what does not.
2. **Acceptance criteria:** how we know it is done.
3. **Risks:** security, privacy, cost, maintenance.
4. **Test plan:** how it will be verified.

Keep changes small and focused. Documentation changes should say whether they alter a requirement or only clarify wording.

## Rules

- Never commit secrets, tokens, or personal data. Use placeholders.
- Do not describe planned features as implemented. Label status: planned, experimental, or stable.
- Changes that touch permissions, connectors, or data storage must reference the relevant sections of the threat model and permissions document.
- If a contribution was written with AI assistance, say so in the pull request and verify it yourself; unverified output is not accepted as verified.
- Use clear commit messages in the form `type: short description` (for example `docs:`, `feat:`, `fix:`).

## Reporting security problems

Do not open a public issue for a vulnerability. Until a private reporting channel is published here, contact the repository owner privately through GitHub.

## Conduct

Be respectful and constructive. A formal code of conduct will be added together with the license.
