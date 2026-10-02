import { filledRows, formatTime } from '@/lib/validate';
import type { ServiceName } from '@/services';

/**
 * The onboarding interview, TurboTax style: sections split into pages of at most 5 questions.
 * Sections only show for the services the church bought (`service`), and a question
 * can hide itself with `showIf` based on earlier answers.
 * Never ask for passwords here: account access happens on the kickoff call.
 */

export type Answers = Record<string, string | string[]>;

export type QuestionType = 'text' | 'textarea' | 'email' | 'tel' | 'url' | 'address' | 'choice' | 'multi' | 'chips' | 'file' | 'times' | 'people';

export interface Question {
  id: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  /** Short "why we ask" line under the question. */
  why?: string;
  placeholder?: string;
  options?: string[];
  /** Adds an "I'm not sure" option to a choice. */
  notSure?: boolean;
  /** Chips only: options shown under small group labels. */
  groups?: { label: string; options: string[] }[];
  /** Chips only: adds an "Other" chip with a text box. Saved as "Other: ...". */
  other?: boolean;
  showIf?: (answers: Answers) => boolean;
}

export type StepId = 'church' | 'services' | 'files';

export interface Section {
  id: string;
  /** Which of the 3 big steps this section belongs to. */
  step: StepId;
  title: string;
  intro: string;
  /** Only shown when the church bought this service. Omit for everyone. */
  service?: ServiceName;
  questions: Question[];
}

export const STEPS: { id: StepId; label: string }[] = [
  { id: 'church', label: 'Your church' },
  { id: 'services', label: 'Your services' },
  { id: 'files', label: 'Files' },
];

const NOT_SURE = "I'm not sure";
const NEWLINE = String.fromCharCode(10);

/** Readable answer for the review screen. */
export function answerText(value: string | string[] | undefined, type?: QuestionType): string {
  if (value == null) return '';
  if (type === 'times') {
    return filledRows(value)
      .map((r) => `${r.day ?? ''} ${formatTime(r.start)}${r.end ? `–${formatTime(r.end)}` : ''}${r.label ? ` · ${r.label}` : ''}`.trim())
      .join(NEWLINE);
  }
  if (type === 'people') {
    return filledRows(value)
      .map((r) => [r.name, r.role, r.email, r.phone].filter((v) => v != null && v !== '').join(' · '))
      .join(NEWLINE);
  }
  return Array.isArray(value) ? value.join(', ') : value;
}

function is(answers: Answers, id: string, ...values: string[]): boolean {
  const value = answers[id];
  return typeof value === 'string' && values.includes(value);
}

