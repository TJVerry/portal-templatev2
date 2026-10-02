import { ONBOARDING_PROJECT_ID, USERS_PROJECT_ID } from '@/client';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { createNode, deleteNode, getFieldValue, updateNode } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';

/**
 * Each person's profile is one row in "Portal — Users" (columns in USER_FIELDS).
 * Email is their sign-in email: the key that Tasks ("Assigned To") and Messages ("From") point to.
 * Names and photos are looked up from here when shown (lib/people.tsx), so a change shows everywhere.
 * The sign-in email itself belongs to Taskade (App Users) and cannot be changed here.
 *
 * Before Portal — Users, a profile was a row in "Portal — Onboarding" (Status = "Profile",
 * Updated By = email, Answers = JSON). Those rows are still read. The next save moves the person to Portal — Users.
 * Until Portal — Users has its columns, saves keep going to the old row.
 */

/** Portal — Users column names (all text). */
export const USER_FIELDS = {
  email: 'Email',
  firstName: 'First Name',
  lastName: 'Last Name',
  photoUrl: 'Photo',
  role: 'Role',
  phone: 'Phone',
  contactEmail: 'Contact Email',
} as const;

export const STATUS_PROFILE = 'Profile';

export interface Profile {
  firstName: string;
  lastName: string;
  /** Where they want email from us. Can differ from the sign-in email. */
  contactEmail: string;
  phone: string;
  role: string;
  photoUrl: string;
}

export const EMPTY_PROFILE: Profile = { firstName: '', lastName: '', contactEmail: '', phone: '', role: '', photoUrl: '' };

export function isProfileRow(row: GenesisNode): boolean {
  return (getFieldValue(row, 'Status') ?? '') === STATUS_PROFILE;
}

export function parseProfile(raw: string | null): Profile {
  if (raw == null || raw.trim() === '') return EMPTY_PROFILE;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed == null || typeof parsed !== 'object') return EMPTY_PROFILE;
    const out = { ...EMPTY_PROFILE };
    for (const key of Object.keys(EMPTY_PROFILE) as (keyof Profile)[]) {
      const value = (parsed as Record<string, unknown>)[key];
      if (typeof value === 'string') out[key] = value;
    }
    return out;
  } catch {
    return EMPTY_PROFILE;
  }
}

function userProfile(row: GenesisNode): Profile {
  const out = { ...EMPTY_PROFILE };
  for (const key of Object.keys(EMPTY_PROFILE) as (keyof Profile)[]) {
    out[key] = (getFieldValue(row, USER_FIELDS[key]) ?? '').trim();
  }
  return out;
}

export interface SavedProfile {
  profile: Profile;
  /** Their Portal — Users row. */
  userRowId: string | null;
  /** Their old Portal — Onboarding profile row. */
  legacyRowId: string | null;
}

/** Everyone's saved profile, by lowercased sign-in email. A Portal — Users row wins over an old one. */
export function savedProfiles(users: GenesisNode[], onboarding: GenesisNode[]): Map<string, SavedProfile> {
  const map = new Map<string, SavedProfile>();
  for (const row of onboarding) {
    if (!isProfileRow(row)) continue;
    const key = (getFieldValue(row, 'Updated By') ?? '').trim().toLowerCase();
    if (key !== '') map.set(key, { profile: parseProfile(getFieldValue(row, 'Answers')), userRowId: null, legacyRowId: row.id });
  }
  for (const row of users) {
    const key = (getFieldValue(row, USER_FIELDS.email) ?? '').trim().toLowerCase();
    if (key === '') continue;
    map.set(key, { profile: userProfile(row), userRowId: row.id, legacyRowId: map.get(key)?.legacyRowId ?? null });
  }
  return map;
}

export interface ProfileState {
  loading: boolean;
  /** Portal — Users row, or null before their first save there. */
  rowId: string | null;
  legacyRowId: string | null;
  /** Saved profile, with sign-in name and email filled in where the person left blanks. */
  profile: Profile;
  refresh: () => Promise<void>;
}

/** The signed-in person's profile. `fallbackName` is the name Taskade has for them. */
export function useProfile(email: string, fallbackName: string | null): ProfileState {
  const users = useLiveNodes(USERS_PROJECT_ID);
  const legacy = useLiveNodes(ONBOARDING_PROJECT_ID);
  const entry = savedProfiles(users.nodes, legacy.nodes).get(email.trim().toLowerCase()) ?? null;
  const saved = entry?.profile ?? EMPTY_PROFILE;
  const [first = '', ...rest] = (fallbackName ?? '').trim().split(/\s+/);
  return {
    loading: (users.loading && users.nodes.length === 0) || (legacy.loading && legacy.nodes.length === 0),
    rowId: entry?.userRowId ?? null,
    legacyRowId: entry?.legacyRowId ?? null,
    profile: {
      ...saved,
      firstName: saved.firstName !== '' || entry != null ? saved.firstName : first,
      lastName: saved.lastName !== '' || entry != null ? saved.lastName : rest.join(' '),
      contactEmail: saved.contactEmail !== '' ? saved.contactEmail : email,
    },
    refresh: async () => {
      await Promise.all([users.refresh(), legacy.refresh()]);
    },
  };
}

/**
 * Adds the signed-in person to Portal — Users on their first visit, so they can be picked as a task assignee
 * before they ever open "Your profile". Does nothing (and keeps nothing) until that list has its columns.
 */
export async function registerUser(email: string, profile: Profile): Promise<void> {
  const fields: Record<string, string> = { [USER_FIELDS.email]: email.trim().toLowerCase() };
  for (const key of Object.keys(EMPTY_PROFILE) as (keyof Profile)[]) fields[USER_FIELDS[key]] = profile[key];
  try {
    const { id, ignoredKeys } = await createNode(USERS_PROJECT_ID, fields);
    if (ignoredKeys.length > 0 && id != null) await deleteNode(USERS_PROJECT_ID, id);
  } catch (err) {
    console.warn('Portal — Users is not reachable yet', err);
  }
}

/** Saves to Portal — Users, creating their row the first time. Falls back to the old row until that list has its columns. */
export async function saveProfile(
  ids: { rowId: string | null; legacyRowId: string | null },
  email: string,
  profile: Profile,
): Promise<void> {
  const fields: Record<string, string> = { [USER_FIELDS.email]: email.trim().toLowerCase() };
  for (const key of Object.keys(EMPTY_PROFILE) as (keyof Profile)[]) fields[USER_FIELDS[key]] = profile[key];
  try {
    const result = ids.rowId != null ? await updateNode(USERS_PROJECT_ID, ids.rowId, fields) : await createNode(USERS_PROJECT_ID, fields);
    if (result.ignoredKeys.length === 0) return;
    // A column is missing: do not keep a half-saved row.
    if (ids.rowId == null && result.id != null) await deleteNode(USERS_PROJECT_ID, result.id);
    console.warn('Portal — Users is missing columns, saving the profile the old way:', result.ignoredKeys);
  } catch (err) {
    console.warn('Portal — Users is not reachable, saving the profile the old way', err);
  }
  const legacy = { Status: STATUS_PROFILE, 'Updated By': email, Answers: JSON.stringify(profile) };
  if (ids.legacyRowId != null) await updateNode(ONBOARDING_PROJECT_ID, ids.legacyRowId, legacy);
  else await createNode(ONBOARDING_PROJECT_ID, legacy);
}

/** "First Last", or "" when both are empty. */
export function nameOf(profile: Profile): string {
  return `${profile.firstName} ${profile.lastName}`.trim();
}
