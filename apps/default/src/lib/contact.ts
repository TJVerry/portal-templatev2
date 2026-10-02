import { CHURCH_NAME } from '@/client';
import { CALL_CALENDAR_URL, SUPPORT_EMAIL } from '@/config';

/** An email to us with the church name in the subject. */
export function mailtoUs(subject: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${subject} - ${CHURCH_NAME}`)}`;
}

/** "Book a call": the GHL calendar, or an email to us when no calendar is set. */
export function bookCallHref(): string {
  return CALL_CALENDAR_URL !== '' ? CALL_CALENDAR_URL : mailtoUs('Book a call');
}
