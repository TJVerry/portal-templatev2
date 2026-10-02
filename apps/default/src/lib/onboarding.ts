import { ONBOARDING_PROJECT_ID } from '@/client';
import type { Answers } from '@/data/onboarding';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { createNode, getFieldValue, updateNode } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';
import { isProfileRow } from '@/lib/profile';

/**
 * One row per church in "Portal — Onboarding" holds the whole interview:
 * Answers (JSON), Status, Current Step, Updated By, Submitted At, Kickoff Booked At.
 * Everyone at the church shares it, so a second person can pick up where the first stopped.
 */

export const STATUS_SUBMITTED = 'Submitted';

export interface OnboardingState {
  loading: boolean;
  rowId: string | null;
  status: string;
  answers: Answers;
  currentStep: string | null;
  submittedAt: string | null;
  kickoffBookedAt: string | null;
  refresh: () => Promise<void>;
}

function parseAnswers(raw: string | null): Answers {
  if (raw == null || raw.trim() === '') return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed != null && typeof parsed === 'object' ? (parsed as Answers) : {};
  } catch {
    return {};
  }
}

/** The same list also holds one profile row per person (see lib/profile.ts). Skip those. */
function findRow(nodes: GenesisNode[]): GenesisNode | null {
  const rows = nodes.filter((n) => !isProfileRow(n));
  return rows.find((n) => (n.content ?? '').trim() === 'Onboarding') ?? rows[0] ?? null;
}

export function useOnboarding(): OnboardingState {
  const live = useLiveNodes(ONBOARDING_PROJECT_ID);
  const row = findRow(live.nodes);
  const value = (key: string) => (row == null ? null : getFieldValue(row, key));
  const status = value('Status');
  return {
    loading: live.loading && live.nodes.length === 0,
    rowId: row?.id ?? null,
    status: status == null || status === '' ? 'Not started' : status,
    answers: parseAnswers(value('Answers')),
    currentStep: value('Current Step'),
    submittedAt: value('Submitted At'),
    kickoffBookedAt: value('Kickoff Booked At'),
    refresh: live.refresh,
  };
}

/** Writes fields to the onboarding row, creating it the first time. Returns the row id. */
export async function saveOnboarding(
  rowId: string | null,
  fields: Record<string, string>,
): Promise<string | null> {
  if (rowId != null) {
    await updateNode(ONBOARDING_PROJECT_ID, rowId, fields);
    return rowId;
  }
  const { id } = await createNode(ONBOARDING_PROJECT_ID, fields);
  return id;
}
