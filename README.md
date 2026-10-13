# LifeOS — Free-First Personal AI Operating System

> **An open, user-controlled AI workspace that keeps your projects moving — not just another chatbot.**

LifeOS is a project specification for a personal AI agent that can understand a goal, turn it into a plan, work through tasks in the background, use approved tools, remember useful context, and return results for review. The goal is to make persistent AI assistance accessible without locking users into one expensive provider or closed platform.

**Status:** Product specification / planning stage. The functionality below describes the intended product, not features that are already implemented.

**Documentation and code:** The Phase 0 specification (scope, threat model, data model, permissions, success criteria) and the decision records are in [`docs/phase-0/`](docs/phase-0/README.md) and [`docs/adr/`](docs/adr/0001-license.md). An experimental, unauthenticated server skeleton is in [`apps/server`](apps/server/README.md); it is not a usable product. LifeOS is licensed under [Apache-2.0](LICENSE).

**Inspired by the always-on AI-agent category.** LifeOS is an independent project and is not affiliated with, endorsed by, or a copy of OpenAI or Dots. The aim is to build an interoperable, transparent alternative with a free-first architecture and user control.

---

## Vision

Today, personal work is scattered across chats, documents, calendars, code repositories, notes, and separate apps. A normal chatbot usually waits for the next message; LifeOS is intended to hold responsibility for a project, track progress, and continue permitted work between conversations.

LifeOS should become a user's **personal command centre**: one place to think, plan, remember, create, automate, and review — on a phone or computer.

### Product principles

- **Free-first, not fake-unlimited:** the core app should be free and open to self-hosting. Users can select local models, genuinely free provider tiers where available, or add their own API keys. Cloud inference, hosting, and some providers may still have costs or limits.
- **User-owned context:** users can inspect, correct, export, and delete their data and memories.
- **Approval before impact:** sending, publishing, purchasing, deleting, changing access, or other consequential actions require explicit permission unless a user has configured a narrow, clearly explained rule.
- **Provider independence:** avoid depending on one model vendor. Users should be able to switch models and tools without losing their project history.
- **Mobile-first:** the experience must work well on Android and in a mobile browser, with a PWA as an initial target.
- **Visible work:** every agent action should have a status, a reason, and an inspectable result or log.
- **Human control:** pause, cancel, redirect, or revoke access at any time.

## Planned feature set

### 1. Persistent AI agent

- Give the agent a goal in natural language, including a deadline, constraints, preferred format, and definition of success.
- Convert the goal into a plan with milestones, subtasks, dependencies, and estimated effort.
- Keep working across sessions instead of losing the project when a chat ends.
- Continue approved, low-risk tasks in the background while the user is offline.
- Detect blockers, missing information, failures, and conflicting instructions; ask the user when a decision is needed.
- Resume interrupted work from saved checkpoints rather than restarting everything.
- Maintain task states such as **Planned**, **In progress**, **Waiting for approval**, **Blocked**, **Completed**, and **Failed**.
- Show what changed, what remains, what assumptions were made, and how the result can be verified.
- Allow users to pause an agent, cancel a task, retry a step, or change the goal.

### 2. Projects and workspaces

- Create separate spaces for study, work, personal life, coding, content creation, research, and other areas.
- Give each project its own instructions, files, goals, memories, integrations, and activity history.
- Store project plans, decisions, open questions, generated files, links, and final deliverables together.
- Track milestones and progress without requiring the user to manually maintain every detail.
- Reuse project templates, checklists, and repeatable workflows.
- Search across projects while respecting workspace permissions.

### 3. Long-term memory and personal context

- Remember user-approved preferences, recurring goals, writing style, important decisions, and project context.
- Separate stable preferences from temporary facts and project-specific information.
- Link remembered facts to their source where possible and show when they were recorded.
- Let users review, edit, pin, correct, or delete any memory.
- Support explicit instructions such as “remember this for this project only” and “forget this”.
- Avoid silently treating guesses as facts; distinguish confirmed facts, user preferences, and uncertain inferences.
- Import and search approved notes or exported data from other tools where technically possible.
- Provide a clear option to disable memory or use a temporary/private session.

### 4. Tasks, schedules, and proactive follow-up

- Create one-time and recurring tasks from natural-language requests.
- Set deadlines, reminders, priorities, and dependencies.
- Prepare a daily or weekly briefing with deadlines, open tasks, blockers, and suggested next actions.
- Monitor user-selected sources for changes and report only relevant updates.
- Run scheduled workflows, such as a weekly project review or a regular repository check.
- Detect missed deadlines or stalled projects and suggest a recovery plan.
- Deliver notifications in the app and, later, through configured channels such as email or messaging integrations.
- Keep quiet hours, notification preferences, and frequency limits under user control.

### 5. Research and web work

- Search the web, compare sources, and summarise findings.
- Attach links and citations to factual claims when the source is available.
- Separate source-backed information from analysis, estimates, and open questions.
- Collect findings into a research brief, comparison table, report, presentation outline, or bibliography.
- Revisit saved sources and check for changes on a schedule when the user has enabled monitoring.
- Support a research workflow: question → plan → sources → evidence → synthesis → deliverable → review.
- Avoid presenting generated content as independently verified when no verification was performed.

