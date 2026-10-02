import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { SERVICES, TASKS_PROJECT_ID } from '@/client';
import { RESULTS_API_URL } from '@/config';
import { Loader2 } from '@/lib/icons';
import type { ServiceName } from '@/services';

/**
 * Results: live numbers from GHL, GA4, Search Console and Google Ads, through the
 * `ff-portal-results` Worker (results-api/). The Worker finds this church by its Tasks list id.
 * Each service the church bought gets one card. A source that is not linked yet says so.
 */

type Pair = { now: number; before: number };

interface Results {
  ok: true;
  days: number;
  updatedAt: string;
  guests: { signups: Pair; newContacts: Pair } | null;
  website: { visitors: Pair; sessions: Pair; keyEvents: Pair; fromSearch: Pair; fromAds: Pair; fromSocial: Pair } | null;
  search: { clicks: Pair; impressions: Pair; position: Pair } | null;
  ads: { clicks: Pair; impressions: Pair; conversions: Pair; spend: Pair } | null;
  note: { text: string; updatedAt: string } | null;
}

type Load = { state: 'loading' } | { state: 'off' } | { state: 'error' } | { state: 'ready'; data: Results };

/** Ad Grants give up to $10,000 a month. */
const GRANT_PER_MONTH = 10_000;

const fmt = (n: number) => n.toLocaleString('en-US');

