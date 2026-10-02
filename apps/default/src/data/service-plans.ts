/**
 * The default plan for each service: its milestones (the stages the church sees) and
 * the starter tasks under each one.
 *
 * - The Portal Template's "Portal — Tasks" list holds one row per task below, so every
 *   duplicated portal starts with the full plan. Rows only show for services the church bought.
 * - A row finds its milestone by its task name (case does not matter). Renamed or extra
 *   tasks go in "Other tasks", unless the row has a "Milestone" field that names a milestone.
 * - The current stage is the first milestone with unfinished tasks. When every task is
 *   done the service shows "Live". The Stage field in "Portal — Services" overrides this
 *   only when it names one of the service's milestones (or "Live").
 * - Keep task names short. `who: 'you'` marks the church's part; `detail` shows on the card
 *   when the row has no Notes of its own.
 */
import type { ServiceName } from '@/services';

export interface PlanTask {
  task: string;
  /** Who does it. Church tasks get a "Your part" tag. */
  who: 'us' | 'you';
  /** One plain sentence. Shown when the row has no Notes. */
  detail?: string;
}

export interface Milestone {
  name: string;
  /** What this milestone means, in the church's words. */
  goal: string;
  tasks: PlanTask[];
}

export interface ServicePlan {
  /** Rough time from kickoff to the last milestone. */
  timeline: string;
  milestones: Milestone[];
}

export const LIVE = 'Live';

