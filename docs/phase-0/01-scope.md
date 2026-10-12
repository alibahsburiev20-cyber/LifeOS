# 1. Product scope

**Status:** Draft. Items marked *Confirmed* are proposed as firm MVP requirements pending owner approval; everything else is explicitly not committed.

## 1. Problem and audience

Personal work is spread across chats, documents, calendars, repositories, and notes. Chatbots wait for the next message and lose context between sessions. LifeOS aims to keep a project's goal, plan, state, and memory in one user-controlled place and to continue permitted work between conversations.

Primary audience: individuals (for example students, developers, and independent workers) who manage several projects from a phone or laptop and want control over data and model choice.

## 2. Principles that constrain every decision

1. Free-first, not fake-unlimited. A usable path without a mandatory paid LifeOS subscription; costs and limits of third parties are disclosed.
2. User-owned data: inspect, correct, export, delete.
3. Approval before impact (see `04-permissions.md`).
4. Provider independence.
5. Mobile-first (PWA).
6. Visible work: every agent action has a status, a reason, and an inspectable result.
7. Human control: pause, cancel, redirect, revoke.

## 3. MVP scope (Phase 1) — Confirmed

| Area | MVP requirement |
|------|-----------------|
| Client | Responsive web app, installable as a PWA, usable on a phone-sized screen |
| Chat | One conversation per project; messages stored with project context |
| Projects | Create, archive, delete; each has instructions, goal, notes, files, activity history |
| Tasks | Create manually or from a goal; states Planned / In progress / Waiting for approval / Blocked / Completed / Failed; cancel and retry |
| Plans | Agent proposes a plan with subtasks and dependencies; user edits before it runs |
| Memory | Explicit, reviewable, editable, deletable; scoped global or per project; each memory shows source and date |
| Models | One model gateway with at least one path: a local model server **or** a user-supplied API key; model choice shown per run |
| Data portability | Export and import of all user data in a documented, provider-neutral format |
| Safety defaults | No autonomous consequential actions; read-only integrations only; global stop control |
| Activity | Per-task log with status, reason, and result |

## 4. Deferred (committed direction, not MVP)

- Phase 2: background execution, checkpoints, retries, schedules, uploads, approval inbox, notification preferences, research workflow with source links.
- Phase 3: connector framework, GitHub workflow on branches, sandboxed code execution.
- Phase 4: workflow builder, narrow autonomy grants, budget and rate limits.
- Phase 5: PWA notifications, voice, optional messaging integrations, accessibility and offline work.
- Phase 6: community skills and optional shared workspaces.

## 5. Ideas (unconfirmed, may be dropped)

Shared team or family workspaces; monitoring arbitrary sources; email and calendar write access; community skill marketplace; spoken responses; automatic provider routing by cost.

## 6. Technology choices — intentionally deferred

The README requires choices to be made after testing deployment cost, mobile usability, security, and maintenance. Phase 0 therefore fixes **requirements on the stack**, not the stack:

- Self-hostable on modest hardware without a mandatory paid service.
- Local-first storage with a documented export format.
- A model adapter interface that separates provider specifics from agent logic.
- Execution sandbox boundary defined before any code-execution feature is built.
- Permissively documented interfaces for connectors.

Recommended Phase 1 spike (time-boxed): build the smallest vertical slice (project, chat, one task, one memory, export) on two candidate stacks and compare against the criteria above.

## 7. Non-goals

- Not a hosted SaaS operated by the project.
- No promise of unlimited compute or free third-party APIs.
- No unattended consequential actions (sending, publishing, paying, deleting, changing access).
- No claim that results are verified when no verification was performed.
- Not affiliated with OpenAI, ChatGPT, or Dots.

## 8. Open questions

- Single-user only in Phase 1, or multi-user from the start? (Proposal: single user per instance.)
- Which local model runtimes are officially supported first?
- Minimum supported phone browser versions for the PWA.
- Retention defaults for activity logs.
