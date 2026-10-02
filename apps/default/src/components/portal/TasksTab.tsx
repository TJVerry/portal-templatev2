import { useCallback, useMemo, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { ApprovalCard, approvalStatusOf, NEEDS_OK, PENDING, RequestApproval, useDecide } from '@/components/portal/ApprovalsTab';
import { TabState } from '@/components/portal/TabState';
import { joinNames, TaskOwner, TaskSheet } from '@/components/portal/TaskSheet';
import { CHURCH_NAME, TASKS_PROJECT_ID } from '@/client';
import { DEFAULT_AGENCY_ASSIGNEE } from '@/config';
import type { useLiveNodes } from '@/hooks/use-live-nodes';
import { forMyServices, forService } from '@/lib/scope';
import { getFieldValue, updateNode } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';
import { Check, ListChecks, Loader2, MessageSquare, Paperclip } from '@/lib/icons';
import { isAgencyEmail } from '@/lib/chat';
import { usePeople } from '@/lib/people';
import {
  milestoneLabel,
  milestoneOf,
  NO_MILESTONE,
  planOrderOf,
  planTaskOf,
  taskStatusOf,
  taskTitleOf,
} from '@/lib/progress';
import {
  addTaskHistory,
  ASSIGNED_FIELD,
  assigneesOf,
  assigneesUnset,
  assigneesValue,
  historyOf,
  markTaskDone,
  noteLinks,
  subtasksByParent,
} from '@/lib/task-detail';
import type { Subtask } from '@/lib/task-detail';
import { useTaskComments } from '@/lib/task-comments';

export { taskStatusOf };

/** Status values in the Tasks project, in the order the portal groups them. */
const WAITING = 'Waiting on You';
export const STATUS_ORDER = [WAITING, 'In Progress', 'To Do', 'Done'];
/** Statuses offered in the task view, in the order work moves. */
const STATUS_CHOICES = ['To Do', 'In Progress', WAITING, 'Done'];

/** Name shown to the church. The Status value in Taskade stays "Waiting on You". */
export function statusLabel(status: string): string {
  return status === WAITING ? 'Waiting on Review' : status;
}

/** Who to name in a task's History: the signed-in person, or the church in the editor preview. */
export function useMyName(): string {
  const people = usePeople();
  const profile = useAuth().user?.profile;
  if (people.me !== '') return people.who(people.me).name;
  return profile?.name || profile?.email || CHURCH_NAME;
}

/** The person using the portal, lowercased: the email PortalPage runs as (the preview stand-in too), else the sign-in email. */
function useMyEmail(): string {
  const fromPortal = usePeople().me;
  const fromAuth = (useAuth().user?.profile?.email ?? '').trim().toLowerCase();
  return fromPortal !== '' ? fromPortal : fromAuth;
}

/** The church does it when the plan says so or we are waiting on them; everything else is ours. */
function churchOwnsTask(row: GenesisNode): boolean {
  return planTaskOf(row)?.who === 'you' || taskStatusOf(row) === WAITING;
}

/** Who does a task: "Assigned To", or for our tasks where it was never filled in, DEFAULT_AGENCY_ASSIGNEE. */
function assigneesFor(row: GenesisNode): string[] {
  if (!assigneesUnset(row)) return assigneesOf(row);
  return churchOwnsTask(row) ? [] : [DEFAULT_AGENCY_ASSIGNEE];
}

function tagClass(status: string): string {
  if (status === WAITING) return 'ff-tag ff-tag-hot';
  if (status === 'Done') return 'ff-tag ff-tag-ok';
  return 'ff-tag';
}

/**
 * One task. Tap anywhere on the card to open its full view (TaskSheet): details, checklist, files, history.
 * `compact` is the small card used on the service board. `sub` replaces the service name in the meta line.
 */
export function TaskCard({
  row,
  onDone,
  onSaved,
  compact = false,
  sub,
  subtasks = [],
}: {
  row: GenesisNode;
  onDone: (id: string) => Promise<void>;
  /** Reloads the task list after a change made in the task view (status, assignees). */
  onSaved?: () => Promise<void>;
  compact?: boolean;
  sub?: string | null;
  subtasks?: Subtask[];
}) {
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const savedStatus = taskStatusOf(row);
  // Shows a new status right away, until the row reloads with it (or someone else changes it).
  const [pickedStatus, setPickedStatus] = useState<{ status: string; over: string } | null>(null);
  const status = pickedStatus != null && pickedStatus.over === savedStatus ? pickedStatus.status : savedStatus;
  const due = getFieldValue(row, 'Due Date');
  const service = getFieldValue(row, 'Service');
  const plan = planTaskOf(row);
  // The row's own Notes win; plan tasks fall back to the plan's one-line detail.
  const ownNotes = getFieldValue(row, 'Notes');
  const notes = ownNotes != null && ownNotes !== '' ? ownNotes : (plan?.detail ?? '');
  const links = useMemo(() => noteLinks(notes), [notes]);
  const history = useMemo(() => historyOf(row), [row]);
  const milestone = milestoneOf(row);
  const milestoneName = milestone === NO_MILESTONE ? null : milestoneLabel(milestone);
  const place = compact ? sub : [service, milestoneName].filter(Boolean).join(' · ');
  const meta = [place, due != null && due !== '' ? `Due ${due}` : null].filter(Boolean).join(' · ');
  const waiting = status === WAITING;
  const myName = useMyName();
  const myEmail = useMyEmail();
  // Assignees are stored as emails; names and photos are looked up from Portal — Users each time.
  const people = usePeople();
  const saved = assigneesFor(row);
  const savedKey = getFieldValue(row, ASSIGNED_FIELD) ?? '';
  // Shows a new pick right away, until the row reloads with it (or someone else changes it).
  const [picked, setPicked] = useState<{ emails: string[]; over: string } | null>(null);
  const assignedEmails = picked != null && picked.over === savedKey ? picked.emails : saved;
  const assignees = assignedEmails.map((email) => people.who(email));
  // Faith Funnels people can change any task. Church people only the tasks assigned to them.
  const canEdit = isAgencyEmail(myEmail) || (myEmail !== '' && assignedEmails.includes(myEmail));
  const stepsDone = subtasks.filter((s) => s.done).length;
  const commentCount = useTaskComments()?.byTask.get(row.id)?.length ?? 0;
  const close = useCallback(() => setOpen(false), []);

  async function assign(emails: string[]) {
    const { ignoredKeys } = await updateNode(TASKS_PROJECT_ID, row.id, { [ASSIGNED_FIELD]: assigneesValue(emails) });
    if (ignoredKeys.includes(ASSIGNED_FIELD)) {
      throw new Error(`Tasks need one more column ("${ASSIGNED_FIELD}"). Please tell Faith Funnels.`);
    }
    const added = emails.filter((e) => !assignedEmails.includes(e));
    const removed = assignedEmails.filter((e) => !emails.includes(e));
    setPicked({ emails, over: savedKey });
    const names = (list: string[]) => joinNames(list.map((e) => people.who(e).name));
    if (added.length > 0) await addTaskHistory(TASKS_PROJECT_ID, row, `Assigned to ${names(added)} by ${myName}`);
    if (removed.length > 0) await addTaskHistory(TASKS_PROJECT_ID, row, `${names(removed)} taken off by ${myName}`);
    await onSaved?.();
  }

  async function changeStatus(next: string) {
    if (next === status) return;
    await updateNode(TASKS_PROJECT_ID, row.id, { Status: next });
    setPickedStatus({ status: next, over: savedStatus });
    await addTaskHistory(TASKS_PROJECT_ID, row, `Moved to ${statusLabel(next)} by ${myName}`);
    await onSaved?.();
  }

  async function done() {
    setSaving(true);
    try {
      await onDone(row.id);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <article
        className={`ff-item td-card ${compact ? 'kb-card' : 'ff-lift'}${status === 'Done' ? ' tk-done' : ''}${waiting ? ' tk-waiting' : ''}`}
      >
        <div className="ff-item-head tk-head">
          <h3 className="ff-item-title">
            {status === 'Done' && <Check className="tk-check" aria-hidden="true" />}
            <button type="button" className="td-open" onClick={() => setOpen(true)} aria-haspopup="dialog">
              {taskTitleOf(row)}
            </button>
          </h3>
          <span className="tk-tags">
            <span className={tagClass(status)}>{statusLabel(status)}</span>
          </span>
        </div>
        {meta !== '' && <p className="ff-item-meta">{meta}</p>}
        {notes !== '' && status !== 'Done' && <p className="ff-small td-preview">{notes}</p>}
        <div className="td-chips">
          {subtasks.length > 0 && (
            <span className={stepsDone === subtasks.length ? 'td-chip td-chip-ok' : 'td-chip'}>
              <ListChecks aria-hidden="true" /> {stepsDone}/{subtasks.length}
              <span className="td-sr"> steps done</span>
            </span>
          )}
          {links.length > 0 && (
            <span className="td-chip">
              <Paperclip aria-hidden="true" /> {links.length}
              <span className="td-sr"> {links.length === 1 ? 'file' : 'files'}</span>
            </span>
          )}
          {commentCount > 0 && (
            <span className="td-chip">
              <MessageSquare aria-hidden="true" /> {commentCount}
              <span className="td-sr"> {commentCount === 1 ? 'comment' : 'comments'}</span>
            </span>
          )}
          <span className="td-owner">
            <TaskOwner people={assignees} />
          </span>
        </div>
        {waiting && canEdit && (
          <div className="ff-row-actions td-above">
            <button type="button" className="ff-btn ff-btn-primary ff-btn-sm tk-did" disabled={saving} onClick={done}>
              {saving ? <Loader2 className="ff-spin" /> : <Check />} I did this
            </button>
          </div>
        )}
      </article>
      {open && (
        <TaskSheet
          taskId={row.id}
          title={taskTitleOf(row)}
          status={status}
          statuses={STATUS_CHOICES}
          statusLabel={statusLabel}
          tagClass={tagClass}
          canEdit={canEdit}
          onStatus={changeStatus}
          service={service}
          milestone={milestoneName}
          milestoneKey={milestone === NO_MILESTONE ? null : milestone}
          due={due}
          notes={notes}
          subtasks={subtasks}
          links={links}
          history={history}
          assignees={assignees}
          onAssign={assign}
          waiting={waiting && canEdit}
          saving={saving}
          onDone={done}
          onClose={close}
        />
      )}
    </>
  );
}

type Filter = 'ok' | 'open' | 'yours' | 'done';

const isPending = (row: GenesisNode) => approvalStatusOf(row) === PENDING;

/** Open tasks assigned to the signed-in person in "Assigned To". Unassigned tasks never count. */
function isYours(row: GenesisNode, myEmail: string): boolean {
  if (myEmail === '' || taskStatusOf(row) === 'Done' || assigneesUnset(row)) return false;
  return assigneesOf(row).includes(myEmail);
}

/**
 * Tasks and approvals in one place. `tasks` and `approvals` come from PortalPage (it also counts them for the menu badge).
 * "Needs Approval" holds approvals: waiting ones first, answered ones below. Waiting approvals also sit at the top of
 * All Tasks, so nothing is missed. The tab always opens on All Tasks.
 */
export function TasksTab({
  tasks,
  approvals,
  email,
  service,
}: {
  tasks: ReturnType<typeof useLiveNodes>;
  approvals: ReturnType<typeof useLiveNodes>;
  email: string;
  service: string | null;
}) {
  const { nodes, loading, error, refresh } = tasks;
  const [saveError, setSaveError] = useState(false);
  const [picked, setPicked] = useState<Filter | null>(null);
  const me = useMyName();
  const myEmail = useMyEmail();
  const yours = (row: GenesisNode) => isYours(row, myEmail);
  const { decide, saveError: decideError } = useDecide(email, approvals.refresh);
  const admin = isAgencyEmail(myEmail);

  const all = useMemo(
    () =>
      forService(forMyServices(nodes), service).sort(
        (a, b) =>
          STATUS_ORDER.indexOf(taskStatusOf(a)) - STATUS_ORDER.indexOf(taskStatusOf(b)) || planOrderOf(a) - planOrderOf(b),
      ),
    [nodes, service],
  );
  const oks = useMemo(() => forService(forMyServices(approvals.nodes), service), [approvals.nodes, service]);
  const pending = oks.filter(isPending);
  const answered = oks.filter((row) => !isPending(row));
  const steps = useMemo(() => subtasksByParent(nodes), [nodes]);
  const filter: Filter = picked ?? 'open';
  const counts: Record<Filter, number> = {
    ok: pending.length,
    open: pending.length + all.filter((row) => taskStatusOf(row) !== 'Done').length,
    yours: all.filter(yours).length,
    done: all.filter((row) => taskStatusOf(row) === 'Done').length,
  };
  const rows =
    filter === 'ok'
      ? []
      : all.filter((row) =>
          filter === 'open' ? taskStatusOf(row) !== 'Done' : filter === 'yours' ? yours(row) : taskStatusOf(row) === 'Done',
        );
  const topOks = filter === 'open' || filter === 'ok' ? pending : [];
  const isLoading = loading || approvals.loading;
  const anything = all.length + oks.length;
  const emptyText =
    filter === 'ok'
      ? 'Nothing needs your approval right now.'
      : filter === 'yours'
        ? 'No open tasks are assigned to you.'
        : filter === 'done'
          ? 'Nothing is done yet.'
          : 'Every task is done.';
  const isEmpty = filter === 'ok' ? pending.length === 0 : rows.length + topOks.length === 0;
  const filters: { id: Filter; label: string }[] = [
    { id: 'open', label: 'All Tasks' },
    { id: 'yours', label: 'My Tasks' },
    { id: 'ok', label: NEEDS_OK },
    { id: 'done', label: 'Done' },
  ];

  async function markDone(id: string) {
    setSaveError(false);
    try {
      const row = nodes.find((n) => n.id === id);
      if (row == null) return;
      await markTaskDone(TASKS_PROJECT_ID, row, me);
      await refresh();
    } catch (err) {
      console.error('Task update failed', err);
      setSaveError(true);
    }
  }

  return (
    <div className="ff-stack">
      {(anything > 0 || admin) && (
        <div className="tk-bar">
          {anything > 0 && (
            <div className="tk-filters" role="group" aria-label="Show tasks">
              {filters.map((f) => (
                <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setPicked(f.id)}>
                  {f.label} <span className="tk-filter-count">{counts[f.id]}</span>
                </button>
              ))}
            </div>
          )}
          {/* Faith Funnels people can ask the church to approve something. */}
          {admin && <RequestApproval onAdded={approvals.refresh} />}
        </div>
      )}
      {(saveError || decideError) && (
        <p className="ff-error" role="alert">
          We could not save that. Please try again.
        </p>
      )}
      <TabState
        loading={isLoading}
        error={error ?? approvals.error}
        count={anything}
        empty="No tasks yet. We will add them here."
      />
      {!isLoading && anything > 0 && isEmpty && <div className="ff-item ff-empty">{emptyText}</div>}
      {!isLoading && topOks.map((row) => <ApprovalCard key={row.id} row={row} onDecide={decide} />)}
      {!isLoading && rows.length > 0 && (
        <div className="ff-card tk-list">
          {rows.map((row) => (
            <TaskCard key={row.id} row={row} onDone={markDone} onSaved={refresh} subtasks={steps.get(row.id)} />
          ))}
        </div>
      )}
      {!isLoading && filter === 'ok' && answered.length > 0 && (
        <>
          <h2 className="ff-h2 tk-answered">Answered</h2>
          {answered.map((row) => (
            <ApprovalCard key={row.id} row={row} onDecide={decide} />
          ))}
        </>
      )}
    </div>
  );
}
