# 2. Threat model

**Status:** Draft. Method: asset and trust-boundary analysis with STRIDE-style categories plus threats specific to LLM agents. This document must be reviewed again before any autonomous write action or code execution is enabled (README, section 14).

## 1. Assets

| ID | Asset | Why it matters |
|----|-------|----------------|
| A1 | Memories and personal context | Private and long-lived |
| A2 | Project files, notes, conversations | May contain personal or work data |
| A3 | Connector credentials and API keys | Grant access to external accounts |
| A4 | User accounts on external services (GitHub, email, calendar) | Consequential actions possible |
| A5 | Audit log | Needed to trust and debug agent behavior |
| A6 | Model-provider quota and money | Can be drained by loops or abuse |
| A7 | The host machine or server | Runs untrusted content and code |

## 2. Actors

- **Owner:** the legitimate user.
- **Malicious content author:** controls a web page, document, issue, PR, email, or file the agent reads.
- **Malicious connector or skill author:** publishes a third-party extension.
- **Network attacker:** observes or tampers with traffic.
- **Compromised or curious model provider.**
- **Local attacker:** access to the device or backup.
- **The agent itself:** may err or be manipulated; treated as an untrusted component.

## 3. Trust boundaries

1. Client ↔ application API
2. Application ↔ model provider (data leaves the user's control here unless the model is local)
3. Orchestrator ↔ tools and connectors
4. Orchestrator ↔ execution sandbox
5. Application ↔ external services
6. Stored data ↔ exports and backups

All content read from the outside world (web, files, repositories, messages) is **untrusted data** and never an instruction source.

## 4. Threats and required mitigations

| ID | Threat | Asset | Mitigation (requirement) |
|----|--------|-------|--------------------------|
| T1 | **Prompt injection** from web pages, files, issues, or PRs makes the agent perform unintended actions | A1–A4 | Separate instruction channel from data; tool calls above Tier 1 require approval regardless of model output; show the source of any instruction-like content; no secrets in prompts |
| T2 | **Data exfiltration** through tool arguments, URLs, or generated links | A1–A3 | Egress allow-list per project; outbound requests logged; approval for any send to a new destination |
| T3 | **Excessive agency**: agent deletes, publishes, spends, or changes access without consent | A4 | Permission tiers and approval gates (`04-permissions.md`); protected branches and destructive operations never auto-approved |
| T4 | **Memory poisoning**: injected text is saved as a trusted fact | A1 | Memories carry source and status (`confirmed`, `preference`, `inferred`); inferred memories are never silently promoted; user can review, edit, delete |
| T5 | **Credential leakage** in logs, prompts, source code, or exports | A3 | Secrets stored encrypted, referenced by handle; redaction in logs; exports exclude secrets; secret scanning in CI |
| T6 | **Sandbox escape** or malicious downloaded code | A7 | No execution before sandbox design review; no network by default, CPU/memory/time limits, read-only mounts, no host credentials in the sandbox |
| T7 | **Malicious connector or skill** (supply chain) | A3, A4, A7 | Connectors declare scopes; read-only default; pinned versions; review before enabling; permissions shown before connect |
| T8 | **Over-privileged tokens** | A4 | Least-privilege scopes, per-project grants, expiry, easy revoke, "disconnect all" |
| T9 | **Model-provider data exposure** | A1, A2 | Show which provider receives which data; local-model path; no claim that data is not used for training unless the provider's terms and deployment guarantee it |
| T10 | **Runaway loops and cost** | A6 | Step, time, and budget limits per run; stop control; alert at thresholds |
| T11 | **Tampering with the audit log** | A5 | Append-only event records; exports include a hash chain (optional in MVP) |
| T12 | **Local device or backup compromise** | A1–A3 | Encryption at rest where supported; documented backup guidance; lock and session timeout for the web client |
| T13 | **Transport attacks** | all | TLS everywhere for network access; HSTS; no mixed content |
| T14 | **Cross-project leakage** | A1, A2 | Project-scoped retrieval; search respects workspace permissions |
| T15 | **Misleading output** presented as verified | trust | Distinguish source-backed facts, analysis, and unverified generation in outputs |

## 5. Out of scope for Phase 1

Multi-tenant hosting threats, enterprise identity, and compliance regimes. They must be re-evaluated before any shared-workspace feature (Phase 6).

## 6. Security gates

| Gate | Condition |
|------|-----------|
| G1 | Before any connector with write access: T1, T3, T5, T7, T8 mitigations implemented and tested |
| G2 | Before code execution: T6 design reviewed and tested |
| G3 | Before background runs: T10 limits and global stop implemented |
| G4 | Before shared workspaces: T14 and tenancy review |

## 7. Residual risk

LLMs cannot be made fully immune to prompt injection. The design therefore relies on **limiting what a manipulated agent can do** (tiers, approvals, sandboxing, scoped tokens), not on detecting every attack.
