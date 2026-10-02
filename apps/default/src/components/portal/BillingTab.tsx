import { useState } from 'react';

import { BILLING_URL, CHURCH_NAME, SERVICES } from '@/client';
import { STRIPE_PORTAL_URL, SUPPORT_EMAIL } from '@/config';
import { money, SERVICE_PRICES, withStripeParams } from '@/data/billing';
import type { BillingTerm } from '@/data/billing';
import { Check, CreditCard, ExternalLink, Mail, Plus } from '@/lib/icons';
import { ALL_SERVICES } from '@/services';

/** Where "Manage billing" goes: this church's own link, else the shared Stripe portal. Empty = none. */
export function billingLink(email: string): string {
  if (BILLING_URL !== '') return BILLING_URL;
  if (STRIPE_PORTAL_URL !== '') return withStripeParams(STRIPE_PORTAL_URL, email, null);
  return '';
}

function mailto(subject: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${subject} - ${CHURCH_NAME}`)}`;
}

/**
 * Billing: manage the plan in Stripe (card, invoices, receipts), see active services,
 * and add a service with Stripe Checkout. No card data ever touches the portal.
 */
export function BillingTab({ email }: { email: string }) {
  const [term, setTerm] = useState<BillingTerm>('monthly');
  const manageUrl = billingLink(email);
  const mine = ALL_SERVICES.filter((s) => SERVICES.includes(s.name));
  const addOns = ALL_SERVICES.filter((s) => !SERVICES.includes(s.name));

  return (
    <div className="ff-stack">
      <div className="home-next ff-dark">
        <span className="ff-eyebrow">Billing</span>
        <h2 className="ff-h2" style={{ color: '#fff', marginTop: 10 }}>
          Manage your plan
        </h2>
        <p style={{ color: 'var(--ff-on-dark-muted)', margin: '6px 0 16px' }}>
          Update your card, see and pay invoices, and download receipts. Payments are handled by Stripe.
        </p>
        {manageUrl !== '' ? (
          <a className="ff-btn ff-btn-primary" href={manageUrl} target="_blank" rel="noreferrer">
            <CreditCard /> Open billing <ExternalLink />
          </a>
        ) : (
          <a className="ff-btn ff-btn-primary" href={mailto('Billing question')}>
            <Mail /> Email us about billing
          </a>
        )}
        {manageUrl !== '' && (
          <p className="ff-small" style={{ color: 'var(--ff-on-dark-muted)', margin: '12px 0 0' }}>
            Use the email you pay with. Stripe sends you a one-time code.
          </p>
        )}
      </div>

      <h2 className="ff-h2" style={{ marginTop: 16 }}>
        Your services
      </h2>
      {mine.map((s) => (
        <div key={s.name} className="ff-item">
          <div className="ff-item-head">
            <h3 className="ff-item-title">{s.name}</h3>
            <span className="ff-tag ff-tag-ok">
              <Check style={{ width: 12, height: 12, verticalAlign: '-1px' }} /> Active
            </span>
          </div>
          <p className="ff-item-meta">{s.blurb}</p>
        </div>
      ))}

      {addOns.length > 0 && (
        <>
          <div className="sv-bar" style={{ marginTop: 16 }}>
            <h2 className="ff-h2">Add a service</h2>
            <div className="sv-toggle" role="group" aria-label="Billing term">
              {(['monthly', 'annual'] as BillingTerm[]).map((t) => (
                <button key={t} type="button" aria-pressed={term === t} onClick={() => setTerm(t)}>
                  {t === 'monthly' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          </div>
          {addOns.map((s) => {
            const price = SERVICE_PRICES[s.name];
            const checkout = price.checkoutUrl[term];
            // Yearly vs. 12 months plus the setup fee.
            const saved = price.monthly * 12 + price.setupFee - price.annual;
            return (
              <div key={s.name} className="ff-item ff-lift">
                <div className="ff-item-head">
                  <h3 className="ff-item-title">{s.name}</h3>
                  <span className="ff-tag">
                    {term === 'monthly' ? `${money(price.monthly)}/mo` : `${money(price.annual)}/yr`}
                  </span>
                </div>
                <p className="ff-item-meta">
                  {s.blurb}.{' '}
                  {term === 'monthly'
                    ? price.setupFee > 0
                      ? `Plus a one-time ${money(price.setupFee)} setup.`
                      : 'No setup fee.'
                    : `Paid once a year. No setup fee${saved > 0 ? `, and you save ${money(saved)}` : ''}.`}
                </p>
                <div className="ff-row-actions" style={{ marginTop: 12 }}>
                  {checkout !== '' ? (
                    <a
                      className="ff-btn ff-btn-primary ff-btn-sm"
                      href={withStripeParams(checkout, email, CHURCH_NAME)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Plus /> Add {s.name}
                    </a>
                  ) : (
                    <a className="ff-btn ff-btn-secondary ff-btn-sm" href={mailto(`Add ${s.name}`)}>
                      <Mail /> Ask about {s.name}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      <p className="ff-small" style={{ margin: '8px 0 0' }}>
        Questions about a charge? Email <a className="ff-link" href={mailto('Billing question')}>{SUPPORT_EMAIL}</a>.
      </p>
    </div>
  );
}
