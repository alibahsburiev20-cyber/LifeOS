# ADR 0001: Project license

- **Status:** Proposed (not decided)
- **Decision owner:** repository owner
- **Date:** 2026-10-12

## Context

The README commits to a free-first, self-hostable, open project and says a license and contribution policy must be published before external contributions are accepted or an executable is released. Without a license, default copyright applies and others have no right to use or modify the code.

Relevant goals: easy adoption and self-hosting, community contributions, transparency, and protection against closed commercial forks of a network service.

## Options

| License | Type | Strengths | Trade-offs |
|---------|------|-----------|------------|
| MIT | Permissive | Simplest, widest adoption | No patent grant; closed forks allowed |
| Apache-2.0 | Permissive | Explicit patent grant, contributor terms, widely accepted by companies | Closed forks allowed; longer text |
| MPL-2.0 | Weak copyleft (file level) | Modifications to covered files stay open; compatible with mixing | Less familiar; file-level boundaries add complexity |
| AGPL-3.0 | Strong copyleft (network) | Hosted modified versions must share source | Some companies and contributors avoid it; reduces adoption in some ecosystems |

## Proposal

**Apache-2.0** for the core application. Reasons: matches the free-first and portability goals, provides a patent grant helpful for AI-related code, and lowers friction for contributors and connector authors.

**Alternative if the owner's priority is preventing closed hosted forks: AGPL-3.0.**

Connectors, skills, and documentation may be licensed separately if needed; this should be stated in the repository.

## Consequences

- After acceptance: add `LICENSE`, add SPDX headers to source files, update `CONTRIBUTING.md`.
- Contributions are accepted under the chosen license (inbound = outbound), optionally with a DCO sign-off.
- Changing the license later requires agreement of all copyright holders, so the decision should be made before outside contributions arrive.

## Not legal advice

This comparison is informational. If commercial use or significant external contribution is expected, consult a qualified lawyer.
