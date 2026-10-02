import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

import { CHURCH_NAME } from '@/client';
import { TaskComments } from '@/components/portal/TaskComments';
import { AGENCY_NAME } from '@/config';
import { PersonAvatar, usePeople } from '@/lib/people';
import { useOpenService } from '@/lib/portal-nav';
import type { Person } from '@/lib/people';
import { CalendarDays, Check, CheckCircle2, ChevronDown, Circle, ExternalLink, File, FileText, Film, Flag, History as HistoryIcon, Layers, Loader2, User, X } from '@/lib/icons';
import type { HistoryEntry, TaskLink, Subtask } from '@/lib/task-detail';
import { historyDate, noteParts } from '@/lib/task-detail';

function FileIcon({ kind }: { kind: TaskLink['kind'] }) {
  if (kind === 'video') return <Film />;
  if (kind === 'pdf' || kind === 'doc') return <FileText />;
  return <File />;
}

/** "Mary", "Mary and Jake", "Mary, Jake and Sam". */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** Who does a task: the assignees' photos (or initials), overlapped. Three show, then "+2". An empty circle when no one. */
export function TaskOwner({ people, size = 'sm' }: { people: Person[]; size?: 'sm' | 'md' }) {
  if (people.length === 0) {
    return (
      <span className={`td-avatar td-avatar-${size} td-avatar-empty`} role="img" aria-label="Unassigned" title="Unassigned">
        <User aria-hidden="true" />
      </span>
    );
  }
  const shown = people.slice(0, 3);
  const extra = people.length - shown.length;
  const names = joinNames(people.map((p) => p.name));
  return (
    <span className="td-stack" role="img" aria-label={`Assigned to ${names}`} title={names}>
      {shown.map((p) => (
        <PersonAvatar key={p.email} person={p} size={size} />
      ))}
      {extra > 0 && <span className={`td-avatar td-avatar-${size} td-avatar-more`}>+{extra}</span>}
    </span>
  );
}

/**
 * The "who" chip: the assignees' photos and names, or "Unassigned". Tap it to tick people on or off.
 * Each tick saves right away. Lists everyone in Portal — Users (and anyone who sent a message).
 */
