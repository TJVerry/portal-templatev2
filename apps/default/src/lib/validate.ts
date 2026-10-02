/**
 * Format checks and tidy-ups for onboarding answers. Plain-language messages for church staff.
 */

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

function phoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

export function isValidPhone(value: string): boolean {
  return phoneDigits(value).length === 10;
}

/** (555) 555-5555 for US numbers; anything else is left as typed. */
export function formatPhone(value: string): string {
  const d = phoneDigits(value);
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : value.trim();
}

/** Adds https:// when missing. Returns null when it does not look like a web address. */
export function normalizeUrl(value: string): string | null {
  const raw = value.trim();
  if (raw === '') return '';
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.hostname.includes('.') ? url.href.replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

/** Rows (service times, teammates) are stored as JSON strings in a string[]. */
export type Row = Record<string, string>;

export function parseRows(value: string | string[] | undefined): Row[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      try {
        const parsed: unknown = JSON.parse(entry);
        return parsed != null && typeof parsed === 'object' ? (parsed as Row) : null;
      } catch {
        return null;
      }
    })
    .filter((row): row is Row => row != null);
}

export function encodeRows(rows: Row[]): string[] {
  return rows.map((row) => JSON.stringify(row));
}

function rowIsBlank(row: Row): boolean {
  return Object.values(row).every((v) => (v ?? '').trim() === '');
}

/** Rows that have something in them. */
export function filledRows(value: string | string[] | undefined): Row[] {
  return parseRows(value).filter((row) => !rowIsBlank(row));
}

/** 13:30 -> 1:30 PM */
export function formatTime(value: string | undefined): string {
  if (value == null || !/^\d{1,2}:\d{2}$/.test(value)) return value ?? '';
  const [h, m] = value.split(':').map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Returns a message when a filled-in answer has the wrong format, else null. */
export function formatError(type: string, value: string | string[] | undefined): string | null {
  if (type === 'email' && typeof value === 'string' && value.trim() !== '' && !isValidEmail(value)) {
    return 'That email does not look right. Example: name@church.org';
  }
  if (type === 'tel' && typeof value === 'string' && value.trim() !== '' && !isValidPhone(value)) {
    return 'Please enter a 10-digit phone number, like (555) 555-5555.';
  }
  if (type === 'url' && typeof value === 'string' && value.trim() !== '' && normalizeUrl(value) == null) {
    return 'That web address does not look right. Example: yourchurch.org';
  }
  if (type === 'times') {
    for (const row of filledRows(value)) {
      if ((row.day ?? '') === '' || (row.start ?? '') === '') return 'Each service time needs a day and a start time.';
      if ((row.end ?? '') !== '' && row.end <= row.start) return 'An end time is before its start time.';
    }
  }
  if (type === 'people') {
    for (const row of filledRows(value)) {
      if ((row.name ?? '').trim() === '') return 'Each teammate needs a name.';
      if ((row.email ?? '').trim() !== '' && !isValidEmail(row.email)) return `${row.name}'s email does not look right.`;
      if ((row.phone ?? '').trim() !== '' && !isValidPhone(row.phone)) return `${row.name}'s phone needs 10 digits.`;
    }
  }
  return null;
}
