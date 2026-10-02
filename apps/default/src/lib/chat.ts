import { FILES_PROJECT_ID, MESSAGES_PROJECT_ID } from '@/client';
import { CHAT_RELAY_URL, SUPPORT_EMAIL } from '@/config';
import { createNode, getFieldValue, getTitle, updateNode } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';
import { FOLDER_FIELD } from '@/lib/media';
import { today } from '@/lib/scope';
import { storeFile } from '@/lib/store-file';

/**
 * Chat data. One row per message in "Portal — Messages":
 * Message (text), From (text: sender email), Sent At (date), Data (text: JSON below).
 *
 * A message is from Faith Funnels when From is empty, is a faithfunnels.ai email,
 * or came in from GHL (`source: 'ghl'`, written by the chat relay).
 */

export interface ChatFile {
  name: string;
  url: string;
  size?: number;
  type?: string;
}

export interface ChatData {
  /** Sender's display name. */
  name?: string;
  /** Exact send time (ISO). The Sent At date column keeps only the day. */
  sentAt?: string;
  files?: ChatFile[];
  /** Row id of the message this one answers. */
  replyTo?: string;
  /** Emoji -> emails of the people who reacted. */
  reactions?: Record<string, string[]>;
  editedAt?: string;
  deleted?: boolean;
  source?: 'portal' | 'ghl';
  /** Set by the relay once the message is in the GHL inbox. */
  ghlMessageId?: string;
  /** Set when the message is a comment on a task (Portal — Tasks row id). See lib/task-comments.tsx. */
  taskId?: string;
  /** Task name when the comment was sent, so Chat can label it. */
  taskTitle?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  from: string;
  name: string;
  isAgency: boolean;
  sentAt: Date | null;
  data: ChatData;
}

export const REACTIONS = ['👍', '❤️', '😂', '🎉', '🙏', '✅'];
export const MAX_FILE_BYTES = 500 * 1024 * 1024;
const AGENCY_DOMAIN = `@${SUPPORT_EMAIL.split('@')[1] ?? 'faithfunnels.ai'}`;
const SEEN_KEY = `ff-chat-seen-${MESSAGES_PROJECT_ID}`;

export function isAgencyEmail(email: string): boolean {
  return email.toLowerCase().endsWith(AGENCY_DOMAIN);
}

export function parseData(raw: string | null): ChatData {
  if (raw == null || raw.trim() === '') return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed != null && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as ChatData) : {};
  } catch {
    return {};
  }
}

function toDate(raw: string | null | undefined): Date | null {
  if (raw == null || raw === '') return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toMessage(row: GenesisNode): ChatMessage {
  const data = parseData(getFieldValue(row, 'Data'));
  const from = (getFieldValue(row, 'From') ?? '').trim();
  const isAgency = from === '' || isAgencyEmail(from) || data.source === 'ghl';
  const name = data.name?.trim() || (isAgency ? 'Faith Funnels' : (from.split('@')[0] ?? from));
  return {
    id: row.id,
    text: getTitle(row, 'Message') ?? '',
    from,
    name,
    isAgency,
    sentAt: toDate(data.sentAt) ?? toDate(getFieldValue(row, 'Sent At')),
    data,
  };
}

/** Messages to show: has text or files, and not deleted (a deleted row stays in Taskade as a record, hidden here). */
export function toMessages(rows: GenesisNode[]): ChatMessage[] {
  return rows
    .map(toMessage)
    .filter((m) => m.data.deleted !== true && (m.text.trim() !== '' || (m.data.files?.length ?? 0) > 0));
}

export function isFromAgency(row: GenesisNode): boolean {
  return toMessage(row).isAgency;
}

/** Writes Data back, keeping every key we did not change (the relay adds ghlMessageId). */
export async function saveData(id: string, current: ChatData, patch: Partial<ChatData>, extra: Record<string, string> = {}) {
  const next: ChatData = { ...current, ...patch };
  return updateNode(MESSAGES_PROJECT_ID, id, { ...extra, Data: JSON.stringify(next) });
}

export function toggleReaction(data: ChatData, emoji: string, email: string): Record<string, string[]> {
  const reactions = { ...(data.reactions ?? {}) };
  const people = reactions[emoji] ?? [];
  const has = people.some((p) => p.toLowerCase() === email.toLowerCase());
  const next = has ? people.filter((p) => p.toLowerCase() !== email.toLowerCase()) : [...people, email];
  if (next.length === 0) delete reactions[emoji];
  else reactions[emoji] = next;
  return reactions;
}

/** "Today", "Yesterday", or "Monday, Sep 29". */
export function dayLabel(date: Date | null): string {
  if (date == null) return 'Earlier';
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() !== today.getFullYear() ? { year: 'numeric' } : {}),
  });
}

