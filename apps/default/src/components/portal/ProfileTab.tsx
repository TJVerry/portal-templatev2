import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { CHURCH_NAME } from '@/client';
import { AvatarFace } from '@/components/portal/PortalNav';
import { SUPPORT_EMAIL } from '@/config';
import { answerText } from '@/data/onboarding';
import type { Answers } from '@/data/onboarding';
import { openHostedLogin } from '@/lib/direct-signin';
import { Camera, Check, ChevronRight, CreditCard, Loader2, Lock, LogOut, Save, Trash2, Users } from '@/lib/icons';
import { saveOnboarding } from '@/lib/onboarding';
import type { OnboardingState } from '@/lib/onboarding';
import { nameOf, saveProfile } from '@/lib/profile';
import type { Profile, ProfileState } from '@/lib/profile';
import { storeFile, UNSUPPORTED } from '@/lib/store-file';
import { formatPhone, isValidEmail, isValidPhone } from '@/lib/validate';

/** Problems with the "Your details" form, or null when it can be saved. */
function checkDetails(p: Profile): string | null {
  if (p.firstName.trim() === '') return 'Please type your first name.';
  if (p.contactEmail.trim() !== '' && !isValidEmail(p.contactEmail)) {
    return 'That email does not look right. Example: name@church.org';
  }
  if (p.phone.trim() !== '' && !isValidPhone(p.phone)) return 'Please enter a 10-digit phone number, like (555) 555-5555.';
  return null;
}

const DETAIL_FIELDS: { id: Exclude<keyof Profile, 'photoUrl'>; label: string; type: string; auto: string; required?: boolean }[] = [
  { id: 'firstName', label: 'First name', type: 'text', auto: 'given-name', required: true },
  { id: 'lastName', label: 'Last name', type: 'text', auto: 'family-name' },
  { id: 'contactEmail', label: 'Email', type: 'email', auto: 'email' },
  { id: 'phone', label: 'Phone', type: 'tel', auto: 'tel' },
  { id: 'role', label: 'Role at the church', type: 'text', auto: 'organization-title' },
];

/** The signed-in person's own details: photo, name, email, phone, role. Saved per person (lib/profile.ts). */
function MyDetails({ email, me }: { email: string; me: ProfileState }) {
  const [draft, setDraft] = useState<Profile>(me.profile);
  const [dirty, setDirty] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'uploading' | 'saved' | 'error'>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  // Show the saved profile once it loads, unless they already started typing.
  const savedKey = JSON.stringify(me.profile);
  useEffect(() => {
    if (!dirty) setDraft(me.profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey]);

  async function save(next: Profile): Promise<boolean> {
    const issue = checkDetails(next);
    if (issue != null) {
      setProblem(issue);
      setState('error');
      return false;
    }
    const clean: Profile = {
      firstName: next.firstName.trim(),
      lastName: next.lastName.trim(),
      contactEmail: next.contactEmail.trim(),
      phone: next.phone.trim() === '' ? '' : formatPhone(next.phone),
      role: next.role.trim(),
      photoUrl: next.photoUrl,
    };
    setState('busy');
    setProblem(null);
    try {
      await saveProfile(me, email, clean);
      await me.refresh();
      setDraft(clean);
      setDirty(false);
      setState('saved');
      return true;
    } catch (err) {
      console.error('Profile save failed', err);
      setProblem('Could not save. Please try again.');
      setState('error');
      return false;
    }
  }

  async function pickPhoto(file: File) {
    if (!file.type.startsWith('image/')) {
      setProblem('Please choose a picture (JPG, PNG or similar).');
      setState('error');
      return;
    }
    setState('uploading');
    setProblem(null);
    try {
      const stored = await storeFile(file);
      const next = { ...draft, photoUrl: stored.url };
      setDraft(next);
      // Saves the photo right away. If a typed field has a problem, the photo waits for "Save changes".
      if (!(await save(next))) setDirty(true);
    } catch (err) {
      console.error('Photo upload failed', err);
      setProblem(
        err instanceof Error && err.message.includes('larger than 10 MB')
          ? 'That picture is too big. The limit is 10 MB.'
          : err instanceof Error && err.message.includes(UNSUPPORTED)
            ? err.message
            : 'That picture did not upload. Please try another one.',
      );
      setState('error');
    }
  }

  const busy = state === 'busy' || state === 'uploading';

  return (
    <form
      className="ff-card"
      data-genesis-form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void save(draft);
      }}
    >
      <h2 className="ff-h2">Your details</h2>
      <p className="ff-small" style={{ marginTop: 6 }}>
        Just for you. Your team and our team see this.
      </p>

      <div className="pf-photo">
        <span className="pf-avatar" aria-hidden="true">
          <AvatarFace name={nameOf(draft)} email={email} photoUrl={draft.photoUrl} />
        </span>
        <div className="ff-row-actions">
          <label className={`ff-btn ff-btn-secondary ff-btn-sm${busy ? ' pf-busy' : ''}`}>
            {state === 'uploading' ? <Loader2 className="ff-spin" /> : <Camera />}
            {state === 'uploading' ? 'Uploading...' : draft.photoUrl !== '' ? 'Change photo' : 'Add photo'}
            <input
              type="file"
              accept="image/*"
              className="ob-file"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (file != null) void pickPhoto(file);
              }}
            />
          </label>
          {draft.photoUrl !== '' && (
            <button
              type="button"
              className="ff-btn ff-btn-ghost ff-btn-sm"
              disabled={busy}
              onClick={() => void save({ ...draft, photoUrl: '' })}
            >
              <Trash2 /> Remove photo
            </button>
          )}
        </div>
      </div>

      <div className="pf-grid" style={{ marginTop: 20 }}>
        {DETAIL_FIELDS.map((f) => (
          <div key={f.id} data-genesis-field={f.label}>
            <label className="ff-label" htmlFor={`me-${f.id}`}>
              {f.label}
              {f.required === true && <span className="ff-req"> *</span>}
            </label>
            <input
              id={`me-${f.id}`}
              className="ff-input"
              type={f.type}
              autoComplete={f.auto}
              placeholder={f.id === 'phone' ? '(555) 555-5555' : f.id === 'role' ? 'Lead Pastor, Office Manager...' : undefined}
              value={draft[f.id]}
              onChange={(e) => {
                setDraft((d) => ({ ...d, [f.id]: e.target.value }));
                setDirty(true);
                setState('idle');
                setProblem(null);
              }}
            />
            {f.id === 'contactEmail' && (
              <p className="ff-help">Where we send you updates. You still sign in with {email}.</p>
            )}
          </div>
        ))}
      </div>

      <div className="pf-save">
        <button type="submit" className="ff-btn ff-btn-primary" data-genesis-submit disabled={!dirty || busy}>
          {state === 'busy' ? <Loader2 className="ff-spin" /> : <Save />} {state === 'busy' ? 'Saving...' : 'Save changes'}
        </button>
        {state === 'saved' && !dirty && (
          <span className="pf-saved" role="status">
            <Check /> Saved
          </span>
        )}
        {problem != null && (
          <span className="ff-error" role="alert">
            {problem}
          </span>
        )}
      </div>
    </form>
  );
}