### 6. Files and document creation

- Accept text, images, PDFs, and common office or data formats where supported.
- Extract key facts from user-provided files and connect them to the relevant project.
- Draft, summarise, translate, compare, and reorganise documents.
- Generate reports, study notes, tables, task lists, outlines, and presentation plans.
- Keep source files separate from generated outputs and preserve a revision history where practical.
- Let users inspect and download each result before sharing it.
- Make file access project-scoped and explicit; do not search private locations without permission.

### 7. Coding and software projects

- Connect to GitHub with explicitly granted permissions.
- Read repositories, explain code, analyse issues, review pull requests, and inspect CI results.
- Turn a feature request into a proposed implementation plan and test checklist.
- Work in an isolated workspace, make changes on a branch, run available tests, and show a diff.
- Create commits or pull requests only when the user grants the required permission.
- Never silently push to a protected branch, publish a release, rotate credentials, or delete a repository.
- Keep build logs, errors, tests, and verification results visible.
- Support other code hosts or local repositories through adapters if they are implemented later.

### 8. Integrations and tool connections

The architecture should support optional, revocable connectors rather than require every integration at launch.

Potential integrations include:

- **GitHub:** repositories, issues, pull requests, commits, and CI status.
- **Calendar and email:** scheduling, summaries, drafts, and reminders.
- **Cloud files and office tools:** documents, spreadsheets, and presentations.
- **Notes and project tools:** personal knowledge bases and task systems.
- **Messaging:** user-configured communication channels for briefings and follow-ups.
- **Browser and web tools:** research and permitted website interactions.
- **Local tools:** files, scripts, terminal commands, and locally hosted services within a sandbox.

Connector availability depends on permissions, APIs, provider terms, and implementation status. A connection must show exactly what data and actions it enables. Read-only access should be the default wherever possible.

### 9. Workflow and automation builder

- Build automations from plain-language instructions.
- Provide a visual workflow view with triggers, steps, conditions, approval gates, and outputs.
- Support event-based triggers, schedules, manual runs, and monitored changes.
- Allow reusable skills or recipes for common tasks.
- Validate a workflow before activation and show which permissions it will need.
- Include retries, timeouts, error reporting, and safe failure behaviour.
- Require confirmation before enabling an automation that sends messages, publishes content, spends money, or changes important records.
- Allow every workflow to be paused, edited, duplicated, or deleted.

### 10. Multi-model AI and free-first operation

- Provide a model gateway so the user can select a model per task.
- Support compatible hosted APIs and local model servers through adapters.
- Allow a user to supply their own API key without sharing it with the project maintainer.
- Use smaller or local models for routine tasks and stronger models only when useful, if configured by the user.
- Expose model choice, estimated usage where available, and provider limits.
- Offer graceful fallback when a provider is unavailable, without hiding the switch from the user.
- Keep core project data in a provider-neutral format to reduce lock-in.
- Design the app so the user can self-host it and choose where processing occurs.

**Important:** “Free-first” means that users have a genuinely usable path without a mandatory paid LifeOS subscription. It does not mean unlimited cloud compute, unlimited third-party API usage, or that every model is free. Costs and limits must be disclosed clearly.

### 11. Multimodal interface

- A unified chat for instructions, questions, clarifications, and status updates.
- File and image attachments, with document and image understanding when the chosen model supports them.
- Voice input and spoken responses as optional capabilities.
- Structured outputs such as checklists, tables, plans, reports, code diffs, and downloadable files.
- Searchable conversation history with rename, archive, and delete controls.
- Continue a project from the dashboard or a previous conversation without losing its context.

### 12. Dashboard and activity centre

- **Today:** tasks, deadlines, reminders, and recommended next steps.
- **Projects:** progress, milestones, blockers, files, and goals.
- **Agent activity:** current runs, queued work, scheduled work, completed tasks, and failures.
- **Approval inbox:** actions waiting for the user's decision, with a clear explanation of impact.
- **Memory manager:** saved context and its sources.
- **Integrations:** connections, permissions, and recent access.
- **Usage and costs:** local/cloud model choice, provider usage when available, and configured limits.
- **Global search:** find projects, tasks, files, memories, and results.

### 13. Notifications and communication

- Notify users when an important task finishes, fails, needs input, or reaches a deadline.
- Include a concise summary, link to the relevant work, and possible next actions.
- Let users configure which events are urgent and which can wait for a digest.
- Support secure message delivery through optional integrations as they become available.
- Avoid noisy notifications, repeated alerts, and hidden background activity.

### 14. Privacy, security, and permissions

- Clear permission scopes for every connector and tool.
- Read-only access by default when a read-only mode is available.
- Explicit confirmation for high-impact actions, with a preview of what will happen.
- Revocable tokens; secrets must not be placed in source code, logs, or prompts unnecessarily.
- Encrypted transport and protected storage for credentials and private user data.
- Isolated execution for untrusted code, downloaded files, and browser tasks.
- Activity logs showing tool calls, important changes, approvals, and errors.
- Configurable retention, data export, account deletion, and memory deletion.
- No claim that user data is never used for model training unless the selected provider's terms and the actual deployment guarantee that.
- A global **pause/stop** control for agent runs and an easy way to disconnect all integrations.
- Security reviews and threat modelling before enabling autonomous write actions.

