import { useEffect, useMemo, useRef, useState } from 'react';

import { CHURCH_NAME, FILES_PROJECT_ID, SERVICES } from '@/client';
import { AddressInput } from '@/components/onboarding/AddressInput';
import { ChipsInput } from '@/components/onboarding/ChipsInput';
import { RowsInput, SERVICE_TIME_COLUMNS, TEAM_COLUMNS } from '@/components/onboarding/RowsInput';
import { billingLink } from '@/components/portal/BillingTab';
import { Drawer, DrawerItem } from '@/components/portal/Drawer';
import { SUPPORT_EMAIL } from '@/config';
import { STEPS, activeSections, answerText, isAnswered, withNotSure } from '@/data/onboarding';
import type { Answers, Question, Section } from '@/data/onboarding';
import { createNode } from '@/lib/genesis-data';
import { storeFile, UNSUPPORTED } from '@/lib/store-file';
import { ArrowLeft, ArrowRight, Check, ClipboardCheck, CreditCard, Loader2, LogOut, Mail, Pencil, Upload } from '@/lib/icons';
import { STATUS_SUBMITTED, saveOnboarding } from '@/lib/onboarding';
import type { OnboardingState } from '@/lib/onboarding';
import { today } from '@/lib/scope';
import { scrollPortalTop } from '@/lib/use-phone';
import { encodeRows, formatError, formatPhone, normalizeUrl } from '@/lib/validate';

/** Never more than this many questions on one page. */
const MAX_PER_PAGE = 5;

type Screen =
  | { key: 'welcome'; kind: 'welcome' }
  | { key: string; kind: 'page'; section: Section; questions: Question[]; part: number; parts: number }
  | { key: 'review'; kind: 'review' };

/** Splits a section into even pages of at most MAX_PER_PAGE questions (8 -> 4 + 4, not 5 + 3). */
function chunk(questions: Question[]): Question[][] {
  const parts = Math.max(1, Math.ceil(questions.length / MAX_PER_PAGE));
  const size = Math.ceil(questions.length / parts);
  const pages: Question[][] = [];
  for (let i = 0; i < questions.length; i += size) pages.push(questions.slice(i, i + size));
  return pages;
}

function buildScreens(sections: Section[]): Screen[] {
  const screens: Screen[] = [{ key: 'welcome', kind: 'welcome' }];
  for (const section of sections) {
    const pages = chunk(section.questions);
    pages.forEach((questions, i) => {
      screens.push({ key: `p:${section.id}:${i}`, kind: 'page', section, questions, part: i, parts: pages.length });
    });
  }
  screens.push({ key: 'review', kind: 'review' });
  return screens;
}

/** The page that holds a question (also maps old one-question-per-page save points). */
function pageKeyFor(screens: Screen[], questionId: string): string | null {
  const page = screens.find((s) => s.kind === 'page' && s.questions.some((q) => q.id === questionId));
  return page?.key ?? null;
}

function resolvePos(screens: Screen[], pos: string): number {
  const direct = screens.findIndex((s) => s.key === pos);
  if (direct >= 0) return direct;
  if (pos.startsWith('q:')) {
    const key = pageKeyFor(screens, pos.slice(2));
    if (key != null) return screens.findIndex((s) => s.key === key);
  }
  if (pos.startsWith('intro:') || pos.startsWith('p:')) {
    const sectionId = pos.split(':')[1];
    const first = screens.findIndex((s) => s.kind === 'page' && s.section.id === sectionId);
    if (first >= 0) return first;
  }
  return 0;
}

function minutesFor(sections: Section[]): number {
  const count = sections.reduce((sum, s) => sum + s.questions.length, 0);
  return Math.max(5, Math.round((count * 30) / 60 / 5) * 5);
}

