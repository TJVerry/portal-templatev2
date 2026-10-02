import { useEffect, useRef, useState } from 'react';

import { SERVICES } from '@/client';
import { KICKOFF_CALENDAR_URL, SUPPORT_EMAIL } from '@/config';
import { GET_READY } from '@/data/onboarding';
import { CalendarCheck, Check, Loader2 } from '@/lib/icons';
import { saveOnboarding } from '@/lib/onboarding';
import type { OnboardingState } from '@/lib/onboarding';
import { today } from '@/lib/scope';

/** What to have ready on the call. Access is granted live, never by typing passwords. */
export function GetReadyList() {
  const items = GET_READY.filter((i) => i.service == null || SERVICES.includes(i.service));
  return (
    <div className="ff-item">
      <h2 className="ff-item-title">Get ready for your call</h2>
      <p className="ff-item-meta">Have these open. We will connect everything together, safely, on the call.</p>
      <ul className="home-checklist">
        {items.map((i) => (
          <li key={i.item}>
            <span className="ob-check" aria-hidden="true">
              <Check />
            </span>
            {i.item}
          </li>
        ))}
      </ul>
      <p className="ff-small" style={{ margin: 0 }}>
        Please do not email or type passwords to us. Ever.
      </p>
    </div>
  );
}

interface Person {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

/** GHL phone format: +1 and 10 digits for US numbers. */
function e164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return phone;
}

/** The GHL booking link, pre-filled so they never retype their details. */
function calendarUrl(person: Person): string {
  try {
    const url = new URL(KICKOFF_CALENDAR_URL);
    if (person.firstName !== '') url.searchParams.set('first_name', person.firstName);
    if (person.lastName !== '') url.searchParams.set('last_name', person.lastName);
    if (person.email !== '') url.searchParams.set('email', person.email);
    if (person.phone !== '') url.searchParams.set('phone', e164(person.phone));
    return url.href;
  } catch {
    return KICKOFF_CALENDAR_URL;
  }
}

/** The primary contact from onboarding, falling back to whoever is signed in. */
function personFrom(onboarding: OnboardingState, email: string, name: string): Person {
  const pick = (key: string) => {
    const value = onboarding.answers[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  const fullName = pick('contactName') || (name === 'Preview' ? '' : name);
  const [firstName = '', ...rest] = fullName.split(/\s+/).filter(Boolean);
  return {
    firstName,
    lastName: rest.join(' '),
    email: pick('contactEmail') || email,
    phone: pick('contactPhone'),
  };
}

/** GHL posts ['msgsndr-booking-complete', {...}] to the page when a booking is made. */
function isBookingComplete(data: unknown): boolean {
  if (Array.isArray(data)) return data[0] === 'msgsndr-booking-complete';
  if (typeof data === 'string') return data.includes('msgsndr-booking-complete');
  if (data != null && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    return d.type === 'msgsndr-booking-complete' || d.event === 'msgsndr-booking-complete';
  }
  return false;
}

const FRAME_ID = 'ff-kickoff-calendar';
const RESIZER = '[iFrameSizer]';

/**
 * The calendar's content height from its own messages, or null.
 * GHL sends iframe-resizer messages ('[iFrameSizer]id:height:width:type') once we say hello,
 * and also ['highlevel.setHeight', { height }].
 */
function frameHeight(data: unknown): { height: number; resizer: boolean } | null {
  if (typeof data === 'string' && data.startsWith(RESIZER)) {
    const height = Number(data.slice(RESIZER.length).split(':')[1]);
    return height > 0 ? { height, resizer: true } : null;
  }
  if (Array.isArray(data) && data[0] === 'highlevel.setHeight') {
    const height = Number((data[1] as { height?: unknown } | undefined)?.height);
    return height > 0 ? { height, resizer: false } : null;
  }
  return null;
}

export function KickoffPanel({
  email,
  name,
  onboarding,
}: {
  email: string;
  name: string;
  onboarding: OnboardingState;
}) {
  const [saving, setSaving] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const booked = onboarding.kickoffBookedAt != null && onboarding.kickoffBookedAt !== '';
  const person = personFrom(onboarding, email, name);

  async function markBooked() {
    setSaving(true);
    try {
      await saveOnboarding(onboarding.rowId, { 'Kickoff Booked At': today(), 'Updated By': email });
      await onboarding.refresh();
    } catch (err) {
      console.error('Could not save booking', err);
    } finally {
      setSaving(false);
    }
  }

  // Listen to the GHL calendar: grow the frame to fit it (no scroll inside the page),
  // and mark the call booked when a booking is made.
  useEffect(() => {
    if (booked) return;
    let resizerSeen = false;
    function onMessage(event: MessageEvent) {
      const el = frame.current;
      if (el == null || event.source !== el.contentWindow) return;
      const size = frameHeight(event.data);
      if (size != null) {
        // The live resizer is exact; GHL's one-off height only counts until the resizer speaks.
        if (size.resizer) resizerSeen = true;
        if (size.resizer || !resizerSeen) el.style.height = `${Math.ceil(size.height)}px`;
        return;
      }
      if (isBookingComplete(event.data)) void markBooked();
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // markBooked only reads current props; re-subscribing on each render is not needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booked]);

  return (
    <div className="ff-stack">
      {booked ? (
        <div className="ff-item home-done">
          <CalendarCheck />
          <div>
            <h2 className="ff-item-title">Your kickoff call is booked.</h2>
            <p className="ff-item-meta">Check your email for the time and link. We are studying your answers now.</p>
          </div>
        </div>
      ) : (
        <div className="ff-item">
          <h2 className="ff-h2">Pick a time for your kickoff call</h2>
          <p className="ff-item-meta" style={{ marginTop: 8 }}>
            Times start 5 days out. We use those days to study your answers and prepare.
            {person.email !== '' && ` Your details are filled in for ${person.firstName || person.email}.`}
          </p>
          {KICKOFF_CALENDAR_URL !== '' ? (
            <iframe
              ref={frame}
              id={FRAME_ID}
              title="Book your kickoff call"
              src={calendarUrl(person)}
              className="home-calendar"
              scrolling="no"
              loading="lazy"
              // Say hello so the calendar starts sending its height (iframe-resizer protocol).
              onLoad={(e) =>
                e.currentTarget.contentWindow?.postMessage(
                  `${RESIZER}${FRAME_ID}:8:false:false:32:true:true:null:offset:null:null:0`,
                  '*',
                )
              }
            />
          ) : (
            <p className="ff-small" style={{ marginTop: 16 }}>
              We will email you a booking link shortly. Questions? Email {SUPPORT_EMAIL}.
            </p>
          )}
          <p className="ff-small" style={{ margin: '16px 0 0' }}>
            {saving ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Loader2 className="ff-spin" style={{ width: 14, height: 14 }} /> Saving your booking...
              </span>
            ) : (
              <>
                Booked but this page did not update?{' '}
                <button
                  type="button"
                  className="ff-link"
                  style={{ background: 'none', border: 0, padding: 0, font: 'inherit', cursor: 'pointer' }}
                  onClick={() => void markBooked()}
                >
                  Tap here
                </button>
                .
              </>
            )}
          </p>
        </div>
      )}
      <GetReadyList />
    </div>
  );
}
