import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';

import { ONBOARDING_PROJECT_ID, USERS_PROJECT_ID } from '@/client';
import { AGENCY_NAME } from '@/config';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import type { UseLiveNodesResult } from '@/hooks/use-live-nodes';
import { initials, isAgencyEmail, toMessage } from '@/lib/chat';
import { AGENCY_PHOTO_SRC } from '@/lib/headshot';
import { nameOf, savedProfiles } from '@/lib/profile';

/**
 * Everyone in this portal, by sign-in email, with the name and photo from their profile ("Your profile").
 * Chat, task comments, task assignees and Files look a person up here each time they show them,
 * so a new name or photo shows everywhere at once. Nothing stores a copy.
 */

export interface Person {
  /** Lowercased sign-in email. Empty for Faith Funnels messages with no sender (GHL replies). */
  email: string;
  name: string;
  /** Empty shows initials. */
  photoUrl: string;
  isAgency: boolean;
}

interface PeopleValue {
  /**
   * The person using the portal (lowercased email). In the Taskade editor preview there is no sign-in,
   * so this is the preview's stand-in (SUPPORT_EMAIL), not the sign-in data. Empty outside the portal.
   */
  me: string;
  /** Everyone we know of (a saved profile, or a chat message): the church first, then Faith Funnels. */
  list: Person[];
  /** Name and photo for an email. `fallbackName` is used when they never saved a name. */
  who: (email: string, fallbackName?: string, agency?: boolean) => Person;
}

type Known = { name: string; photoUrl: string };

function build(known: Map<string, Known>, me = ''): PeopleValue {
  const who = (rawEmail: string, fallbackName = '', agency = false): Person => {
    const email = rawEmail.trim().toLowerCase();
    const isAgency = agency || email === '' || isAgencyEmail(email);
    const k = email !== '' ? known.get(email) : undefined;
    const name =
      (k?.name ?? '') !== '' ? (k?.name ?? '') : fallbackName.trim() !== '' ? fallbackName.trim() : isAgency ? AGENCY_NAME : (email.split('@')[0] ?? email);
    const photoUrl = (k?.photoUrl ?? '') !== '' ? (k?.photoUrl ?? '') : isAgency ? AGENCY_PHOTO_SRC : '';
    return { email, name, photoUrl, isAgency };
  };
  const list = [...known.keys()]
    .map((email) => who(email))
    .sort((a, b) => Number(a.isAgency) - Number(b.isAgency) || a.name.localeCompare(b.name));
  return { me: me.trim().toLowerCase(), list, who };
}

const PeopleContext = createContext<PeopleValue>(build(new Map()));

export function PeopleProvider({
  messages,
  me,
  children,
}: {
  messages: UseLiveNodesResult;
  /** The signed-in person, so they show right before their profile row exists. */
  me: { email: string; name: string; photoUrl: string };
  children: ReactNode;
}) {
  const users = useLiveNodes(USERS_PROJECT_ID);
  const legacy = useLiveNodes(ONBOARDING_PROJECT_ID);
  const value = useMemo(() => {
    const known = new Map<string, Known>();
    const add = (email: string, next: Partial<Known>) => {
      const key = email.trim().toLowerCase();
      if (key === '') return;
      const prev = known.get(key) ?? { name: '', photoUrl: '' };
      known.set(key, { name: next.name || prev.name, photoUrl: next.photoUrl || prev.photoUrl });
    };
    // Oldest to newest, so the most recent name wins: chat names, then the signed-in person, then saved profiles.
    for (const m of messages.nodes.map(toMessage)) if (m.from !== '') add(m.from, { name: m.data.name?.trim() ?? '' });
    add(me.email, { name: me.name, photoUrl: me.photoUrl });
    const saved = savedProfiles(users.nodes, legacy.nodes);
    for (const [email, { profile }] of saved) add(email, { name: nameOf(profile) });
    // A saved profile is the truth for the photo: one with the photo removed shows initials, not an old photo.
    for (const [email, { profile }] of saved) {
      const entry = known.get(email);
      if (entry != null) entry.photoUrl = profile.photoUrl;
    }
    return build(known, me.email);
  }, [messages.nodes, users.nodes, legacy.nodes, me.email, me.name, me.photoUrl]);
  return <PeopleContext.Provider value={value}>{children}</PeopleContext.Provider>;
}

/** Outside the portal (no provider) everyone shows their stored name and initials. */
export function usePeople(): PeopleValue {
  return useContext(PeopleContext);
}

/** Round photo, or initials when they have no photo. `label` makes it readable to screen readers. */
export function PersonAvatar({ person, size = 'sm', label }: { person: Person; size?: 'sm' | 'md'; label?: string }) {
  const cls = `td-avatar td-avatar-${size}`;
  const a11y = label != null ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  return person.photoUrl !== '' ? (
    <img className={cls} src={person.photoUrl} alt={label ?? ''} title={label ?? person.name} loading="lazy" />
  ) : (
    <span className={`${cls} td-avatar-you`} title={label ?? person.name} {...a11y}>
      {initials(person.name)}
    </span>
  );
}