export const SERVICE_PLANS: Record<ServiceName, ServicePlan> = {
  'Web Design': {
    timeline: 'Live in about 2 weeks',
    milestones: [
      {
        name: 'Kickoff',
        goal: 'We meet, connect your accounts, and agree on the plan.',
        tasks: [
          { task: 'Kickoff call', who: 'us' },
          { task: 'Connect your domain and current site', who: 'you', detail: 'We do this together on the call. Have your logins open.' },
          { task: 'Upload your logo and best photos', who: 'you', detail: 'Add them in the Files tab. Real photos of your people work best.' },
        ],
      },
      {
        name: 'Plan & content',
        goal: 'The pages your site needs and the words on them.',
        tasks: [
          { task: 'Site map and page list', who: 'us' },
          { task: 'Write page copy', who: 'us' },
          { task: 'Check staff, ministries and service times', who: 'you', detail: 'Make sure names, photos and times are right.' },
        ],
      },
      {
        name: 'Design',
        goal: 'The look of your new site, starting with the homepage.',
        tasks: [
          { task: 'Homepage design', who: 'us' },
          { task: 'Approve homepage design', who: 'you', detail: 'Open Tasks > Needs Approval. Approve it or ask for changes.' },
        ],
      },
      {
        name: 'Build',
        goal: 'Every page built, fast on phones, with forms that work.',
        tasks: [
          { task: 'Build all pages', who: 'us' },
          { task: 'Plan a Visit and contact forms', who: 'us' },
          { task: 'Connect giving and events', who: 'us' },
          { task: 'Phone and speed check', who: 'us' },
        ],
      },
      {
        name: 'Review',
        goal: 'You click through the whole site and tell us what to change.',
        tasks: [
          { task: 'Review the full site', who: 'you', detail: 'Click every page on your phone. Send all changes in one list.' },
          { task: 'Make your changes', who: 'us' },
        ],
      },
      {
        name: 'Launch',
        goal: 'Your new site goes live and Google knows about it.',
        tasks: [
          { task: 'Point your domain to the new site', who: 'us' },
          { task: 'Set up Google Analytics and Search Console', who: 'us' },
          { task: 'Share the new site with your church', who: 'you', detail: 'Announce it on Sunday and in your newsletter.' },
        ],
      },
    ],
  },

  'Local SEO': {
    timeline: 'First results around month 3',
    milestones: [
      {
        name: 'Kickoff',
        goal: 'We meet and get access to your Google listing.',
        tasks: [
          { task: 'Kickoff call', who: 'us' },
          { task: 'Add us as a manager on your Google Business Profile', who: 'you', detail: 'We do this together on the call. Have the Google login open.' },
        ],
      },
      {
        name: 'Audit',
        goal: 'Where you rank today and what holds you back.',
        tasks: [
          { task: 'Local search audit', who: 'us' },
          { task: 'Check nearby churches you compete with', who: 'us' },
          { task: 'Starting rank report', who: 'us' },
        ],
      },
      {
        name: 'Google profile',
        goal: 'A complete, trusted Google Maps listing.',
        tasks: [
          { task: 'Fix name, address, hours and categories', who: 'us' },
          { task: 'Add photos, ministries and service times', who: 'us' },
          { task: 'Verify your Google profile', who: 'you', detail: 'Only if Google asks. It is a postcard code or a short video.' },
        ],
      },
      {
        name: 'Listings',
        goal: 'The same name, address and phone everywhere online.',
        tasks: [
          { task: 'Fix Apple Maps, Bing, Facebook and Yelp', who: 'us' },
          { task: 'Add you to church directories', who: 'us' },
        ],
      },
      {
        name: 'Reviews',
        goal: 'More 5-star reviews, the biggest ranking boost.',
        tasks: [
          { task: 'Make your review link and QR code', who: 'us' },
          { task: 'Ask 10 members for a Google review', who: 'you', detail: 'Use the link we send. A Sunday slide with the QR code works well.' },
        ],
      },
      {
        name: 'Website SEO',
        goal: 'Your website tells Google where you are and who you serve.',
        tasks: [
          { task: 'Local page titles and descriptions', who: 'us' },
          { task: 'Add church details for Google (schema)', who: 'us' },
        ],
      },
      {
        name: 'Monthly growth',
        goal: 'Steady posts and a clear report every month.',
        tasks: [
          { task: 'Weekly Google profile posts', who: 'us' },
          { task: 'First monthly rank report', who: 'us' },
        ],
      },
    ],
  },

  'Google Ads / Ad Grants': {
    timeline: 'Live in 2 to 3 weeks after Google approves',
    milestones: [
      {
        name: 'Kickoff',
        goal: 'We meet and check your nonprofit details.',
        tasks: [
          { task: 'Kickoff call', who: 'us' },
          { task: 'Check your EIN and IRS letter', who: 'us' },
        ],
      },
      {
        name: 'Grant application',
        goal: 'Google approves your church for up to $10k a month in free ads.',
        tasks: [
          { task: 'Set up Google for Nonprofits', who: 'you', detail: 'We walk you through it on the call. It takes about 10 minutes.' },
          { task: 'Nonprofit check (Goodstack)', who: 'us', detail: 'Google checks you are a real nonprofit. This can take a few days.' },
          { task: 'Apply for Google Ad Grants', who: 'us' },
          { task: 'Google approves the grant', who: 'us', detail: 'Google usually answers in 1 to 3 business days.' },
        ],
      },
      {
        name: 'Account setup',
        goal: 'Your ads account is set up to follow Google grant rules.',
        tasks: [
          { task: 'Set up your Ad Grants account', who: 'us' },
          { task: 'Track visits, calls and form sign-ups', who: 'us' },
        ],
      },
      {
        name: 'Campaigns',
        goal: 'Ads for what people near you search for.',
        tasks: [
          { task: 'Keyword research', who: 'us' },
          { task: 'Write your ads', who: 'us' },
          { task: 'Approve ads and keywords', who: 'you', detail: 'Open Tasks > Needs Approval.' },
        ],
      },
      {
        name: 'Live & growing',
        goal: 'Ads run, we tune them, and you get a report every month.',
        tasks: [
          { task: 'Launch campaigns', who: 'us' },
          { task: 'Two-week tune-up', who: 'us' },
          { task: 'First monthly ads report', who: 'us' },
        ],
      },
    ],
  },

  'Social Media': {
    timeline: 'First posts in about 2 weeks',
    milestones: [
      {
        name: 'Kickoff',
        goal: 'We meet and connect your pages.',
        tasks: [
          { task: 'Kickoff call', who: 'us' },
          { task: 'Give us access to Facebook and Instagram', who: 'you', detail: 'We do this together on the call in Meta Business.' },
        ],
      },
      {
        name: 'Strategy',
        goal: 'What we post, where, and how often.',
        tasks: [
          { task: 'Review your current pages', who: 'us' },
          { task: 'Content plan and posting schedule', who: 'us' },
          { task: 'Clean up bios, links and profile photos', who: 'us' },
        ],
      },
      {
        name: 'Content setup',
        goal: 'Your look, your sermons, your photos, ready to use.',
        tasks: [
          { task: 'Share your sermon videos and photo folder', who: 'you', detail: 'A YouTube channel or shared folder link is perfect. Add it in Files.' },
          { task: 'Branded post templates', who: 'us' },
        ],
      },
      {
        name: 'First month',
        goal: 'A full month of posts, approved by you.',
        tasks: [
          { task: "Create the first month's posts", who: 'us' },
          { task: "Approve the first month's posts", who: 'you', detail: 'Open Tasks > Needs Approval.' },
        ],
      },
      {
        name: 'Publishing',
        goal: 'Posts go out on schedule, every week.',
        tasks: [
          { task: 'Schedule posts', who: 'us' },
          { task: 'First monthly social report', who: 'us' },
        ],
      },
    ],
  },
};

const key = (text: string) => text.trim().toLowerCase();

/** The plan for a service, or null for a service name the code does not know. */
export function planFor(service: string | null | undefined): ServicePlan | null {
  if (service == null) return null;
  return (SERVICE_PLANS as Record<string, ServicePlan>)[service] ?? null;
}

/** The milestone names of a service, in order. */
export function milestonesOf(service: string): string[] {
  return planFor(service)?.milestones.map((m) => m.name) ?? [];
}

/** Where a task sits in its service plan, found by task name. Null when it is not in the plan. */
export function findPlanTask(
  service: string | null | undefined,
  task: string | null | undefined,
): { milestone: Milestone; task: PlanTask; index: number } | null {
  const plan = planFor(service);
  if (plan == null || task == null) return null;
  let index = 0;
  for (const milestone of plan.milestones) {
    for (const t of milestone.tasks) {
      if (key(t.task) === key(task)) return { milestone, task: t, index };
      index += 1;
    }
  }
  return null;
}

/** Same as `milestonesOf`, but matches a free-typed name to the plan's spelling. */
export function matchMilestone(service: string, name: string | null | undefined): string | null {
  if (name == null || name.trim() === '') return null;
  return milestonesOf(service).find((m) => key(m) === key(name)) ?? null;
}