/** Church details a church can keep up to date. Ids match the onboarding questions, so both stay in sync. */
const FIELDS: { section: string; items: { id: string; label: string; type: string; required?: boolean }[] }[] = [
  {
    section: 'Your church',
    items: [
      { id: 'knownAs', label: 'Church name', type: 'text', required: true },
      { id: 'legalName', label: 'Legal name', type: 'text' },
      { id: 'address', label: 'Street address', type: 'text' },
      { id: 'phone', label: 'Public phone', type: 'tel' },
      { id: 'publicEmail', label: 'Public email', type: 'email' },
      { id: 'website', label: 'Website', type: 'url' },
    ],
  },
  {
    section: 'Main contact',
    items: [
      { id: 'contactName', label: 'Full name', type: 'text' },
      { id: 'contactRole', label: 'Role at the church', type: 'text' },
      { id: 'contactEmail', label: 'Email', type: 'email' },
      { id: 'contactPhone', label: 'Cell phone', type: 'tel' },
    ],
  },
];

function textOf(answers: Answers, id: string): string {
  const v = answers[id];
  return typeof v === 'string' ? v : '';
}

export function ProfileTab({
  email,
  name,
  onboarding,
  me,
  onBilling,
  onSignOut,
}: {
  email: string;
  name: string;
  onboarding: OnboardingState;
  me: ProfileState;
  onBilling: () => void;
  onSignOut: () => void;
}) {
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    FIELDS.forEach((g) => g.items.forEach((f) => (out[f.id] = textOf(onboarding.answers, f.id))));
    return out;
  });
  const [saving, setSaving] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  const [pw, setPw] = useState<'idle' | 'busy' | 'signout'>('idle');

  const dirty = FIELDS.some((g) => g.items.some((f) => draft[f.id] !== textOf(onboarding.answers, f.id)));
  const team = answerText(onboarding.answers.team, 'people');

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving('busy');
    try {
      // Merge into the latest answers so nothing else in the onboarding row is lost.
      const merged: Answers = { ...onboarding.answers };
      Object.entries(draft).forEach(([id, value]) => {
        merged[id] = value.trim();
      });
      await saveOnboarding(onboarding.rowId, { Answers: JSON.stringify(merged), 'Updated By': email });
      await onboarding.refresh();
      setSaving('saved');
    } catch (err) {
      console.error('Profile save failed', err);
      setSaving('error');
    }
  }

  // Taskade's reset page is on the hosted sign-in page. While signed in it may skip straight past it,
  // so the fallback is: sign out, then "Forgot password?".
  async function changePassword() {
    setPw('busy');
    try {
      const form = await openHostedLogin();
      if (form.forgotUrl != null) {
        window.location.assign(form.forgotUrl);
        return;
      }
    } catch (err) {
      console.error('Could not open password reset', err);
    }
    setPw('signout');
  }

  return (
    <div className="ff-stack">
      <section className="ff-card pf-me">
        <span className="pf-avatar" aria-hidden="true">
          <AvatarFace name={name} email={email} photoUrl={me.profile.photoUrl} />
        </span>
        <div className="pf-me-text">
          <h2 className="ff-h2">{name !== '' ? name : 'Your account'}</h2>
          <p className="ff-small pf-email">{email}</p>
          <p className="ff-small pf-church">{CHURCH_NAME}</p>
        </div>
        <div className="pf-me-actions">
          <button type="button" className="ff-btn ff-btn-secondary ff-btn-sm" onClick={() => void changePassword()} disabled={pw === 'busy'}>
            {pw === 'busy' ? <Loader2 className="ff-spin" /> : <Lock />} Change password
          </button>
          <button type="button" className="ff-btn ff-btn-ghost ff-btn-sm" onClick={onSignOut}>
            <LogOut /> Sign out
          </button>
        </div>
        {pw === 'signout' && (
          <p className="ff-small pf-note" role="status">
            To set a new password: sign out, then tap <strong>Forgot password?</strong> on the sign-in page.
          </p>
        )}
        <p className="ff-small pf-note">
          Need to sign in with a different email? Email{' '}
          <a className="ff-link" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </section>

      <MyDetails email={email} me={me} />

      <form className="ff-card" data-genesis-form onSubmit={(e) => void save(e)}>
        <h2 className="ff-h2">Church profile</h2>
        <p className="ff-small" style={{ marginTop: 6 }}>
          We use these on your website, Google and ads. Keep them up to date.
        </p>
        {FIELDS.map((g) => (
          <fieldset key={g.section} className="pf-group">
            <legend className="pf-legend">{g.section}</legend>
            <div className="pf-grid">
              {g.items.map((f) => (
                <div key={f.id} className={f.id === 'address' ? 'pf-wide' : undefined} data-genesis-field={f.label}>
                  <label className="ff-label" htmlFor={`pf-${f.id}`}>
                    {f.label}
                    {f.required === true && <span className="ff-req"> *</span>}
                  </label>
                  <input
                    id={`pf-${f.id}`}
                    className="ff-input"
                    type={f.type}
                    required={f.required}
                    value={draft[f.id] ?? ''}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, [f.id]: e.target.value }));
                      setSaving('idle');
                    }}
                    autoComplete="off"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ))}
        <div className="pf-save">
          <button type="submit" className="ff-btn ff-btn-primary" data-genesis-submit disabled={!dirty || saving === 'busy'}>
            {saving === 'busy' ? <Loader2 className="ff-spin" /> : <Save />} {saving === 'busy' ? 'Saving...' : 'Save changes'}
          </button>
          {saving === 'saved' && !dirty && (
            <span className="pf-saved" role="status">
              <Check /> Saved
            </span>
          )}
          {saving === 'error' && (
            <span className="ff-error" role="alert">
              Could not save. Please try again.
            </span>
          )}
        </div>
      </form>

      <section className="ff-item">
        <div className="pf-row">
          <Users className="pf-row-icon" />
          <div style={{ minWidth: 0 }}>
            <h3 className="ff-item-title">Your team</h3>
            <p className="ff-item-meta" style={{ whiteSpace: 'pre-wrap' }}>
              {team !== '' ? team : 'No teammates added yet.'}
            </p>
            <p className="ff-item-meta">
              Want someone else in this portal? Email{' '}
              <a className="ff-link" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>{' '}
              and we will invite them.
            </p>
          </div>
        </div>
      </section>

      <button type="button" className="ff-item pf-link" onClick={onBilling}>
        <CreditCard className="pf-row-icon" />
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="ff-item-title" style={{ display: 'block' }}>
            Billing
          </span>
          <span className="ff-item-meta" style={{ display: 'block' }}>
            Card, invoices and receipts
          </span>
        </span>
        <ChevronRight className="pf-row-icon" />
      </button>
    </div>
  );
}
