/**
 * Shared settings, the same for every church. Per-church settings live in `client.ts`.
 */
export const AGENCY_NAME = 'Faith Funnels';
export const SUPPORT_EMAIL = 'jverry@faithfunnels.ai';
/** Our tasks (not the church's) are assigned to this person until someone picks others in the task. */
export const DEFAULT_AGENCY_ASSIGNEE = 'jverry@faithfunnels.ai';

/**
 * GoHighLevel booking link for kickoff calls (the calendar's widget link).
 * Set "Minimum scheduling notice" to 5 days in GHL. Empty shows "we will email you a link".
 */
export const KICKOFF_CALENDAR_URL = 'https://link.faithfunnels.ai/widget/bookings/kickoff-call-5';

/**
 * Stripe customer portal login link, shared by every church (Billing page, "Manage billing").
 * Stripe Dashboard > Settings > Billing > Customer portal > Activate, then copy the login link
 * (https://billing.stripe.com/p/login/...). The church signs in with a one-time code Stripe emails them.
 * Empty shows "email us" instead. A church's own BILLING_URL in client.ts overrides this.
 */
export const STRIPE_PORTAL_URL: string = 'https://billing.stripe.com/p/login/4gMfZhc9z97R75V0p943S00';

/**
 * Chat relay (Cloudflare Worker `ff-portal-chat`): sends portal chat to the GHL inbox,
 * brings GHL replies back, and stores chat files up to 500 MB (R2).
 * Empty = chat still works inside the portal, files use Taskade Media (10 MB), nothing reaches GHL.
 */
export const CHAT_RELAY_URL: string = '';

/**
 * Results relay (Cloudflare Worker `ff-portal-results`, code in results-api/): live numbers for the Results tab
 * from GHL, GA4, Search Console and Google Ads. Empty = the Results tab says "Your results show here soon".
 */
export const RESULTS_API_URL: string = '';
