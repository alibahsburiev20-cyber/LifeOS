# ADR 0003: First supported model path

- **Status:** Accepted (decision delegated by the repository owner on 2026-10-12)
- **Date:** 2026-10-12

## Context

The README requires provider independence, a free-first path, user-supplied keys, and disclosed limits. Free hosted tiers change often and cannot be promised.

## Decision

1. **Baseline adapter:** the OpenAI-compatible Chat Completions HTTP interface (configurable base URL, optional key, streaming optional). This interface is spoken by many local runtimes and hosted providers, so one adapter covers both paths.
2. **First local path (documented and tested):** a local model server on the user's machine or network, with Ollama as the reference setup. No account and no key are required.
3. **First hosted path:** the user's own API key for any OpenAI-compatible endpoint. The key is stored encrypted and never leaves the instance except in requests to the configured endpoint.
4. **No bundled keys and no project-operated proxy.** LifeOS does not route user data through servers run by the project.
5. **Per-project model choice**, with the active model and provider shown on each run.
6. **Visible fallback:** if a provider fails, the user sees the switch and can disable automatic fallback.
7. **Disclosure:** the setup guide states hardware needs for local models, that hosted APIs may cost money, and that data sent to a hosted provider is governed by that provider's terms. LifeOS makes no claim that data is not used for training unless the provider's terms say so.

## Out of scope for Phase 1

Provider-native features beyond text chat and basic tool calling (for example provider-specific agent frameworks), automatic cost-based routing, and fine-tuning.

## Consequences

- Local models vary in tool-calling quality; the agent must degrade to plain-text plans when tool calling is unavailable.
- The adapter must handle differing context limits and report them in the usage view.
- Adding another native API later means adding an adapter, not changing agent logic.
