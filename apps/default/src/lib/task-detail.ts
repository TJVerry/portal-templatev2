import { getFieldValue, getTitle, updateNode } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';
import { kindOf } from '@/lib/media';
import type { MediaFile } from '@/lib/media';
import { today } from '@/lib/scope';

/**
 * Extra detail for one task card, read from Portal — Tasks.
 *
 * What the Taskade data link sends an app: custom fields, the task text, its checkbox,
 * and which task it sits under. It does NOT send Taskade's own note, due date, or
 * attachments. So:
 * - Description = the "Notes" field.
 * - Checklist = subtasks (indent a task under another one in Taskade).
 * - Files = every link in "Notes". Paste a file link there (Taskade media, Google Drive,
 *   Dropbox). Use [Logo pack](https://...) to give it a nice name.
 * - History = the "History" text field. One event per line: `2026-10-01 | Design sent for review`.
 *   The portal adds a line when the church taps "I did this" or an admin moves the task on the board.
 *   Type more lines in Taskade by hand.
 */

/**
 * Portal — Tasks text field: sign-in emails of the people doing the task, comma separated
 * (`mary@church.org, jake@faithfunnels.ai`). Empty = no one picked.
 */
export const ASSIGNED_FIELD = 'Assigned To';

/**
 * Written when everyone is taken off a task. An empty "Assigned To" means "never set", and our tasks
 * then fall back to the default person (DEFAULT_AGENCY_ASSIGNEE); "none" keeps them unassigned.
 */
export const NO_ASSIGNEE = 'none';

/** The emails in "Assigned To": lowercased, in order, no repeats. Commas, semicolons or new lines split them. */
export function assigneesOf(row: GenesisNode): string[] {
  return parseAssignees(getFieldValue(row, ASSIGNED_FIELD) ?? '');
}

export function parseAssignees(raw: string): string[] {
  const emails = raw
    .split(/[,;\n]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.includes('@'));
  return [...new Set(emails)];
}

/** True when "Assigned To" was never filled in, so a default person may apply. */
export function assigneesUnset(row: GenesisNode): boolean {
  return (getFieldValue(row, ASSIGNED_FIELD) ?? '').trim() === '';
}

/** The "Assigned To" value for a list of emails. */
export function assigneesValue(emails: string[]): string {
  return emails.length > 0 ? emails.join(', ') : NO_ASSIGNEE;
}

export interface TaskLink {
  url: string;
  name: string;
  kind: MediaFile['kind'];
}

/** A piece of the Notes text: plain words, or a link to show inline. */
export type NotePart = { text: string } | { text: string; url: string };

const LINK_RE = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>()]+)/g;

/** Drops trailing punctuation a sentence put after a bare link: "see https://x.com/a." */
function trimUrl(url: string): string {
  return url.replace(/[.,;:!?'"]+$/, '');
}

function nameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const last = decodeURIComponent(path.slice(path.lastIndexOf('/') + 1));
    return last !== '' ? last : new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Splits Notes into text and links, in order. */
export function noteParts(notes: string): NotePart[] {
  const parts: NotePart[] = [];
  let at = 0;
  for (const match of notes.matchAll(LINK_RE)) {
    const start = match.index ?? 0;
    const bare = match[3] != null ? trimUrl(match[3]) : null;
    const url = bare ?? match[2];
    const end = bare != null ? start + bare.length : start + match[0].length;
    if (start > at) parts.push({ text: notes.slice(at, start) });
    parts.push({ text: match[1] ?? nameFromUrl(url), url });
    at = end;
  }
  if (at < notes.length) parts.push({ text: notes.slice(at) });
  return parts;
}

/** Every link in Notes, once each, as a file card. */
export function noteLinks(notes: string): TaskLink[] {
  const seen = new Set<string>();
  const links: TaskLink[] = [];
  for (const part of noteParts(notes)) {
    if (!('url' in part) || seen.has(part.url)) continue;
    seen.add(part.url);
    links.push({ url: part.url, name: part.text, kind: kindOf(part.text, part.url) });
  }
  return links;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

/** Subtasks by parent task id. A subtask is done when its box is ticked or its Status is Done. */
export function subtasksByParent(nodes: GenesisNode[]): Map<string, Subtask[]> {
  const map = new Map<string, Subtask[]>();
  for (const row of nodes) {
    if (row.parentId == null) continue;
    const done = getFieldValue(row, '/completed') === 'true' || getFieldValue(row, 'Status') === 'Done';
    map.set(row.parentId, [
      ...(map.get(row.parentId) ?? []),
      { id: row.id, title: getTitle(row, 'Task') ?? 'Step', done },
    ]);
  }
  return map;
}

export interface HistoryEntry {
  /** `YYYY-MM-DD`, or null when the line has no date in front. */
  date: string | null;
  text: string;
}

const HISTORY_RE = /^(\d{4}-\d{2}-\d{2})\s*[|·:-]?\s*(.*)$/;

/** The History field as events, newest first. Lines are written oldest first. */
export function historyOf(row: GenesisNode): HistoryEntry[] {
  const text = getFieldValue(row, 'History') ?? '';
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '')
    .map((line) => {
      const match = HISTORY_RE.exec(line);
      return match != null && match[2] !== '' ? { date: match[1], text: match[2] } : { date: null, text: line };
    })
    .reverse();
}

/** "2026-10-01" -> "Oct 1, 2026". */
export function historyDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Adds one dated line to a task's History. Never throws: if the list has no History field yet,
 * the line is skipped and the change it describes still stands.
 */
export async function addTaskHistory(projectId: string, row: GenesisNode, text: string): Promise<void> {
  const prev = (getFieldValue(row, 'History') ?? '').trim();
  const line = `${today()} | ${text}`;
  try {
    await updateNode(projectId, row.id, { History: prev === '' ? line : `${prev}\n${line}` });
  } catch (err) {
    console.warn('Task history not saved (add a "History" text field to Portal — Tasks)', err);
  }
}

/** Marks a task Done, then adds a line to its History. */
export async function markTaskDone(projectId: string, row: GenesisNode, who: string): Promise<void> {
  await updateNode(projectId, row.id, { Status: 'Done' });
  await addTaskHistory(projectId, row, `Marked done by ${who}`);
}
