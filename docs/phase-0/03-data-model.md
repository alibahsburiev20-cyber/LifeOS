# 3. Data model

**Status:** Draft. Logical model, independent of any database. Identifiers are opaque unique strings; timestamps are UTC ISO 8601. Every entity has `id`, `created_at`, `updated_at`.

## 1. Entities

### Project
`name`, `description`, `goal`, `instructions`, `status` (active | archived), `settings` (model preference, egress rules, memory policy).

### Conversation / Message
Conversation: `project_id`, `title`, `archived`. Message: `conversation_id`, `role` (user | assistant | system | tool), `content`, `attachments[]`, `model_ref`, `run_id?`.

### Task
`project_id`, `parent_task_id?`, `title`, `description`, `state`, `priority`, `due_at?`, `depends_on[]`, `definition_of_done`, `assumptions[]`, `created_by` (user | agent).

### Run
One execution attempt of a task. `task_id`, `state`, `model_ref`, `started_at`, `ended_at`, `limits` (steps, time, budget), `result_summary`, `error?`.

### Checkpoint
`run_id`, `sequence`, `state_snapshot`, `created_at`. Used to resume rather than restart.

### Approval
`run_id`, `action` (tool, arguments preview), `tier`, `impact_summary`, `status` (pending | approved | rejected | expired), `decided_at?`, `decided_by?`.

### Memory
`scope` (global | project), `project_id?`, `text`, `kind` (preference | fact | decision | context), `status` (confirmed | preference | inferred), `source` (message, file, or URL reference), `recorded_at`, `pinned`, `deleted_at?`.
Rule: `inferred` memories are visible but never treated as confirmed without user action.

### File / Artifact
`project_id`, `name`, `mime`, `origin` (uploaded | generated), `content_ref`, `version`, `parent_version?`. Source files and generated outputs are kept separate.

### Connector / Grant
Connector: `type`, `display_name`, `status`, `credential_ref` (handle to encrypted secret, never the secret). Grant: `connector_id`, `project_id?`, `scopes[]`, `tier_max`, `expires_at?`, `revoked_at?`.

### ModelProvider
`kind` (local | hosted), `endpoint`, `credential_ref?`, `capabilities`, `known_limits`.

### AuditEvent (append-only)
`actor` (user | agent | system), `type`, `project_id?`, `run_id?`, `tool?`, `arguments_redacted`, `outcome`, `reason`.

### Notification
`type`, `target_ref`, `urgency`, `delivered_at?`, `read_at?`.

## 2. Task state machine

```
Planned -> In progress -> Completed
   |           |  ^
   |           v  |
   |   Waiting for approval
   |           |
   |           v
   +------> Blocked <-> In progress
               |
               v
            Failed -> Planned (retry)
```

Rules:
- `Planned -> In progress` requires an explicit start (manual or via an approved schedule).
- `In progress -> Waiting for approval` whenever an action above the granted tier is needed.
- `Blocked` always records what is missing and what the user must decide.
- `Failed` keeps the error and the last checkpoint; retry creates a new Run.
- User may cancel from any non-terminal state; cancellation is recorded.
- A Completed task states how its result can be verified.

## 3. Principles

1. **Provider-neutral:** no field depends on one vendor's format; `model_ref` is descriptive only.
2. **Deletion means deletion:** user deletion of a memory, file, or project removes content; the audit log keeps only non-content metadata.
3. **Secrets never stored in domain tables**, only handles.
4. **Scope on every read:** retrieval filters by project and grant.
5. **Versioned schema:** each export carries `schema_version`; migrations are documented.

## 4. Export format (proposal)

A folder or archive containing:

```
manifest.json        # schema_version, exported_at, app_version
projects/<id>.json   # project, tasks, runs (summaries), conversations
memories.json        # all memories with source and status
files/               # uploaded and generated files + files.json index
settings.json        # preferences; no secrets
```

Formats: JSON for structured data, Markdown for notes. Import must validate `schema_version` and report what could not be imported.