### 15. Collaboration and sharing — later phase

- Optional shared workspaces for teams or families.
- Different roles and permission levels.
- Share selected projects, documents, or agent results without exposing private memories.
- Review and approval flows for team tasks.
- A clear separation between personal data and shared workspace data.

### 16. Extensibility and portability

- A documented connector/skill interface.
- Reusable workflow templates and community contributions.
- Export project data, tasks, memories, and settings in documented formats where feasible.
- Import data from supported exports without tying it to one model vendor.
- Transparent feature flags: planned, experimental, and stable capabilities must be clearly labelled.

---

## Proposed product architecture

This is a direction for implementation, not a claim about existing code.

1. **Client:** responsive web app / PWA designed for phone-first use.
2. **Application API:** authentication, workspaces, projects, tasks, approvals, schedules, notifications, and audit events.
3. **Agent orchestrator:** breaks goals into steps, schedules runs, saves checkpoints, enforces permissions, and handles retries.
4. **Model gateway:** routes requests to selected local or hosted models and tracks provider-specific limits.
5. **Tool and connector layer:** explicit adapters for GitHub, files, calendar, browser, messaging, and other services.
6. **Execution sandbox:** isolated environment for code and file operations, with timeouts and resource limits.
7. **Storage:** structured project data plus searchable memory, with scoped access, export, and retention controls.
8. **Observability:** activity timeline, logs, errors, usage information, and task-level verification.

The implementation should favour portable components, documented interfaces, and services with a realistic free/self-hosted path. Exact technology choices should be made after testing deployment cost, mobile usability, security, and maintenance complexity.

## Suggested roadmap

### Phase 0 — Specification and design

- Finalise product scope, threat model, data model, permissions, and success criteria.
- Separate confirmed requirements from ideas and future integrations.
- Decide the initial licence and contribution rules.

### Phase 1 — Useful local-first MVP

- Responsive dashboard, chat, projects, tasks, project notes, and basic persistent memory.
- Import/export of user data.
- Local model and/or user-configured model provider.
- Transparent task status and cancellation.
- No risky autonomous actions by default.

### Phase 2 — Reliable task execution

- Task planning, queues, checkpoints, retries, schedules, and activity logs.
- File uploads and downloadable deliverables.
- Approval inbox and notification preferences.
- Basic research workflow with source links.

### Phase 3 — Tools and integrations

- Connector framework and first read-only integrations.
- Explicit permission controls, credential handling, and integration audit history.
- GitHub workflow for repository review and branch-based changes.
- Sandboxed code execution and test reporting.

### Phase 4 — Background agent and automations

- Scheduled/background runs, workflow builder, safe recovery from failures, and monitoring.
- User-defined rules and narrow autonomy grants.
- Budget, rate, and usage limits for model providers.

### Phase 5 — Mobile and multimodal experience

- Installable PWA, mobile notifications where supported, voice input, and improved file workflows.
- Optional messaging integrations.
- Accessibility, performance, and offline-friendly improvements.

### Phase 6 — Ecosystem and collaboration

- Third-party skills, connector documentation, community templates, and optional shared workspaces.
- Stronger data portability, migration tools, and security reviews.

A phase is complete only when its acceptance criteria and security checks pass; the roadmap is not a promise that every integration will be available.

## What LifeOS is not (yet)

- It is not a finished product or a working AI agent at this stage.
- It is not guaranteed to run every model or integration for free.
- It should not perform unrestricted actions on a user's accounts.
- It should not claim that an untested result has been verified.
- It is not affiliated with OpenAI, ChatGPT, or Dots.

## Initial success criteria

- A new user can create a project and describe a goal without reading technical documentation.
- The agent can produce a plan, save state, and report progress across separate sessions.
- The user can inspect and delete stored memories.
- Every task exposes its current state, outcome, and relevant errors.
- The user can stop a running task and revoke a connector's permission.
- The core app can be used without a mandatory LifeOS subscription.
- At least one supported model path has a transparent setup and cost/limit explanation.
- No consequential external action occurs without a valid permission or approval.

## Contributing

LifeOS is at the specification stage. Early contributions should focus on clarifying requirements, reviewing architecture, identifying security risks, testing free/self-hosted model options, and proposing small, verifiable milestones. Implementation issues should state the scope, acceptance criteria, risks, and test plan.

The project is licensed under Apache-2.0 (see [`LICENSE`](LICENSE) and [ADR 0001](docs/adr/0001-license.md)). See [`CONTRIBUTING.md`](CONTRIBUTING.md) for how to propose changes.

## References

- [OpenAI — Dots](https://chatgpt.com/features/dots/)
- [OpenAI Help Center — Getting started with your dot](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot)

These links are provided as references to the wider always-on-agent product category. LifeOS is an independent project.

---

**The long-term goal:** make powerful, persistent AI assistance practical, transparent, portable, and affordable — while keeping the user in control.
