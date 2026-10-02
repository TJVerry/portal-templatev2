import { OidcClient } from 'oidc-client-ts';

/**
 * Sign in from our own DesignOS form instead of Taskade's plain hosted login page.
 * (Jake approved this approach on 2026-09-30.)
 *
 * The hosted page lives on this same origin (`/_genesis/auth/...`), so we can:
 *  1. start a normal OIDC sign-in request (same settings and state store as `GenesisAuth`,
 *     so the app's usual callback finishes it),
 *  2. fetch the hosted login page and read its form action + CSRF token,
 *  3. POST the email and password there ourselves. The password only goes to Taskade's
 *     own login endpoint on this origin; it is never stored or sent anywhere else.
 * On success the redirect chain ends at `/?code=...&state=...`; we navigate there and the
 * normal callback exchanges the code. If Taskade ever changes the page and we cannot read
 * it, callers fall back to the hosted page (`auth.signinRedirect()`).
 */

export interface HostedLoginForm {
  action: string;
  csrf: string;
  forgotUrl: string | null;
  error: string | null;
}

let client: OidcClient | null = null;

/** Must match the settings in `lib/genesis-auth.tsx`, or the callback will not find our state. */
function getClient(): OidcClient {
  if (client == null) {
    const origin = window.location.origin;
    client = new OidcClient({
      authority: `${origin}/_genesis/auth`,
      client_id: 'default',
      redirect_uri: `${origin}/`,
      scope: 'openid profile email',
    });
  }
  return client;
}

/** Only same-origin URLs: the credentials must never leave this site. */
function sameOriginUrl(href: string | null | undefined, base: string): string | null {
  if (href == null || href === '') return null;
  try {
    const url = new URL(href, base);
    return url.origin === window.location.origin ? url.href : null;
  } catch {
    return null;
  }
}

function parseLoginPage(html: string, baseUrl: string): HostedLoginForm | null {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const form = doc.querySelector('form[action*="/login"]');
  const csrf = doc.querySelector<HTMLInputElement>('input[name="csrf_token"]')?.value;
  const action = sameOriginUrl(form?.getAttribute('action'), baseUrl);
  if (action == null || csrf == null || csrf === '') return null;
  const errorText = doc.querySelector('.error, .alert, [role="alert"], .message')?.textContent?.trim();
  return {
    action,
    csrf,
    forgotUrl: sameOriginUrl(doc.querySelector('a[href*="/forgot"]')?.getAttribute('href'), baseUrl),
    error: errorText != null && errorText !== '' ? errorText : null,
  };
}

/** Starts a sign-in request and returns the hosted login form it lands on. */
export async function openHostedLogin(): Promise<HostedLoginForm> {
  const request = await getClient().createSigninRequest({ state: { returnTo: '/' } });
  const response = await fetch(request.url, { credentials: 'same-origin' });
  const form = parseLoginPage(await response.text(), response.url);
  if (form == null) {
    throw new Error('Could not read the sign-in page');
  }
  return form;
}

export type DirectSigninResult = { ok: true } | { ok: false; message: string };

/** Posts the credentials. On success navigates to the callback URL (the page reloads signed in). */
export async function directSignin(email: string, password: string): Promise<DirectSigninResult> {
  const form = await openHostedLogin();
  const response = await fetch(form.action, {
    method: 'POST',
    body: new URLSearchParams({ csrf_token: form.csrf, email, password }),
    credentials: 'same-origin',
  });
  const landed = new URL(response.url);
  if (landed.origin === window.location.origin && landed.searchParams.has('code') && landed.searchParams.has('state')) {
    window.location.assign(response.url);
    return { ok: true };
  }
  const next = parseLoginPage(await response.text(), response.url);
  return { ok: false, message: next?.error ?? 'That email or password did not work.' };
}
