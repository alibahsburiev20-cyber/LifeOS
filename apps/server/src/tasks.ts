// SPDX-License-Identifier: Apache-2.0
// Task state machine. See docs/phase-0/03-data-model.md.
// 'cancelled' is added to the documented states so that cancellation is recorded as a terminal state.

export const TASK_STATES = [
  "planned",
  "in_progress",
  "waiting_for_approval",
  "blocked",
  "completed",
  "failed",
  "cancelled",
] as const;

export type TaskState = (typeof TASK_STATES)[number];

const TRANSITIONS: Record<TaskState, readonly TaskState[]> = {
  planned: ["in_progress", "cancelled"],
  in_progress: ["waiting_for_approval", "blocked", "completed", "failed", "cancelled"],
  waiting_for_approval: ["in_progress", "blocked", "cancelled"],
  blocked: ["in_progress", "cancelled"],
  failed: ["planned"],
  completed: [],
  cancelled: [],
};

export function canTransition(from: TaskState, to: TaskState): boolean {
  return TRANSITIONS[from].includes(to);
}