export const SECTIONS: Section[] = [
  {
    id: 'church',
    step: 'church',
    title: 'About your church',
    intro: 'The basics. We use these everywhere, so they must match what people see on your sign.',
    questions: [
      { id: 'knownAs', label: 'What do people call your church?', type: 'text', required: true, placeholder: 'Grace Community Church' },
      {
        id: 'legalName',
        label: 'What is the legal name?',
        type: 'text',
        why: 'Google and the IRS use the legal name. It is often different from the everyday name.',
      },
      {
        id: 'address',
        label: 'What is your street address?',
        type: 'address',
        required: true,
        why: 'Start typing and pick your address from the list. Fix it if anything is off.',
      },
      { id: 'phone', label: 'What phone number should the public call?', type: 'tel', required: true },
      { id: 'publicEmail', label: 'What email should the public use?', type: 'email', required: true },
      {
        id: 'serviceTimes',
        label: 'When are your service times?',
        type: 'times',
        required: true,
        why: 'Add one row per weekly service. Google and your website will show these.',
      },
      { id: 'website', label: 'What is your current website?', type: 'url', placeholder: 'yourchurch.org', why: 'Leave it blank if you do not have one yet.' },
      {
        id: 'team',
        label: 'Who else on your team should we know?',
        type: 'people',
        why: 'We can invite them to this portal too.',
      },
    ],
  },
  {
    id: 'contact',
    step: 'church',
    title: 'Primary Church Contact',
    intro: 'The one person we call and email first. We will keep them in the loop on everything.',
    questions: [
      { id: 'contactName', label: 'Full name', type: 'text', required: true },
      { id: 'contactRole', label: 'Role at the church', type: 'text', required: true, placeholder: 'Lead pastor, office manager...' },
      { id: 'contactEmail', label: 'Email', type: 'email', required: true },
      { id: 'contactPhone', label: 'Cell phone', type: 'tel', required: true },
      {
        id: 'contactPrefers',
        label: 'Best ways to reach them',
        type: 'multi',
        required: true,
        why: 'Pick all that work.',
        options: ['Text', 'Phone call', 'Email'],
      },
    ],
  },
  {
    id: 'reach',
    step: 'church',
    title: 'Who you want to reach',
    intro: 'This shapes every word, ad and post we make for you.',
    questions: [
      {
        id: 'whoReach',
        label: 'In one sentence, who do you most want to reach?',
        type: 'textarea',
        required: true,
        placeholder: 'Young families new to town who do not go to church yet.',
      },
      { id: 'areas', label: 'Which towns or neighborhoods do you serve?', type: 'textarea', required: true },
      { id: 'ministries', label: 'What are your top 3 ministries or programs?', type: 'textarea', required: true },
      { id: 'events', label: 'Any big events in the next 3 months?', type: 'textarea', placeholder: 'Easter, VBS, a new sermon series...' },
      { id: 'admire', label: 'Name 1 to 3 churches you admire online, and why.', type: 'textarea' },
    ],
  },
  {
    id: 'web',
    step: 'services',
    service: 'Web Design',
    title: 'Your website',
    intro: 'A few questions so your new site brings in new guests.',
    questions: [
      {
        id: 'siteGoal',
        label: 'What is the #1 thing a visitor should do on your site?',
        type: 'choice',
        required: true,
        options: ['Plan a visit', 'Give online', 'Watch live', 'Contact us'],
      },
      {
        id: 'features',
        label: 'What should your website be able to do?',
        type: 'multi',
        required: true,
        why: 'Pick everything you want. We build the pages around these.',
        options: [
          'Plan a visit (first-time guests)',
          'Online giving and donations',
          'Event registrations',
          'Livestream and sermon library',
          'Prayer requests',
          'Small group sign-ups',
          'Volunteer sign-ups',
          'Kids and youth info',
          'Email newsletter sign-up',
          'News or blog',
          'Staff and leadership bios',
          'Contact form',
        ],
      },
      { id: 'hasBrand', label: 'Do you have a logo and brand colors?', type: 'choice', required: true, options: ['Yes', 'No'], notSure: true },
      { id: 'likedSites', label: 'List 2 or 3 websites you like, and why.', type: 'textarea' },
      {
        id: 'writer',
        label: 'Who will write the page text?',
        type: 'choice',
        required: true,
        options: ['We will', 'Faith Funnels', 'A mix of both'],
      },
      { id: 'webApprover', label: 'Who approves the design?', type: 'text', required: true, placeholder: 'Name and role' },
      {
        id: 'tools',
        label: 'Which tools do you use for giving, members and live stream?',
        type: 'chips',
        why: 'Tap all you use. Pick Other to add one we missed.',
        groups: [
          { label: 'Giving', options: ['Tithe.ly', 'Pushpay', 'Givelify', 'Subsplash Giving', 'PayPal', 'Stripe'] },
          { label: 'Members', options: ['Planning Center', 'Breeze', 'Church Community Builder', 'Realm', 'Rock RMS', 'Elvanto'] },
          { label: 'Livestream', options: ['YouTube Live', 'Facebook Live', 'Vimeo', 'BoxCast', 'Resi', 'Church Online Platform'] },
        ],
        other: true,
      },
      {
        id: 'domainOwner',
        label: 'Who controls your web address (domain) and hosting?',
        type: 'text',
        required: true,
        placeholder: 'GoDaddy, managed by Pastor Mike',
        why: 'Just the company and the person. Please no passwords. We connect it together on the call.',
        notSure: true,
      },
    ],
  },
  {
    id: 'seo',
    step: 'services',
    service: 'Local SEO',
    title: 'Showing up on Google',
    intro: 'So people nearby find you on Google Maps and search.',
    questions: [
      { id: 'hasGbp', label: 'Do you have a Google Business Profile (your listing on Google Maps)?', type: 'choice', required: true, options: ['Yes', 'No'], notSure: true },
      { id: 'gbpOwner', label: 'Who at your church controls it?', type: 'text', required: true, showIf: (a) => is(a, 'hasGbp', 'Yes') },
      {
        id: 'searches',
        label: 'What should people be able to search to find you?',
        type: 'textarea',
        required: true,
        placeholder: '"church near me", "youth group in Dayton"...',
      },
      {
        id: 'oldInfo',
        label: 'Have you ever used a different name, address or phone number?',
        type: 'textarea',
        why: 'Old details on the web confuse Google. We clean them up.',
      },
      { id: 'reviews', label: 'How do you ask members for Google reviews today?', type: 'textarea', placeholder: 'We do not, yet.' },
    ],
  },
  {
    id: 'ads',
    step: 'services',
    service: 'Google Ads / Ad Grants',
    title: 'Google Ads',
    intro: 'Most churches can get up to $10,000 a month in free Google ads. Let us check.',
    questions: [
      { id: 'program', label: 'Which ads are we running?', type: 'choice', required: true, options: ['The free Ad Grant', 'Paid ads', 'Both'], notSure: true },
      {
        id: 'exempt',
        label: 'Is your church a registered 501(c)(3)?',
        type: 'choice',
        required: true,
        options: ['Yes, we have our own IRS letter', 'Yes, under our denomination'],
        notSure: true,
        why: 'Google needs proof for the free Ad Grant. "Not sure" is fine; we will help.',
      },
      { id: 'ein', label: 'What is your EIN (tax ID number)?', type: 'text', placeholder: '12-3456789', why: 'Google asks for it when we apply. It is not a secret number.' },
      { id: 'g4np', label: 'Do you have a Google for Nonprofits account?', type: 'choice', required: true, options: ['Yes', 'No'], notSure: true },
      { id: 'adsAccount', label: 'Do you already have a Google Ads account?', type: 'choice', required: true, options: ['Yes', 'No'], notSure: true },
      { id: 'budget', label: 'What is your monthly budget for paid ads?', type: 'text', showIf: (a) => is(a, 'program', 'Paid ads', 'Both') },
      {
        id: 'adsGoal',
        label: 'What should the ads bring you most?',
        type: 'textarea',
        required: true,
        placeholder: 'First-time guests, Easter visitors, recovery group members...',
      },
      {
        id: 'win',
        label: 'What counts as a win?',
        type: 'choice',
        required: true,
        options: ['A "Plan a visit" form', 'A phone call', 'An event sign-up', 'A donation'],
      },
    ],
  },
  {
    id: 'social',
    step: 'services',
    service: 'Social Media',
    title: 'Social media',
    intro: 'So every post sounds like you.',
    questions: [
      { id: 'platforms', label: 'Which accounts do you have? Paste the links.', type: 'textarea', required: true },
      {
        id: 'managed',
        label: 'Which ones should we run?',
        type: 'multi',
        required: true,
        options: ['Facebook', 'Instagram', 'YouTube', 'TikTok', 'X (Twitter)', 'LinkedIn'],
      },
      { id: 'voice', label: 'Describe how you sound in 3 words.', type: 'text', required: true, placeholder: 'Warm, hopeful, simple' },
      { id: 'avoid', label: 'Any topics we should never post about?', type: 'textarea', required: true },
      {
        id: 'photoPolicy',
        label: 'What is your rule for photos of kids and members?',
        type: 'textarea',
        required: true,
        placeholder: 'No kids faces without a signed form...',
      },
      { id: 'socialApprover', label: 'Who approves posts, and how fast can they reply?', type: 'text', required: true },
    ],
  },
  {
    id: 'files',
    step: 'files',
    title: 'Files',
    intro: 'Send what you have now. Anything you skip, we will remind you about.',
    questions: [
      { id: 'fileLogo', label: 'Upload your logo.', type: 'file' },
      {
        id: 'fileBrand',
        label: 'Upload your brand guide or colors.',
        type: 'file',
        showIf: (a) => is(a, 'hasBrand', 'Yes'),
      },
      { id: 'filePhotos', label: 'Upload a few photos of your building, services and people.', type: 'file' },
      {
        id: 'fileIrs',
        label: 'Upload your IRS 501(c)(3) letter.',
        type: 'file',
        why: 'Google needs this for the free Ad Grant.',
        showIf: (a) => is(a, 'exempt', 'Yes, we have our own IRS letter', 'Yes, under our denomination'),
      },
    ],
  },
];

