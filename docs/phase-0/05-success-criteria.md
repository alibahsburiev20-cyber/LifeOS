# 5. Success criteria

**Status:** Draft.

## 1. Phase 0 exit checklist

- [ ] Owner has reviewed and approved or amended documents 1–4.
- [ ] License decision recorded (ADR 0001 changed from Proposed to Accepted or replaced).
- [ ] Contribution policy published (`CONTRIBUTING.md` finalized after the license decision).
- [ ] Open questions in `01-scope.md` answered or explicitly postponed.
- [ ] Threat model gates (G1–G4) agreed.
- [ ] Phase 1 stack-selection spike defined with comparison criteria.
- [ ] Root `README.md` updated to link this documentation.

## 2. Phase 1 acceptance criteria (testable)

Derived from the README's initial success criteria.

| # | Criterion | How to verify |
|---|-----------|---------------|
| P1-1 | A new user can create a project and state a goal without reading technical documentation | Usability check with at least three people and no coaching |
| P1-2 | The agent produces a plan, saves state, and shows progress across separate sessions | Close the app mid-task, reopen, state and plan are intact |
| P1-3 | The user can inspect, edit, and delete any stored memory | Deleted memory no longer appears in search, exports, or prompts |
| P1-4 | Every task exposes state, outcome, and relevant errors | Inspect task view for success, failure, and blocked cases |
| P1-5 | The user can stop a running task and revoke a connector grant | Stop takes effect before the next tool call |
| P1-6 | The app works without a mandatory LifeOS subscription | Documented self-host setup using a local model or own key |
| P1-7 | At least one model path has transparent setup, cost, and limits | Setup guide lists costs and known limits |
| P1-8 | No consequential external action occurs without valid permission or approval | Automated tests attempt T3/T4 actions without grant and expect refusal |
| P1-9 | Export and re-import restore all user data | Round-trip test compares entities |
| P1-10 | Core flows are usable on a phone-sized viewport | Manual test on a mid-range Android phone in a mobile browser |

## 3. Security checks per phase

- Secret scanning enabled in CI before the first connector.
- Dependency and license audit in CI.
- Prompt-injection test set (documents, web pages, issues containing hostile instructions) run against every agent release; no T2+ action may execute without approval.
- Threat model re-reviewed at each gate in `02-threat-model.md`.

## 4. Quality bar for claims

Any result the agent reports as verified must name how it was verified (test run, source, comparison). Unverified output is labeled as such.