export function timeLabel(date: Date | null): string {
  return date == null ? '' : date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p !== '');
  const letters = parts.length >= 2 ? (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '') : name.slice(0, 2);
  return letters.toUpperCase() || '?';
}

export function isImage(file: ChatFile): boolean {
  return (file.type ?? '').startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file.name);
}

export function sizeLabel(bytes: number | undefined): string {
  if (bytes == null) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/* Unread badge: how many Faith Funnels messages this browser has seen. */

export function readSeen(): number {
  try {
    return Number(localStorage.getItem(SEEN_KEY) ?? '0') || 0;
  } catch {
    return 0;
  }
}

export function writeSeen(count: number) {
  try {
    localStorage.setItem(SEEN_KEY, String(count));
  } catch {
    // Private window: the badge comes back after reload. Harmless.
  }
}

/**
 * Also lists files sent in chat in "Portal — Files" (folder "Chat"), so staff find every file in one place.
 * Never blocks the chat: the message is already sent.
 */
export function addChatFilesToFiles(files: ChatFile[], email: string) {
  for (const f of files) {
    createNode(FILES_PROJECT_ID, {
      'File Name': f.name,
      'File URL': f.url,
      [FOLDER_FIELD]: 'Chat',
      'Uploaded By': email,
      'Uploaded At': today(),
      Note: 'Sent in chat',
    }).catch((err: unknown) => console.warn('Chat file not added to Files', err));
  }
}

/* Relay: sends portal messages to the GHL inbox and stores big files (Cloudflare R2). */

/** Tells the relay a message was sent, so it reaches the GHL inbox. Never blocks the chat. */
export function notifyRelay(rowId: string | null) {
  if (CHAT_RELAY_URL === '' || rowId == null) return;
  void fetch(`${CHAT_RELAY_URL}/portal/sent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: MESSAGES_PROJECT_ID, rowId }),
    keepalive: true,
  }).catch((err: unknown) => console.warn('Chat relay did not answer', err));
}

/**
 * Uploads one chat file. With the relay: straight to R2, up to 500 MB, with progress.
 * Without it: Taskade Media (10 MB).
 */
export async function uploadChatFile(file: File, onProgress: (pct: number) => void): Promise<ChatFile> {
  if (file.size > MAX_FILE_BYTES) throw new Error(`"${file.name}" is larger than 500 MB.`);
  const type = file.type || 'application/octet-stream';
  if (CHAT_RELAY_URL === '') {
    const stored = await storeFile(file);
    onProgress(100);
    return { name: stored.name, url: stored.url, size: file.size, type };
  }
  const res = await fetch(`${CHAT_RELAY_URL}/files/sign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId: MESSAGES_PROJECT_ID, name: file.name, size: file.size, type }),
  });
  if (!res.ok) throw new Error(`Upload link failed (${res.status})`);
  const { uploadUrl, fileUrl } = (await res.json()) as { uploadUrl: string; fileUrl: string };
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed (network)'));
    xhr.send(file);
  });
  onProgress(100);
  return { name: file.name, url: fileUrl, size: file.size, type };
}