export function withNotSure(question: Question): string[] {
  const options = question.options ?? [];
  return question.notSure ? [...options, NOT_SURE] : options;
}

/** Sections for this church's services, with hidden questions removed. */
export function activeSections(services: ServiceName[], answers: Answers): Section[] {
  return SECTIONS.filter((s) => s.service == null || services.includes(s.service))
    .map((s) => ({ ...s, questions: s.questions.filter((q) => q.showIf == null || q.showIf(answers)) }))
    .filter((s) => s.questions.length > 0);
}

export function isAnswered(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => (entry.startsWith('{') ? filledRows([entry]).length > 0 : entry.trim() !== ''));
  }
  return value != null && value.trim() !== '';
}

/** "Have these ready for the call": access happens live, never by password in a form. */
export const GET_READY: { service?: ServiceName; item: string }[] = [
  { item: 'Invite the people who hold your logins to the call.' },
  { item: 'Keep your phone close for 2-step codes.' },
  { service: 'Web Design', item: 'The login for your web address (GoDaddy, Squarespace...).' },
  { service: 'Web Design', item: 'The login for your current website or host.' },
  { service: 'Web Design', item: 'Admin access to your giving and church-management tools.' },
  { service: 'Local SEO', item: 'The Google account that owns your Google Maps listing.' },
  { service: 'Google Ads / Ad Grants', item: 'Your Google for Nonprofits login, if you have one.' },
  { service: 'Google Ads / Ad Grants', item: 'Your Google Ads login, if you have one.' },
  { service: 'Google Ads / Ad Grants', item: 'Your EIN and IRS letter.' },
  { service: 'Social Media', item: 'Admin access to your Facebook page and Meta Business account.' },
  { service: 'Social Media', item: 'Logins for any other accounts we will run.' },
];
