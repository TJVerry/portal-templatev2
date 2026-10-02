/**
 * THE ONLY PER-CHURCH FILE.
 *
 * Every church gets its own copy of the portal app (cloned from "Portal Template").
 * Shared code updates are pushed to every copy, but this file is NEVER overwritten.
 * After cloning, fill it in: church name and the services they bought.
 * Taskade rewrites the project ids below automatically when the app is duplicated.
 */
import type { ServiceName } from '@/services';

export const CHURCH_NAME = 'Template Church';

/** Services this church bought. The portal only shows these. */
export const SERVICES: ServiceName[] = ['Web Design', 'Local SEO', 'Google Ads / Ad Grants', 'Social Media'];

/** Project ids in THIS app's space. */
export const TASKS_PROJECT_ID = '44NVGQPAbJGdMGRw';
export const APPROVALS_PROJECT_ID = 'kKXwuAV8RjdutUU5';
export const FILES_PROJECT_ID = 'T251DsSoxg4iohFK';
export const ONBOARDING_PROJECT_ID = 'wijqui1a8Pz6tmQv';
export const SERVICES_PROJECT_ID = '6ndgMKEtJHGAvw63';
export const MESSAGES_PROJECT_ID = '6mYFaFFxPWFosR2V';
/** Portal — Users: one row per person (name, photo). Tasks and Messages point to it by email. */
export const USERS_PROJECT_ID = 'BDwbBb9Vhd2MhGh7';

/** "Portal File Upload" automation in THIS app's space (see lib/store-file.ts). Check it after duplicating. */
export const UPLOAD_FLOW_ID = '01M3TBT63CPBSR1H3NERD5H85A';

/** Optional quick links per service (live site, ads report, content calendar). */
export const SERVICE_LINKS: Partial<Record<ServiceName, { label: string; url: string }[]>> = {};

/** Link to the GoHighLevel billing / invoices page. Empty hides the button. */
export const BILLING_URL = '';
