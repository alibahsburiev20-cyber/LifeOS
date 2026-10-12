# 4. Permissions and approvals

**Status:** Draft. Implements the README principle: *approval before impact*.

## 1. Risk tiers

| Tier | Description | Examples | Default policy |
|------|-------------|----------|----------------|
| **T0** | Read or write inside the app's own project data | Read notes, create task, save memory proposal | Allowed |
| **T1** | Read external data with a read-only grant | Web search, read repository, read calendar | Allowed after the connector is connected with read scopes |
| **T2** | Reversible changes in an isolated workspace | Edit files in sandbox, commit on a feature branch | Approval per run unless a narrow rule exists |
| **T3** | External side effects | Open a pull request, send a message, create an event, publish | Approval every time, with preview |
| **T4** | Irreversible or high-impact | Delete, push to a protected branch, change access, spend money, rotate credentials, publish a release | **Never automatic**; approval every time; some actions disabled in MVP |

The tier is determined by the **tool definition**, not by the model's own claim.

## 2. Grants

A grant answers: *which connector, which scopes, for which project, until when?*

- Scopes are named `<connector>:<resource>:<verb>` (for example `github:repo:read`, `github:branch:write`).
- Read-only is the default wherever the connector supports it.
- Grants can be project-bound and can expire.
- Each connector screen shows exactly which data it can read and which actions it can perform.
- Revoking a grant takes effect before the next tool call.

## 3. Approval request contents

Every pending approval shows:

1. What will happen, in plain language.
2. Exact target (repository, branch, recipient, file).
3. A preview or diff.
4. Why the agent wants to do it and which task it belongs to.
5. Reversibility (can it be undone, and how).
6. Buttons: Approve, Reject, Edit, Ask a question.

Approvals expire. An approved action applies only to the shown parameters; changed parameters need a new approval.

## 4. Standing rules (narrow autonomy)

Allowed only from Phase 4 and only if all hold:

- Scope is explicit (one connector, one project, one action type).
- The rule is explained in plain language before activation, with the permissions it needs.
- It has an expiry or must be re-confirmed periodically.
- It cannot cover T4 actions.
- It can be paused, edited, or deleted at any time.

## 5. Global controls

- **Stop all:** immediately halts every run and queued job.
- **Disconnect all integrations.**
- **Private session:** no memory read or write.
- **Quiet hours** and notification limits.

## 6. GitHub-specific rules

- Never write to a protected branch; changes go to a feature branch followed by a PR.
- Never delete a repository, publish a release, or alter repository access or secrets.
- Pull requests and commits are T3 and need approval with a diff.
- Tokens use the least scope needed (fine-grained, per repository).

## 7. Audit

Every tool call, approval, rejection, grant change, and failure creates an AuditEvent with a redacted argument summary, outcome, and reason. Users can view and export the log.

## 8. Open questions

- Should T2 approval be per run or per task by default?
- Are approvals delivered by push notification in Phase 2, or only in-app?