function AssigneeChip({
  value,
  canEdit,
  onAssign,
}: {
  value: Person[];
  /** False: the chip only shows who is assigned. */
  canEdit: boolean;
  onAssign: (emails: string[]) => Promise<void>;
}) {
  const { list } = usePeople();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLLIElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chosen = value.map((p) => p.email);
  // Someone typed into "Assigned To" in Taskade with no profile still shows, so they can be taken off.
  const options = [...list, ...value.filter((p) => !list.some((q) => q.email === p.email))];
  const groups = [
    { label: CHURCH_NAME, people: options.filter((p) => !p.isAgency) },
    { label: AGENCY_NAME, people: options.filter((p) => p.isAgency) },
  ].filter((g) => g.people.length > 0);

  async function toggle(email: string) {
    const next = chosen.includes(email) ? chosen.filter((e) => e !== email) : [...chosen, email];
    setSaving(true);
    setError(null);
    try {
      await onAssign(next);
    } catch (err) {
      console.error('Assign failed', err);
      setError(err instanceof Error && err.message.includes('Assigned To') ? err.message : 'That did not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const close = useCallback(() => setOpen(false), []);
  useCloseOutside(open, wrapRef, close);
  const label = value.length === 0 ? 'Unassigned' : joinNames(value.map((p) => p.name));

  if (!canEdit) {
    return (
      <li className="td-fact-owner">
        <TaskOwner people={value} size="md" />
        <span className="td-assign-label">
          <span className="td-sr">Assigned to: </span>
          {label}
        </span>
      </li>
    );
  }

  return (
    <li
      ref={wrapRef}
      className="td-fact-owner td-assign"
      onKeyDown={(e) => {
        // Escape closes the list, not the whole task.
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button type="button" className="td-assign-btn" aria-haspopup="true" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <TaskOwner people={value} size="md" />
        <span className="td-assign-label">
          <span className="td-sr">Assigned to: </span>
          {label}
        </span>
        {saving ? <Loader2 className="ff-spin" aria-hidden="true" /> : <ChevronDown className="td-assign-chevron" aria-hidden="true" />}
      </button>
      {open && (
        <div className="td-assign-pop" role="group" aria-label="Assign people">
          {groups.length === 0 ? (
            <p className="ff-small" style={{ margin: 0 }}>
              No one to pick yet. People show here after they sign in to the portal.
            </p>
          ) : (
            groups.map((g) => (
              <fieldset key={g.label} className="td-assign-group">
                <legend>{g.label}</legend>
                {g.people.map((p) => (
                  // The whole row is the tick box: the box itself is hidden, the row turns orange when picked.
                  <label key={p.email} className={chosen.includes(p.email) ? 'td-assign-item td-assign-on' : 'td-assign-item'}>
                    <input
                      type="checkbox"
                      className="td-sr"
                      checked={chosen.includes(p.email)}
                      disabled={saving}
                      onChange={() => void toggle(p.email)}
                    />
                    <PersonAvatar person={p} />
                    <span className="td-assign-name">{p.name}</span>
                    {chosen.includes(p.email) && <Check className="td-assign-tick" aria-hidden="true" />}
                  </label>
                ))}
              </fieldset>
            ))
          )}
          {error != null && (
            <p className="ff-error td-assign-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/** Closes a pop-up list on a click outside `ref`. */
function useCloseOutside(open: boolean, ref: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current != null && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, ref, close]);
}

/** Dot color per status, matching the service board columns. */
function statusTone(status: string): string {
  if (status === 'To Do') return 'kb-st-blue';
  if (status === 'In Progress') return 'kb-st-yellow';
  if (status.startsWith('Waiting')) return 'kb-st-purple';
  if (status === 'Done') return 'kb-st-green';
  return 'kb-st-grey';
}

/**
 * The status badge at the top of a task. Tap it to change the status (when allowed)
 * or to see the task on its service's Status board.
 */
function StatusMenu({
  status,
  statuses,
  labelOf,
  tagClass,
  canEdit,
  onStatus,
  onShowBoard,
}: {
  status: string;
  statuses: string[];
  labelOf: (status: string) => string;
  tagClass: (status: string) => string;
  canEdit: boolean;
  onStatus: (status: string) => Promise<void>;
  onShowBoard: (() => void) | null;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useCloseOutside(open, wrapRef, close);

  if (!canEdit && onShowBoard == null) return <span className={tagClass(status)}>{labelOf(status)}</span>;

  async function pick(next: string) {
    setSaving(true);
    setError(null);
    try {
      await onStatus(next);
      setOpen(false);
    } catch (err) {
      console.error('Status change failed', err);
      setError('That did not save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={wrapRef}
      className="td-status"
      onKeyDown={(e) => {
        // Escape closes the list, not the whole task.
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        type="button"
        className={`${tagClass(status)} td-status-btn`}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Status: ${labelOf(status)}. ${canEdit ? 'Change status' : 'See it on the board'}`}
        onClick={() => setOpen((v) => !v)}
      >
        {labelOf(status)}
        {saving ? <Loader2 className="ff-spin" aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      </button>
      {open && (
        <div className="td-assign-pop td-status-pop" role="group" aria-label="Task status">
          {canEdit ? (
            statuses.map((s) => (
              <button
                key={s}
                type="button"
                className={s === status ? 'td-assign-item td-assign-on' : 'td-assign-item'}
                aria-pressed={s === status}
                disabled={saving}
                onClick={() => void pick(s)}
              >
                <span className={`td-status-dot ${statusTone(s)}`} aria-hidden="true" />
                <span className="td-assign-name">{labelOf(s)}</span>
                {s === status && <Check className="td-assign-tick" aria-hidden="true" />}
              </button>
            ))
          ) : (
            <p className="ff-small td-status-note">Only the people assigned to this task can change its status.</p>
          )}
          {onShowBoard != null && (
            <button type="button" className="td-status-board" onClick={onShowBoard}>
              <Layers aria-hidden="true" /> See it on the board
            </button>
          )}
          {error != null && (
            <p className="ff-error td-assign-error" role="alert">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** A fact chip (service, milestone) that opens the service page when the portal can navigate. */
function FactLink({ icon, label, onOpen }: { icon: ReactNode; label: string; onOpen: (() => void) | null }) {
  if (onOpen == null) {
    return (
      <li>
        {icon} {label}
      </li>
    );
  }
  return (
    <li className="td-fact-nav">
      <button type="button" className="td-chip-btn" onClick={onOpen} title={`Open ${label}`}>
        {icon} {label}
      </button>
    </li>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="td-section">
      <h3 className="td-section-title">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Full view of one task: description, checklist (subtasks), files, comments, history, and the "I did this" button.
 * Slides in from the right (from the bottom on phones). Closes on Escape, backdrop, or X.
 */
export function TaskSheet({
  taskId,
  title,
  status,
  statuses,
  statusLabel,
  tagClass,
  canEdit,
  onStatus,
  service,
  milestone,
  milestoneKey,
  due,
  notes,
  subtasks,
  links,
  history = [],
  assignees,
  onAssign,
  waiting,
  saving,
  onDone,
  onClose,
}: {
  /** Portal — Tasks row id. Comments are tied to it. */
  taskId: string;
  title: string;
  /** Status value as stored ("Waiting on You"); `statusLabel` gives the name shown. */
  status: string;
  statuses: string[];
  statusLabel: (status: string) => string;
  tagClass: (status: string) => string;
  /** Faith Funnels people, and church people assigned to this task: may change its status and assignees. */
  canEdit: boolean;
  onStatus: (status: string) => Promise<void>;
  service: string | null;
  /** Milestone name shown, and its key for opening that column on the service page. */
  milestone: string | null;
  milestoneKey: string | null;
  due: string | null;
  notes: string;
  subtasks: Subtask[];
  links: TaskLink[];
  /** Newest first. Shown in a closed box the person can open. */
  history?: HistoryEntry[];
  /** The people doing it ("Assigned To", or the default for our tasks). Empty shows "Unassigned". */
  assignees: Person[];
  /** Saves "Assigned To". An empty list clears it. */
  onAssign: (emails: string[]) => Promise<void>;
  waiting: boolean;
  saving: boolean;
  onDone: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Lock scroll (the portal scrolls inside `.ff-body`), focus the close button, and give focus back on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const scrollers = [document.body, document.querySelector<HTMLElement>('.ff-body')].filter((el): el is HTMLElement => el != null);
    const prev = scrollers.map((el) => el.style.overflow);
    scrollers.forEach((el) => {
      el.style.overflow = 'hidden';
    });
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      scrollers.forEach((el, i) => {
        el.style.overflow = prev[i];
      });
      opener?.focus?.({ preventScroll: true });
    };
  }, []);

  // Escape closes; Tab stays inside the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || panelRef.current == null) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], summary, textarea:not([disabled]), input:not([disabled]), select:not([disabled])',
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Chips open the task's service page: its milestone board, or its Status board at this task's column.
  const openService = useOpenService();
  const go = (view: 'milestones' | 'status', focus: string | null): (() => void) | null => {
    if (openService == null || service == null || service === '') return null;
    const target = { service, view, focus };
    return () => openService(target);
  };

  const stepsDone = subtasks.filter((s) => s.done).length;
  const images = links.filter((l) => l.kind === 'image');
  const others = links.filter((l) => l.kind !== 'image');

  // Render at the `.ff` root: a moving parent (card hover lift, page fade-in) would trap `position: fixed`.
  const host = document.querySelector<HTMLElement>('main.ff') ?? document.body;
  return createPortal(
    <div className="td-root">
      <button type="button" className="td-backdrop" aria-label="Close task" tabIndex={-1} onClick={onClose} />
      <div ref={panelRef} className="td-panel" role="dialog" aria-modal="true" aria-labelledby="td-title">
        <div className="td-top">
          <StatusMenu
            status={status}
            statuses={statuses}
            labelOf={statusLabel}
            tagClass={tagClass}
            canEdit={canEdit}
            onStatus={onStatus}
            onShowBoard={go('status', status)}
          />
          <button ref={closeRef} type="button" className="ff-btn ff-btn-ghost ff-btn-sm td-close" onClick={onClose} aria-label="Close task">
            <X />
          </button>
        </div>

        <h2 id="td-title" className="ff-h2 td-title">
          {title}
        </h2>

        <ul className="td-facts">
          <AssigneeChip value={assignees} canEdit={canEdit} onAssign={onAssign} />
          {service != null && service !== '' && <FactLink icon={<Layers />} label={service} onOpen={go('milestones', null)} />}
          {milestone != null && milestone !== '' && (
            <FactLink icon={<Flag />} label={milestone} onOpen={go('milestones', milestoneKey)} />
          )}
          {due != null && due !== '' && (
            <li>
              <CalendarDays /> Due {due}
            </li>
          )}
        </ul>

        {waiting && (
          <div className="td-callout">
            <p className="ff-small" style={{ margin: 0 }}>
              We are waiting on you for this one. Tap the button when it is done.
            </p>
            <button type="button" className="ff-btn ff-btn-primary ff-btn-sm" disabled={saving} onClick={onDone}>
              {saving ? <Loader2 className="ff-spin" /> : <Check />} I did this
            </button>
          </div>
        )}

        {notes.trim() !== '' && (
          <Section title="Details">
            <p className="td-notes">
              {noteParts(notes).map((part, i) =>
                'url' in part ? (
                  <a key={i} className="ff-link" href={part.url} target="_blank" rel="noreferrer">
                    {part.text}
                  </a>
                ) : (
                  <span key={i}>{part.text}</span>
                ),
              )}
            </p>
          </Section>
        )}

        {subtasks.length > 0 && (
          <Section title={`Checklist · ${stepsDone} of ${subtasks.length}`}>
            <div className="kb-bar">
              <span style={{ width: `${(stepsDone / subtasks.length) * 100}%` }} />
            </div>
            <ul className="td-steps">
              {subtasks.map((step) => (
                <li key={step.id} className={step.done ? 'td-step td-step-done' : 'td-step'}>
                  {step.done ? <CheckCircle2 aria-label="Done" /> : <Circle aria-label="Not done" />}
                  <span>{step.title}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {links.length > 0 && (
          <Section title={`Files · ${links.length}`}>
            {images.length > 0 && (
              <div className="td-images">
                {images.map((file) => (
                  <a key={file.url} className="td-image" href={file.url} target="_blank" rel="noreferrer" title={file.name}>
                    <img src={file.url} alt={file.name} loading="lazy" />
                  </a>
                ))}
              </div>
            )}
            {others.map((file) => (
              <a key={file.url} className="td-file" href={file.url} target="_blank" rel="noreferrer">
                <span className="td-file-icon">
                  <FileIcon kind={file.kind} />
                </span>
                <span className="td-file-name">{file.name}</span>
                <ExternalLink className="td-file-out" />
              </a>
            ))}
          </Section>
        )}

        <Section title="Comments">
          <TaskComments taskId={taskId} taskTitle={title} />
        </Section>

        <details className="td-section td-history">
          <summary className="td-history-toggle">
            <HistoryIcon aria-hidden="true" />
            <span className="td-section-title">History · {history.length}</span>
            <ChevronDown className="td-history-chevron" aria-hidden="true" />
          </summary>
          {history.length === 0 ? (
            <p className="ff-small td-history-empty">No history yet.</p>
          ) : (
            <ol className="td-history-list">
              {history.map((entry, i) => (
                <li key={i} className="td-history-item">
                  {entry.date != null && <time dateTime={entry.date}>{historyDate(entry.date)}</time>}
                  <span>{entry.text}</span>
                </li>
              ))}
            </ol>
          )}
        </details>
      </div>
    </div>,
    host,
  );
}
