# ADR 0001: Project license

- **Status:** Accepted (decision delegated by the repository owner on 2026-10-12; may be superseded by a later ADR before outside contributions arrive)
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
| MPL-2.0 | Weak copyleft (file level) | Modifications to covered files stay open | Less familiar; file-level boundaries add complexity |
| AGPL-3.0 | Strong copyleft (network) | Hosted modified versions must share source | Some companies and contributors avoid it; lower adoption in some ecosystems |

## Decision

**Apache-2.0** for the whole repository (code and documentation) unless a file states otherwise.

Reasons: matches the free-first and portability goals, provides a patent grant relevant to AI-related code, and lowers friction for contributors and connector authors.

AGPL-3.0 remains the alternative if preventing closed hosted forks becomes the priority. Switching is cheap now and expensive after outside contributions arrive, so this should be revisited **before the first external code contribution is merged**.

## Consequences

- `LICENSE` (Apache-2.0 text) and `NOTICE` are added at the repository root.
- Source files will carry an SPDX header: `SPDX-License-Identifier: Apache-2.0`.
- Contributions are accepted under Apache-2.0 (section 5 of the license); a DCO sign-off is requested (see `CONTRIBUTING.md`).
- Connectors or skills by third parties may use other licenses if they are separate packages.

## Not legal advice

This comparison is informational. If commercial use or significant external contribution is expected, consult a qualified lawyer.
