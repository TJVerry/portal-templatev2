import { LIVE, findPlanTask, matchMilestone, milestonesOf } from '@/data/service-plans';
import type { PlanTask } from '@/data/service-plans';
import { getFieldValue, getTitle } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';

/** Tasks with no milestone go in this group, at the end. */
export const NO_MILESTONE = 'Other tasks';

export function taskStatusOf(row: GenesisNode): string {
  return getFieldValue(row, 'Status') ?? 'To Do';
}

export function taskTitleOf(row: GenesisNode): string {
  return getTitle(row, 'Task') ?? 'Task';
}

/** The plan entry for a task row (who does it, its detail), or null when it is not in the plan. */
export function planTaskOf(row: GenesisNode): PlanTask | null {
  return findPlanTask(getFieldValue(row, 'Service'), taskTitleOf(row))?.task ?? null;
}

/**
 * Milestone of a task: the row's "Milestone" field when it names one, else the plan
 * milestone the task name belongs to. Free-typed milestones still work, with an
 * optional number in front to set their order ("1. Kickoff").
 */
export function milestoneOf(row: GenesisNode): string {
  const service = getFieldValue(row, 'Service') ?? '';
  const field = (getFieldValue(row, 'Milestone') ?? '').trim();
  const fromField = matchMilestone(service, field.replace(/^\d+\s*[.):-]\s*/, ''));
  if (fromField != null) return fromField;
  const fromPlan = findPlanTask(service, taskTitleOf(row))?.milestone.name;
  if (fromPlan != null) return fromPlan;
  return field === '' ? NO_MILESTONE : field;
}

/** Display name for a free-typed milestone: the order number is hidden. */
export function milestoneLabel(milestone: string): string {
  return milestone.replace(/^\d+\s*[.):-]\s*/, '');
}

/** Order inside a milestone: plan order first, then everything else. */
export function planOrderOf(row: GenesisNode): number {
  return findPlanTask(getFieldValue(row, 'Service'), taskTitleOf(row))?.index ?? Number.MAX_SAFE_INTEGER;
}

export interface ServiceStage {
  /** The service's milestones, then "Live". */
  stages: string[];
  /** Index of the current stage in `stages`. The last index means Live. */
  at: number;
  /** Name of the current stage. */
  stage: string;
  live: boolean;
}

/**
 * Where a service is. Driven by its tasks: the first milestone that still has open
 * tasks. `override` is the Stage field from "Portal — Services"; it wins only when it
 * names one of this service's milestones, or "Live".
 */
export function serviceStage(service: string, rows: GenesisNode[], override: string | null): ServiceStage {
  const milestones = milestonesOf(service);
  const stages = [...milestones, LIVE];
  const pick = (at: number): ServiceStage => ({ stages, at, stage: stages[at], live: at === stages.length - 1 });

  if (override != null && override.trim().toLowerCase() === LIVE.toLowerCase()) return pick(stages.length - 1);
  const named = matchMilestone(service, override);
  if (named != null) return pick(milestones.indexOf(named));

  const planned = rows.filter((row) => milestones.includes(milestoneOf(row)));
  if (planned.length === 0) return pick(0);
  const open = milestones.findIndex((m) => planned.some((row) => milestoneOf(row) === m && taskStatusOf(row) !== 'Done'));
  return pick(open === -1 ? stages.length - 1 : open);
}
