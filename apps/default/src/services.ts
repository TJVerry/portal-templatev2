/**
 * The four Faith Funnels services. `name` must match the Service select options
 * in the Tasks and Approvals projects exactly.
 */
export type ServiceName = 'Web Design' | 'Local SEO' | 'Google Ads / Ad Grants' | 'Social Media';

export const ALL_SERVICES: { name: ServiceName; blurb: string }[] = [
  { name: 'Web Design', blurb: 'Your new church website' },
  { name: 'Local SEO', blurb: 'Show up when people search nearby' },
  { name: 'Google Ads / Ad Grants', blurb: 'Free Google ads for your church' },
  { name: 'Social Media', blurb: 'Posts that reach your community' },
];
