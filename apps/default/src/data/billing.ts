/**
 * Billing catalog, the same for every church. Prices come from the Faith Funnels GHL products
 * (location "Faith Funnels"). Money runs through Stripe: GHL bills the church's plan,
 * and add-ons in the portal check out on Stripe Payment Links.
 *
 * `checkoutUrl` = a Stripe Payment Link (https://buy.stripe.com/...). Empty hides that button.
 * Never put a Stripe secret key in the portal: the code is public.
 */
import type { ServiceName } from '@/services';

export type BillingTerm = 'monthly' | 'annual';

export type ServicePrice = {
  /** Price per month on the monthly plan, USD. */
  monthly: number;
  /** One-time setup fee on the monthly plan, USD. 0 = none. */
  setupFee: number;
  /** Price for a year paid up front, USD. Setup fee waived. */
  annual: number;
  /** Stripe Payment Links. */
  checkoutUrl: Record<BillingTerm, string>;
};

// Live Stripe Payment Links (account "Faith Funnels"). Monthly links include the setup fee line.
export const SERVICE_PRICES: Record<ServiceName, ServicePrice> = {
  'Web Design': {
    monthly: 97,
    setupFee: 2000,
    annual: 1067,
    checkoutUrl: {
      monthly: 'https://buy.stripe.com/4gM6oHc9z0BlcqfdbV43S09',
      annual: 'https://buy.stripe.com/3cI3cv1uVfwfeyndbV43S07',
    },
  },
  'Local SEO': {
    monthly: 297,
    setupFee: 1500,
    annual: 3267,
    checkoutUrl: {
      monthly: 'https://buy.stripe.com/cNidR95LbgAj0Hx9ZJ43S0c',
      annual: 'https://buy.stripe.com/eVqcN55LbbfZai7dbV43S0a',
    },
  },
  'Google Ads / Ad Grants': {
    monthly: 397,
    setupFee: 2000,
    annual: 4367,
    checkoutUrl: {
      monthly: 'https://buy.stripe.com/dRm00j1uV3NxgGv1td43S0f',
      annual: 'https://buy.stripe.com/aFa5kDb5vabVeyn5Jt43S0d',
    },
  },
  'Social Media': {
    monthly: 297,
    setupFee: 0,
    annual: 3267,
    checkoutUrl: {
      monthly: 'https://buy.stripe.com/eVqbJ15Lb0Bl2PFfk343S0j',
      annual: 'https://buy.stripe.com/3cI9AT4H74RBcqf2xh43S0k',
    },
  },
};

/** Whole dollars, e.g. "$1,067". */
export function money(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

/** Stripe only allows letters, numbers, "-" and "_" in client_reference_id (max 200). */
function referenceId(church: string): string {
  return church.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);
}

/**
 * Adds the signed-in email (and the church, for Payment Links) to a Stripe link,
 * so the church does not type it again and the payment is easy to match.
 */
export function withStripeParams(url: string, email: string, church: string | null): string {
  try {
    const u = new URL(url);
    if (email !== '') u.searchParams.set('prefilled_email', email);
    if (church != null && referenceId(church) !== '') u.searchParams.set('client_reference_id', referenceId(church));
    return u.toString();
  } catch {
    return url;
  }
}