/** One answer field. Big targets. */
function AnswerInput({
  question,
  value,
  onChange,
  email,
  autoFocus,
}: {
  question: Question;
  value: string | string[] | undefined;
  onChange: (next: string | string[]) => void;
  email: string;
  autoFocus: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (question.type === 'choice') {
    return (
      <div className="ob-options ob-options-grid" role="radiogroup" aria-label={question.label}>
        {withNotSure(question).map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            className="ob-option"
            onClick={() => onChange(option)}
          >
            <span className="ob-dot" aria-hidden="true" />
            {option}
          </button>
        ))}
      </div>
    );
  }

  if (question.type === 'chips') {
    return (
      <ChipsInput
        groups={question.groups ?? [{ label: '', options: question.options ?? [] }]}
        value={value}
        onChange={onChange}
        other={question.other === true}
      />
    );
  }

  if (question.type === 'multi') {
    const picked = Array.isArray(value) ? value : [];
    return (
      <div className="ob-options ob-options-grid">
        {(question.options ?? []).map((option) => {
          const on = picked.includes(option);
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={on}
              className="ob-option"
              onClick={() => onChange(on ? picked.filter((p) => p !== option) : [...picked, option])}
            >
              <span className="ob-check" aria-hidden="true">
                {on && <Check />}
              </span>
              {option}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'file') {
    const files = Array.isArray(value) ? value : [];
    return (
      <div className="ff-stack">
        <label className={`ob-drop${uploading ? ' ob-drop-busy' : ''}`}>
          {uploading ? <Loader2 className="ff-spin" /> : <Upload />}
          <span>{uploading ? 'Uploading...' : files.length > 0 ? 'Add another file' : 'Choose a file (up to 10 MB)'}</span>
          <input
            type="file"
            className="ob-file"
            disabled={uploading}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file == null) return;
              setUploading(true);
              setUploadError(null);
              try {
                const stored = await storeFile(file);
                await createNode(FILES_PROJECT_ID, {
                  'File Name': stored.name,
                  'File URL': stored.url,
                  Folder: 'Onboarding',
                  'Uploaded By': email,
                  'Uploaded At': today(),
                  Note: question.label.replace(/\.$/, ''),
                });
                onChange([...files, stored.name]);
              } catch (err) {
                console.error('Upload failed', err);
                setUploadError(
                  err instanceof Error && (err.message.includes(UNSUPPORTED) || err.message.includes('larger than 10 MB'))
                    ? err.message
                    : `That did not upload. You can skip it, or email it to ${SUPPORT_EMAIL}.`,
                );
              } finally {
                setUploading(false);
              }
            }}
          />
        </label>
        {files.map((name) => (
          <p key={name} className="ob-uploaded">
            <Check /> {name}
          </p>
        ))}
        {uploadError != null && (
          <p className="ff-error" role="alert">
            {uploadError}
          </p>
        )}
      </div>
    );
  }

  if (question.type === 'times') {
    return (
      <RowsInput
        columns={SERVICE_TIME_COLUMNS}
        // Start with one Sunday row, like a new calendar event.
        value={value ?? encodeRows([{ day: 'Sunday', start: '', end: '', label: '' }])}
        onChange={onChange}
        addLabel="Add another service time"
        newRow={(rows) => ({ day: rows[rows.length - 1]?.day ?? 'Sunday', start: '', end: '', label: '' })}
      />
    );
  }

  if (question.type === 'people') {
    return (
      <RowsInput
        columns={TEAM_COLUMNS}
        value={value}
        onChange={onChange}
        addLabel="Add teammate"
        newRow={() => ({ name: '', role: '', email: '', phone: '' })}
        max={8}
      />
    );
  }

  const text = typeof value === 'string' ? value : '';
  if (question.type === 'address') {
    return (
      <AddressInput
        id={`ob-input-${question.id}`}
        value={text}
        onChange={onChange}
        placeholder={question.placeholder}
        autoFocus={autoFocus}
      />
    );
  }
  if (question.type === 'textarea') {
    return (
      <textarea
        className="ff-textarea ob-input"
        rows={3}
        autoFocus={autoFocus}
        placeholder={question.placeholder}
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      className="ff-input ob-input"
      type={question.type === 'url' ? 'text' : question.type}
      inputMode={question.type === 'tel' ? 'tel' : question.type === 'email' ? 'email' : question.type === 'url' ? 'url' : undefined}
      autoComplete={question.type === 'tel' ? 'tel' : question.type === 'email' ? 'email' : question.type === 'url' ? 'url' : undefined}
      autoFocus={autoFocus}
      placeholder={question.placeholder}
      value={text}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => {
        // Tidy up on the way out: (555) 555-5555, https://, no stray spaces.
        const raw = e.target.value;
        if (question.type === 'tel' && raw.trim() !== '') onChange(formatPhone(raw));
        if (question.type === 'email') onChange(raw.trim());
        if (question.type === 'url') {
          const url = normalizeUrl(raw);
          if (url != null) onChange(url);
        }
      }}
    />
  );
}