function when(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** "+12% vs the 30 days before". Lower is better for Google position. */
function Change({ pair, days, lowerIsBetter = false }: { pair: Pair; days: number; lowerIsBetter?: boolean }) {
  const { now, before } = pair;
  if (before === 0 && now === 0) return <span className="rs-change">No change</span>;
  if (before === 0) return <span className="rs-change is-good">New this period</span>;
  // Google position: a smaller number is a higher spot, so say it in spots, not percent.
  if (lowerIsBetter) {
    const moved = Math.round((before - now) * 10) / 10;
    if (moved === 0) return <span className="rs-change">Same spot as the {days} days before</span>;
    return (
      <span className={`rs-change ${moved > 0 ? 'is-good' : ''}`}>
        {moved > 0 ? '▲' : '▼'} {Math.abs(moved)} {Math.abs(moved) === 1 ? 'spot' : 'spots'} {moved > 0 ? 'higher' : 'lower'}
      </span>
    );
  }
  const pct = Math.round(((now - before) / before) * 100);
  if (pct === 0) return <span className="rs-change">Same as the {days} days before</span>;
  const up = pct > 0;
  return (
    <span className={`rs-change ${up ? 'is-good' : ''}`}>
      {up ? '▲' : '▼'} {Math.abs(pct)}% vs the {days} days before
    </span>
  );
}

function Stat({ label, value, pair, days, lowerIsBetter }: { label: string; value: ReactNode; pair: Pair; days: number; lowerIsBetter?: boolean }) {
  return (
    <div className="rs-stat">
      <span className="rs-stat-label">{label}</span>
      <span className="rs-stat-value">{value}</span>
      <Change pair={pair} days={days} lowerIsBetter={lowerIsBetter} />
    </div>
  );
}

function ServiceCard({ title, help, children }: { title: string; help: string; children: ReactNode }) {
  return (
    <article className="ff-item rs-card">
      <h2 className="ff-item-title">{title}</h2>
      <p className="ff-item-meta">{help}</p>
      <div className="rs-stats">{children}</div>
    </article>
  );
}

/** Menu icon (a rising line), drawn like the other menu icons. */
export function ResultsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

const NOT_LINKED = <p className="ff-small rs-wait">We are still connecting this. Numbers show here soon.</p>;

function cardFor(service: ServiceName, r: Results): ReactNode {
  const d = r.days;
  const w = r.website;
  switch (service) {
    case 'Web Design':
      return (
        <ServiceCard key={service} title="Your website" help="People who visited your site, and how many signed up there.">
          {w == null ? NOT_LINKED : (
            <>
              <Stat label="Visitors" value={fmt(w.visitors.now)} pair={w.visitors} days={d} />
              <Stat label="Sign-ups on the site" value={fmt(w.keyEvents.now)} pair={w.keyEvents} days={d} />
            </>
          )}
        </ServiceCard>
      );
    case 'Local SEO':
      return (
        <ServiceCard key={service} title="Google search" help="How often people find you when they search on Google.">
          {r.search != null ? (
            <>
              <Stat label="Clicks from Google" value={fmt(r.search.clicks.now)} pair={r.search.clicks} days={d} />
              <Stat label="Times you showed up" value={fmt(r.search.impressions.now)} pair={r.search.impressions} days={d} />
              <Stat label="Average spot on Google" value={r.search.position.now > 0 ? `#${r.search.position.now}` : '–'} pair={r.search.position} days={d} lowerIsBetter />
            </>
          ) : w != null ? (
            <Stat label="Visits from Google search" value={fmt(w.fromSearch.now)} pair={w.fromSearch} days={d} />
          ) : (
            NOT_LINKED
          )}
        </ServiceCard>
      );
    case 'Google Ads / Ad Grants': {
      const budget = GRANT_PER_MONTH * Math.round(d / 30);
      return (
        <ServiceCard key={service} title="Google Ads" help={`Ad Grants give up to $${fmt(GRANT_PER_MONTH)} in free ads each month.`}>
          {r.ads != null ? (
            <>
              <Stat label="Ad clicks" value={fmt(r.ads.clicks.now)} pair={r.ads.clicks} days={d} />
              <Stat label="Sign-ups from ads" value={fmt(r.ads.conversions.now)} pair={r.ads.conversions} days={d} />
              <Stat label="Ad money used" value={<>${fmt(r.ads.spend.now)} <small>of ${fmt(budget)}</small></>} pair={r.ads.spend} days={d} />
            </>
          ) : w != null ? (
            <Stat label="Visits from ads" value={fmt(w.fromAds.now)} pair={w.fromAds} days={d} />
          ) : (
            NOT_LINKED
          )}
        </ServiceCard>
      );
    }
    case 'Social Media':
      return (
        <ServiceCard key={service} title="Social media" help="Visits to your website that came from Facebook, Instagram and other social sites.">
          {w == null ? NOT_LINKED : <Stat label="Visits from social" value={fmt(w.fromSocial.now)} pair={w.fromSocial} days={d} />}
        </ServiceCard>
      );
    default:
      return null;
  }
}

export function ResultsTab() {
  const [days, setDays] = useState<30 | 90>(30);
  const [load, setLoad] = useState<Load>({ state: 'loading' });

  useEffect(() => {
    if (RESULTS_API_URL === '') {
      setLoad({ state: 'off' });
      return;
    }
    let live = true;
    setLoad({ state: 'loading' });
    fetch(`${RESULTS_API_URL}/results?portal=${encodeURIComponent(TASKS_PROJECT_ID)}&days=${days}`)
      .then(async (res) => {
        if (!live) return;
        if (res.status === 404) return setLoad({ state: 'off' });
        if (!res.ok) return setLoad({ state: 'error' });
        setLoad({ state: 'ready', data: (await res.json()) as Results });
      })
      .catch(() => live && setLoad({ state: 'error' }));
    return () => {
      live = false;
    };
  }, [days]);

  if (load.state === 'off') {
    return (
      <div className="ff-item ff-empty">
        <h2 className="ff-item-title">Your results show here soon</h2>
        <p className="ff-item-meta">We are connecting your website, Google and your contact forms. Then you will see new guests and visits here every day.</p>
      </div>
    );
  }

  const r = load.state === 'ready' ? load.data : null;
  const signups = r?.guests?.signups;

  return (
    <div className="rs">
      <div className="rs-bar">
        <div className="rs-range" role="group" aria-label="Time period">
          {([30, 90] as const).map((n) => (
            <button key={n} type="button" className="rs-range-btn" aria-pressed={days === n} onClick={() => setDays(n)}>
              Last {n} days
            </button>
          ))}
        </div>
        {r != null && <span className="ff-small">Updated {when(r.updatedAt)}</span>}
      </div>

      {load.state === 'loading' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Loader2 className="ff-spin" style={{ width: 28, height: 28, color: 'var(--ff-orange)' }} />
        </div>
      )}
      {load.state === 'error' && (
        <p className="ff-error" role="alert" style={{ padding: '24px 0' }}>
          We could not load your results. Please try again in a few minutes.
        </p>
      )}

      {r != null && (
        <>
          <section className="ff-card ff-dark rs-hero">
            <span className="rs-hero-label">
              New <span className="ff-box">guests</span>
            </span>
            {signups != null ? (
              <>
                <span className="rs-hero-value">{fmt(signups.now)}</span>
                <Change pair={signups} days={r.days} />
                <p className="rs-hero-help">People who filled in your Plan a Visit or contact form in the last {r.days} days.</p>
                {r.guests != null && (
                  <p className="rs-hero-sub">
                    <strong>{fmt(r.guests.newContacts.now)}</strong> new people in your contact list.
                  </p>
                )}
              </>
            ) : (
              <p className="rs-hero-help">We are still connecting your forms. Your guest count shows here soon.</p>
            )}
          </section>

          {r.note != null && (
            <article className="ff-item rs-note">
              <span className="ff-eyebrow">From Faith Funnels</span>
              <p className="rs-note-text">{r.note.text}</p>
              <p className="ff-small">{when(r.note.updatedAt)}</p>
            </article>
          )}

          <div className="rs-grid">{SERVICES.map((s) => cardFor(s, r))}</div>

          <p className="ff-small rs-foot">Numbers update every few hours. Google search numbers run 2 to 3 days behind.</p>
        </>
      )}
    </div>
  );
}
