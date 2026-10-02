import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from 'react-oidc-context';

import { CHURCH_NAME } from '@/client';
import { AGENCY_NAME, SUPPORT_EMAIL } from '@/config';
import { directSignin, openHostedLogin } from '@/lib/direct-signin';
import { Loader2, LogIn } from '@/lib/icons';
import { LOGO_SRC } from '@/lib/logo';

/** Set when the person tries to sign in, so the background silent sign-in never shows an error. */
const TRIED_KEY = 'ff-signin-tried';

function markTried(): void {
  try {
    sessionStorage.setItem(TRIED_KEY, '1');
  } catch {
    // Private mode: a callback error just will not show.
  }
}

function readTried(): boolean {
  try {
    return sessionStorage.getItem(TRIED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function SignInPage() {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackFailed = auth.error != null && readTried();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    markTried();
    setBusy(true);
    setError(null);
    try {
      const result = await directSignin(email.trim(), password);
      if (!result.ok) {
        setError(result.message);
        setBusy(false);
      }
      // On success the page navigates away; keep the spinner.
    } catch (err) {
      // We could not read Taskade's sign-in page (it may have changed): use it directly.
      console.error('Direct sign-in failed, falling back to hosted page', err);
      void auth.signinRedirect();
    }
  }

  async function handleForgot() {
    try {
      const form = await openHostedLogin();
      if (form.forgotUrl != null) {
        window.location.assign(form.forgotUrl);
        return;
      }
    } catch (err) {
      console.error('Could not open password reset', err);
    }
    void auth.signinRedirect();
  }

  return (
    <div className="ff-shell" style={{ gridTemplateRows: 'auto 1fr' }}>
      <header className="ff-top">
        <div className="ff-topbar">
          <img className="ff-logo" src={LOGO_SRC} alt={AGENCY_NAME} />
          <span className="ff-count">Client portal</span>
        </div>
      </header>

      <div className="ff-body">
        <section className="ff-col ff-enter" style={{ maxWidth: 520 }}>
          <span className="ff-eyebrow">{CHURCH_NAME}</span>
          <h1 className="ff-display">
            Your project, in one <span className="ff-box">place</span>.
          </h1>
          <p className="ff-lead">Sign in to see your tasks, approvals and files.</p>

          <form className="ff-card ff-fields" style={{ marginTop: 32 }} onSubmit={(e) => void handleSubmit(e)}>
            <div>
              <label className="ff-label" htmlFor="signin-email">
                Email
              </label>
              <input
                id="signin-email"
                className="ff-input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={busy}
              />
            </div>
            <div>
              <label className="ff-label" htmlFor="signin-password">
                Password
              </label>
              <input
                id="signin-password"
                className="ff-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
              />
            </div>
            {(error != null || callbackFailed) && (
              <p className="ff-error" role="alert" style={{ margin: 0 }}>
                {error ?? 'Sign-in did not work. Please try again.'}
              </p>
            )}
            <button type="submit" className="ff-btn ff-btn-primary" style={{ width: '100%' }} disabled={busy}>
              {busy ? <Loader2 className="ff-spin" /> : <LogIn />} {busy ? 'Signing in...' : 'Sign in'}
            </button>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 }}>
              <button
                type="button"
                className="ff-link"
                style={{ background: 'none', border: 0, padding: 0, font: 'inherit', fontSize: 15, cursor: 'pointer' }}
                onClick={() => void handleForgot()}
                disabled={busy}
              >
                Forgot password?
              </button>
              <span className="ff-small">
                No access?{' '}
                <a className="ff-link" href={`mailto:${SUPPORT_EMAIL}`}>
                  Email us
                </a>
              </span>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