export function OnboardingFlow({
  email,
  fullName,
  firstName,
  onboarding,
  menuOpen,
  onMenuClose,
  onProgress,
  onSignOut,
}: {
  email: string;
  fullName: string;
  firstName: string;
  onboarding: OnboardingState;
  menuOpen: boolean;
  onMenuClose: () => void;
  onProgress: (pct: number) => void;
  onSignOut: () => void;
}) {
  // Local copy: live refreshes must never overwrite what someone is typing.
  // First visit: fill the main contact from the person signing in. They can change it.
  const [answers, setAnswers] = useState<Answers>(() => ({
    ...(email !== '' && fullName !== 'Preview' ? { contactEmail: email } : {}),
    ...(fullName !== '' && fullName !== 'Preview' ? { contactName: fullName } : {}),
    ...onboarding.answers,
  }));
  const [pos, setPos] = useState<string>(onboarding.currentStep ?? 'welcome');
  const [fromReview, setFromReview] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const rowId = useRef<string | null>(onboarding.rowId);
  const firstRender = useRef(true);

  const sections = useMemo(() => activeSections(SERVICES, answers), [answers]);
  const screens = useMemo(() => buildScreens(sections), [sections]);
  const index = resolvePos(screens, pos);
  const screen = screens[index];
  const questionTotal = sections.reduce((sum, s) => sum + s.questions.length, 0);
  const questionsBefore = screens
    .slice(0, index)
    .reduce((sum, s) => sum + (s.kind === 'page' ? s.questions.length : 0), 0);
  const stepNow = screen.kind === 'page' ? screen.section.step : screen.kind === 'review' ? 'done' : null;

  // Save as they go (debounced), so anyone at the church can stop and come back.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSaveState('saving');
    const timer = window.setTimeout(async () => {
      try {
        rowId.current = await saveOnboarding(rowId.current, {
          Answers: JSON.stringify(answers),
          'Current Step': screen.key,
          'Updated By': email,
          Status: 'In progress',
        });
        setSaveState('saved');
      } catch (err) {
        console.error('Onboarding save failed', err);
        setSaveState('failed');
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [answers, screen.key, email]);

  function go(key: string) {
    setError(null);
    setFieldErrors({});
    setPos(key);
    scrollPortalTop(false);
  }

  /** Missing required answers and wrong formats on one page. */
  function checkPage(questions: Question[]): Record<string, string> {
    const found: Record<string, string> = {};
    for (const q of questions) {
      if (q.required && !isAnswered(answers[q.id])) {
        found[q.id] = q.notSure ? "Please pick one. \"I'm not sure\" is fine." : 'Please answer this one.';
        continue;
      }
      const bad = formatError(q.type, answers[q.id]);
      if (bad != null) found[q.id] = bad;
    }
    return found;
  }

  function next() {
    if (screen.kind === 'page') {
      const found = checkPage(screen.questions);
      const count = Object.keys(found).length;
      if (count > 0) {
        setFieldErrors(found);
        setError(count === 1 ? 'One answer needs a fix.' : `${count} answers need a fix.`);
        return;
      }
      if (fromReview) {
        setFromReview(false);
        go('review');
        return;
      }
    }
    const after = screens[index + 1];
    if (after != null) go(after.key);
  }

  function back() {
    const before = screens[index - 1];
    if (before != null) go(before.key);
  }

  async function submit() {
    for (const s of screens) {
      if (s.kind !== 'page') continue;
      const found = checkPage(s.questions);
      if (Object.keys(found).length > 0) {
        setFromReview(true);
        go(s.key);
        setFieldErrors(found);
        setError('These still need a fix.');
        return;
      }
    }
    setSubmitting(true);
    try {
      rowId.current = await saveOnboarding(rowId.current, {
        Answers: JSON.stringify(answers),
        'Current Step': 'review',
        'Updated By': email,
        Status: STATUS_SUBMITTED,
        'Submitted At': today(),
      });
      await onboarding.refresh();
    } catch (err) {
      console.error('Submit failed', err);
      setError('That did not send. Please try again.');
      setSubmitting(false);
    }
  }

  const pct = screen.kind === 'review' ? 100 : questionTotal === 0 ? 0 : Math.round((questionsBefore / questionTotal) * 100);
  const answeredTotal = sections.reduce((sum, s) => sum + s.questions.filter((q) => isAnswered(answers[q.id])).length, 0);
  const pageNeedsNothing =
    screen.kind === 'page' && screen.questions.every((q) => q.type === 'file' && !isAnswered(answers[q.id]));

  useEffect(() => {
    onProgress(pct);
  }, [pct, onProgress]);

  /** Where a section starts: the page with its first unanswered question, else its first page. */
  function sectionTarget(section: Section): string {
    const open = section.questions.find((q) => !isAnswered(answers[q.id]));
    return (open != null ? pageKeyFor(screens, open.id) : null) ?? `p:${section.id}:0`;
  }

  function jump(key: string) {
    setFromReview(false);
    onMenuClose();
    go(key);
  }

  return (
    <section className="ob ff-col">
      <Drawer open={menuOpen} onClose={onMenuClose} title="Your onboarding">
        <div className="dr-progress">
          <div className="ob-bigbar" aria-hidden="true">
            <span style={{ width: `${Math.max(pct, 2)}%` }} />
          </div>
          <span className="ff-small">
            {answeredTotal} of {questionTotal} answered
          </span>
        </div>
        {STEPS.map((step) => {
          const stepSections = sections.filter((s) => s.step === step.id);
          if (stepSections.length === 0) return null;
          return (
            <div key={step.id} className="dr-group">
              <span className="dr-group-label">{step.label}</span>
              {stepSections.map((section) => {
                const answered = section.questions.filter((q) => isAnswered(answers[q.id])).length;
                const here = screen.kind === 'page' && screen.section.id === section.id;
                const state = here ? 'now' : answered === section.questions.length ? 'done' : 'todo';
                return (
                  <DrawerItem
                    key={section.id}
                    label={section.title}
                    meta={`${answered} of ${section.questions.length} answered`}
                    state={state}
                    icon={state === 'done' ? <Check /> : null}
                    onClick={() => jump(sectionTarget(section))}
                  />
                );
              })}
            </div>
          );
        })}
        <div className="dr-group">
          <DrawerItem label="Review my answers" icon={<ClipboardCheck />} onClick={() => jump('review')} />
          {billingLink(email) !== '' && (
            <DrawerItem
              label="Billing"
              meta="Card, invoices and receipts"
              icon={<CreditCard />}
              onClick={() => {
                onMenuClose();
                window.open(billingLink(email), '_blank', 'noopener,noreferrer');
              }}
            />
          )}
          <DrawerItem
            label="Need help?"
            meta={SUPPORT_EMAIL}
            icon={<Mail />}
            onClick={() => {
              window.location.href = `mailto:${SUPPORT_EMAIL}`;
            }}
          />
          <DrawerItem label="Save and sign out" meta="Your answers are saved" icon={<LogOut />} onClick={onSignOut} />
        </div>
      </Drawer>

      {screen.kind !== 'welcome' && (
        <nav className="ob-steps" aria-label="Progress">
          {STEPS.map((step, i) => {
            const stepIndex = STEPS.findIndex((s) => s.id === stepNow);
            const state = stepNow === 'done' || i < stepIndex ? 'done' : step.id === stepNow ? 'now' : 'todo';
            return (
              <span key={step.id} className={`ob-step ob-step-${state}`}>
                <span className="ob-step-num">{state === 'done' ? <Check /> : i + 1}</span>
                {step.label}
              </span>
            );
          })}
          <span className="ob-save" aria-live="polite">
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : saveState === 'failed' ? 'Not saved' : ''}
          </span>
        </nav>
      )}
      {screen.kind !== 'welcome' && (
        <div className="ob-progress">
          <div
            className="ob-bigbar"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Onboarding progress"
          >
            <span style={{ width: `${Math.max(pct, 2)}%` }} />
          </div>
          <span className="ob-progress-text">{screen.kind === 'review' ? 'All questions done' : `${pct}% done`}</span>
        </div>
      )}

      <div key={screen.key} className="ff-enter">
        {screen.kind === 'welcome' && (
          <>
            <span className="ff-eyebrow">{CHURCH_NAME}</span>
            <h1 className="ff-display">
              Welcome{firstName !== '' ? `, ${firstName}` : ''}. Let's get <span className="ff-box">started</span>.
            </h1>
            <p className="ff-lead">
              Answer a few questions so we can prepare for your kickoff call. It takes about {minutesFor(sections)} minutes.
              We save as you go, so you can stop any time.
            </p>
            <ol className="ob-plan">
              {STEPS.map((step, i) => (
                <li key={step.id}>
                  <span className="ob-step-num">{i + 1}</span>
                  <span>
                    <strong>{step.label}</strong>
                    <span className="ff-small" style={{ display: 'block' }}>
                      {step.id === 'church'
                        ? 'Your details and who you want to reach.'
                        : step.id === 'services'
                          ? `A few questions for ${SERVICES.join(', ')}.`
                          : 'Your logo and photos. You can skip and send them later.'}
                    </span>
                  </span>
                </li>
              ))}
              <li>
                <span className="ob-step-num">
                  <Check />
                </span>
                <span>
                  <strong>Book your kickoff call</strong>
                  <span className="ff-small" style={{ display: 'block' }}>
                    We connect your accounts together on the call. Never type passwords here.
                  </span>
                </span>
              </li>
            </ol>
            <button type="button" className="ff-btn ff-btn-primary ob-cta" onClick={next}>
              {onboarding.currentStep != null && onboarding.currentStep !== 'welcome' ? 'Pick up where we left off' : "Let's go"} <ArrowRight />
            </button>
          </>
        )}

        {screen.kind === 'page' && (
          <>
            <span className="ff-eyebrow">
              {screen.parts > 1 ? `${screen.section.title} · part ${screen.part + 1} of ${screen.parts}` : screen.section.title}
            </span>
            <h1 className="ff-h1">{screen.part === 0 ? screen.section.title : `${screen.section.title}, continued`}</h1>
            {screen.part === 0 && <p className="ff-lead">{screen.section.intro}</p>}
            <div className="ob-fields">
              {screen.questions.map((q, i) => (
                <div key={q.id} className={`ob-field${fieldErrors[q.id] != null ? ' ob-field-missing' : ''}`}>
                  <label className="ob-label" htmlFor={`ob-${q.id}`}>
                    {q.label}
                    {!q.required && q.type !== 'file' && <span className="ob-optional"> Optional</span>}
                  </label>
                  {q.why != null && <p className="ob-why">{q.why}</p>}
                  <div id={`ob-${q.id}`}>
                    <AnswerInput
                      question={q}
                      value={answers[q.id]}
                      email={email}
                      autoFocus={i === 0}
                      onChange={(value) => {
                        setError(null);
                        setFieldErrors((prev) => {
                          const rest = { ...prev };
                          delete rest[q.id];
                          return rest;
                        });
                        setAnswers((prev) => ({ ...prev, [q.id]: value }));
                      }}
                    />
                  </div>
                  {fieldErrors[q.id] != null && (
                    <p className="ff-error" style={{ margin: 0 }}>
                      {fieldErrors[q.id]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {screen.kind === 'review' && (
          <>
            <span className="ff-eyebrow">Last step</span>
            <h1 className="ff-h1">
              Check your <span className="ff-box">answers</span>.
            </h1>
            <p className="ff-lead">Change anything that is not right, then send it to us.</p>
            <div className="ff-stack" style={{ marginTop: 24 }}>
              {sections.map((section) => (
                <div key={section.id} className="ff-item">
                  <h2 className="ff-item-title">{section.title}</h2>
                  <dl className="ob-review">
                    {section.questions.map((q) => (
                      <div key={q.id} className="ob-review-row">
                        <dt>{q.label}</dt>
                        <dd>
                          {isAnswered(answers[q.id]) ? (
                            answerText(answers[q.id], q.type)
                          ) : (
                            <span className={q.required ? 'ob-missing' : 'ff-small'}>
                              {q.required ? 'Still needed' : q.type === 'file' ? 'Skipped for now' : 'Not provided'}
                            </span>
                          )}
                        </dd>
                        <button
                          type="button"
                          className="ff-btn ff-btn-ghost ff-btn-sm"
                          onClick={() => {
                            const key = pageKeyFor(screens, q.id);
                            if (key == null) return;
                            setFromReview(true);
                            go(key);
                          }}
                        >
                          <Pencil /> Change
                        </button>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}

        {error != null && (
          <p className="ff-error" role="alert" style={{ marginTop: 16 }}>
            {error}
          </p>
        )}
      </div>

      {screen.kind !== 'welcome' && (
        <div className="ob-bar">
          <button type="button" className="ff-btn ff-btn-ghost" onClick={back}>
            <ArrowLeft /> Back
          </button>
          <span className="ob-pct">
            <span className="ob-minibar" aria-hidden="true">
              <span style={{ width: `${Math.max(pct, 2)}%` }} />
            </span>
            {pct}%
          </span>
          {screen.kind === 'review' ? (
            <button type="button" className="ff-btn ff-btn-primary" disabled={submitting} onClick={() => void submit()}>
              {submitting ? <Loader2 className="ff-spin" /> : <Check />} Send my answers
            </button>
          ) : (
            <button type="button" className="ff-btn ff-btn-primary" onClick={next}>
              {pageNeedsNothing ? 'Skip for now' : fromReview ? 'Back to review' : 'Continue'} <ArrowRight />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

export function onboardingDone(status: string): boolean {
  return status === STATUS_SUBMITTED;
}
