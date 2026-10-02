import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, DragEvent, KeyboardEvent, PointerEvent } from 'react';

import { SERVICE_LINKS, SERVICES_PROJECT_ID, TASKS_PROJECT_ID } from '@/client';
import { Stepper, stageOfService } from '@/components/home/HomeTab';
import { TabState } from '@/components/portal/TabState';
import { STATUS_ORDER, statusLabel, TaskCard, taskStatusOf, useMyName } from '@/components/portal/TasksTab';
import { milestonesOf, planFor } from '@/data/service-plans';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { updateNode } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, Clock, ExternalLink } from '@/lib/icons';
import { milestoneLabel, milestoneOf, NO_MILESTONE, planOrderOf } from '@/lib/progress';
import { forService } from '@/lib/scope';
import { addTaskHistory, markTaskDone, subtasksByParent } from '@/lib/task-detail';
import { usePhone } from '@/lib/use-phone';
import { ALL_SERVICES } from '@/services';

type Column = { key: string; label: string; goal: string | null; rows: GenesisNode[] };

/** Plan milestones in plan order, then free-typed milestones, then "Other tasks". */
function byMilestone(rows: GenesisNode[], service: string): Column[] {
  const plan = planFor(service);
  const groups = new Map<string, GenesisNode[]>();
  for (const row of rows) {
    const key = milestoneOf(row);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const planned = milestonesOf(service);
  const extra = [...groups.keys()]
    .filter((key) => !planned.includes(key) && key !== NO_MILESTONE)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const keys = [...planned.filter((key) => groups.has(key)), ...extra, ...(groups.has(NO_MILESTONE) ? [NO_MILESTONE] : [])];
  return keys.map((key) => ({
    key,
    label: milestoneLabel(key),
    goal: plan?.milestones.find((m) => m.name === key)?.goal ?? null,
    rows: (groups.get(key) ?? []).sort(
      (a, b) =>
        planOrderOf(a) - planOrderOf(b) || STATUS_ORDER.indexOf(taskStatusOf(a)) - STATUS_ORDER.indexOf(taskStatusOf(b)),
    ),
  }));
}

/** Board columns left to right, the way work moves. */
const BOARD_ORDER = ['Backlog', 'To Do', 'In Progress', 'Waiting on You', 'Done'];
/** These columns show only when a task has that status. */
const OPTIONAL_STATUSES = ['Backlog'];

/** Color class for a status column: Backlog grey, To Do blue, In Progress yellow, Waiting purple, Done green. */
function statusTone(status: string): string {
  if (status === 'Backlog') return 'kb-st-grey';
  if (status === 'To Do') return 'kb-st-blue';
  if (status === 'In Progress') return 'kb-st-yellow';
  if (status.startsWith('Waiting')) return 'kb-st-purple';
  if (status === 'Done') return 'kb-st-green';
  return 'kb-st-grey';
}

/** `statusOf` lets the board show a dragged card in its new column before the save comes back. */
function byStatus(rows: GenesisNode[], statusOf: (row: GenesisNode) => string): Column[] {
  const used = new Set(rows.map(statusOf));
  const order = BOARD_ORDER.filter((status) => !OPTIONAL_STATUSES.includes(status) || used.has(status));
  return order.map((status) => ({
    key: status,
    label: statusLabel(status),
    goal: null,
    rows: rows.filter((row) => statusOf(row) === status).sort((a, b) => planOrderOf(a) - planOrderOf(b)),
  }));
}

/** Board sizes the church can drag. Both are saved in this browser. */
const COL_DEFAULT = 280;
const COL_MIN = 240;
const COL_MAX = 560;
const COL_KEY = 'ff-kb-col-width';
const EXTRA_KEY = 'ff-kb-extra-width';
const FOLDED_KEY = 'ff-kb-folded';

function loadFolded(): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(FOLDED_KEY) ?? '[]');
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function clampCol(width: number): number {
  return Math.min(COL_MAX, Math.max(COL_MIN, Math.round(width)));
}

function loadNumber(key: string): number {
  try {
    const saved = Number(localStorage.getItem(key));
    return saved > 0 ? Math.round(saved) : 0;
  } catch {
    return 0;
  }
}

function saveNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage is blocked. The size still works for this visit.
  }
}

/**
 * One service: its stage, its milestones, and its tasks. Opened from a Home service card.
 * Wide screens show a board. Phones stack the groups; only the current milestone
 * (and anything waiting on the church) starts open, the rest open with a tap.
 * `admin` (a Faith Funnels person) can drag cards between Status columns to change a task's Status.
 */
export function ServiceView({
  service,
  tasks,
  admin = false,
  initialView = 'milestones',
  focus = null,
  onBack,
}: {
  service: string;
  tasks: ReturnType<typeof useLiveNodes>;
  admin?: boolean;
  /** Board to open on. A task's Status chip opens "status", its Milestone chip "milestones". */
  initialView?: 'milestones' | 'status';
  /** Column (milestone or Status) to scroll to and open, then flash once. */
  focus?: string | null;
  onBack: () => void;
}) {
  const services = useLiveNodes(SERVICES_PROJECT_ID);
  const phone = usePhone();
  const [view, setView] = useState<'milestones' | 'status'>(initialView);
  // Groups the person opened or closed on a phone. Unset groups follow the default. The focused one starts open.
  const [toggled, setToggled] = useState<Record<string, boolean>>(() => (focus != null ? { [`${initialView}:${focus}`]: true } : {}));
  // Columns folded into a thin strip on wide screens. Saved per service and view in this browser.
  const [folded, setFolded] = useState<string[]>(loadFolded);
  const [saveError, setSaveError] = useState(false);
  const { nodes, loading, error, refresh } = tasks;
  const rows = useMemo(() => forService(nodes, service), [nodes, service]);
  const steps = useMemo(() => subtasksByParent(nodes), [nodes]);
  const me = useMyName();

  // Admin drag and drop on the Status board. `moved` holds new statuses until the save comes back.
  const [moved, setMoved] = useState<Record<string, string>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropKey, setDropKey] = useState<string | null>(null);
  const canDrag = admin && view === 'status' && !phone;
  const statusOf = (row: GenesisNode) => moved[row.id] ?? taskStatusOf(row);

  // Column width: the drag bar on each column's right edge.
  const [colWidth, setColWidthState] = useState(() => clampCol(loadNumber(COL_KEY) || COL_DEFAULT));
  const [resizing, setResizing] = useState(false);
  const colDrag = useRef<{ x: number; width: number } | null>(null);
  // Extra board width past the page column: the drag bars on the board's left and right edges.
  const [extra, setExtraState] = useState(() => loadNumber(EXTRA_KEY));
  const [stretching, setStretching] = useState(false);
  const edgeDrag = useRef<{ x: number; extra: number; side: 1 | -1 } | null>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  // Soft fade on a board edge when more columns are hidden past it.
  const kbRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  function updateFade() {
    const el = kbRef.current;
    if (el == null) return;
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setFade((f) => (f.left === left && f.right === right ? f : { left, right }));
  }

  function setColWidth(width: number) {
    const next = clampCol(width);
    setColWidthState(next);
    saveNumber(COL_KEY, next);
  }

  function toggleFold(id: string) {
    const next = folded.includes(id) ? folded.filter((f) => f !== id) : [...folded, id];
    setFolded(next);
    try {
      localStorage.setItem(FOLDED_KEY, JSON.stringify(next));
    } catch {
      // Storage is blocked. The fold still works for this visit.
    }
  }

  /** Most extra width that still fits the page body, with a 16px gutter each side. */
  function maxExtra(): number {
    const stack = stackRef.current;
    if (stack == null) return 0;
    const body = stack.closest('.ff-body') ?? document.documentElement;
    return Math.max(0, body.clientWidth - 32 - stack.clientWidth);
  }

  function setExtra(value: number) {
    const next = Math.min(maxExtra(), Math.max(0, Math.round(value)));
    setExtraState(next);
    saveNumber(EXTRA_KEY, next);
  }

  // Keep the board inside the page when the window gets smaller.
  useEffect(() => {
    const fit = () => setExtraState((current) => Math.min(current, maxExtra()));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // Opened from a task chip: bring that column into view once the tasks are in, and flash it.
  const focusDone = useRef(false);
  useEffect(() => {
    if (focus == null || focusDone.current || loading) return;
    const col = kbRef.current?.querySelector<HTMLElement>(`[data-col="${CSS.escape(focus)}"]`);
    if (col == null) return;
    focusDone.current = true;
    col.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [focus, loading, rows.length]);

  useEffect(() => {
    updateFade();
    const el = kbRef.current;
    if (el == null || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);
    return () => observer.disconnect();
  }, [view, loading, rows.length, colWidth, extra, phone]);

  function startColDrag(event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    colDrag.current = { x: event.clientX, width: colWidth };
    setResizing(true);
  }

  function moveColDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = colDrag.current;
    if (drag != null) setColWidth(drag.width + event.clientX - drag.x);
  }

  function endColDrag() {
    colDrag.current = null;
    setResizing(false);
  }

  function keyCol(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 80 : 20;
    if (event.key === 'ArrowRight') setColWidth(colWidth + step);
    else if (event.key === 'ArrowLeft') setColWidth(colWidth - step);
    else if (event.key === 'Home') setColWidth(COL_MIN);
    else if (event.key === 'End') setColWidth(COL_MAX);
    else return;
    event.preventDefault();
  }

  function startEdgeDrag(side: 1 | -1, event: PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    edgeDrag.current = { x: event.clientX, extra, side };
    setStretching(true);
  }

  function moveEdgeDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = edgeDrag.current;
    // The board grows on both sides, so each pixel of drag adds two pixels of width.
    if (drag != null) setExtra(drag.extra + (event.clientX - drag.x) * drag.side * 2);
  }

  function endEdgeDrag() {
    edgeDrag.current = null;
    setStretching(false);
  }

  function keyEdge(side: 1 | -1, event: KeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 160 : 40;
    if (event.key === 'ArrowRight') setExtra(extra + step * side);
    else if (event.key === 'ArrowLeft') setExtra(extra - step * side);
    else if (event.key === 'Home') setExtra(0);
    else if (event.key === 'End') setExtra(maxExtra());
    else return;
    event.preventDefault();
  }

  function edgeHandle(side: 1 | -1) {
    return (
      <div
        className={side === 1 ? 'kb-edge kb-edge-right' : 'kb-edge kb-edge-left'}
        role="separator"
        aria-orientation="vertical"
        aria-label="Drag to make the board wider or narrower"
        aria-valuemin={0}
        aria-valuenow={extra}
        tabIndex={0}
        title="Drag to make the board wider. Double-click to reset."
        onPointerDown={(event) => startEdgeDrag(side, event)}
        onPointerMove={moveEdgeDrag}
        onPointerUp={endEdgeDrag}
        onPointerCancel={endEdgeDrag}
        onDoubleClick={() => setExtra(0)}
        onKeyDown={(event) => keyEdge(side, event)}
      >
        <span />
      </div>
    );
  }

  const columns = view === 'milestones' ? byMilestone(rows, service) : byStatus(rows, statusOf);
  const doneCount = rows.filter((row) => taskStatusOf(row) === 'Done').length;
  const progress = stageOfService(services.nodes, service, rows);
  const blurb = ALL_SERVICES.find((s) => s.name === service)?.blurb;
  const timeline = planFor(service)?.timeline;
  const links = SERVICE_LINKS[service as keyof typeof SERVICE_LINKS] ?? [];

  function startsOpen(col: Column): boolean {
    if (view === 'status') return col.key !== 'Done';
    if (col.rows.some((row) => taskStatusOf(row) === 'Waiting on You')) return true;
    return col.key === progress.stage || (col.key === NO_MILESTONE && col.rows.some((row) => taskStatusOf(row) !== 'Done'));
  }

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

  async function moveTask(id: string, status: string) {
    const row = rows.find((r) => r.id === id);
    if (row == null || statusOf(row) === status) return;
    setSaveError(false);
    setMoved((m) => ({ ...m, [id]: status }));
    try {
      await updateNode(TASKS_PROJECT_ID, id, { Status: status });
      await addTaskHistory(TASKS_PROJECT_ID, row, `Moved to ${statusLabel(status)} by ${me}`);
      await refresh();
    } catch (err) {
      console.error('Task move failed', err);
      setSaveError(true);
    } finally {
      setMoved(({ [id]: _, ...rest }) => rest);
    }
  }

  function startCardDrag(id: string, event: DragEvent<HTMLDivElement>) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', id);
    setDragId(id);
  }

  function endCardDrag() {
    setDragId(null);
    setDropKey(null);
  }

  /** Drop target for a Status column (open or folded). Nothing when the person cannot drag. */
  function dropProps(key: string) {
    if (!canDrag) return {};
    return {
      onDragOver: (event: DragEvent<HTMLElement>) => {
        if (dragId == null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        if (dropKey !== key) setDropKey(key);
      },
      onDragLeave: (event: DragEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropKey((k) => (k === key ? null : k));
      },
      onDrop: (event: DragEvent<HTMLElement>) => {
        event.preventDefault();
        const id = event.dataTransfer.getData('text/plain') || dragId;
        endCardDrag();
        if (id != null && id !== '') void moveTask(id, key);
      },
    };
  }

  return (
    <div className="ff-stack" ref={stackRef}>
      <button type="button" className="ff-btn ff-btn-ghost ff-btn-sm sv-back" onClick={onBack}>
        <ArrowLeft /> All services
      </button>

      <div className="ff-item">
        <div className="ff-item-head">
          <div>
            <h2 className="ff-h2">{service}</h2>
            {blurb != null && <p className="ff-item-meta">{blurb}</p>}
          </div>
          <span className={progress.live ? 'ff-tag ff-tag-ok' : 'ff-tag'}>{progress.stage}</span>
        </div>
        <Stepper progress={progress} />
        {rows.length > 0 && (
          <div className="ob-progress sv-progress">
            <div className="ob-bigbar">
              <span style={{ width: `${(doneCount / rows.length) * 100}%` }} />
            </div>
            <span className="ob-progress-text">
              {doneCount} of {rows.length} done
            </span>
          </div>
        )}
        {timeline != null && (
          <p className="ff-item-meta sv-timeline">
            <Clock aria-hidden="true" /> {timeline}
          </p>
        )}
        {links.length > 0 && (
          <div className="ff-row-actions" style={{ marginTop: 12 }}>
            {links.map((link) => (
              <a key={link.url} className="ff-link sv-link" href={link.url} target="_blank" rel="noreferrer">
                <ExternalLink /> {link.label}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="sv-bar">
        <h3 className="ff-h2">Your plan</h3>
        <div className="sv-toggle" role="group" aria-label="Group tasks by">
          <button type="button" aria-pressed={view === 'milestones'} onClick={() => setView('milestones')}>
            Milestones
          </button>
          <button type="button" aria-pressed={view === 'status'} onClick={() => setView('status')}>
            Status
          </button>
        </div>
      </div>

      {canDrag && <p className="ff-small kb-hint">Admin: drag a card to another column to change its status.</p>}
      {saveError && (
        <p className="ff-error" role="alert">
          We could not save that. Please try again.
        </p>
      )}
      <TabState loading={loading} error={error} count={rows.length} empty="No tasks yet. We will add your plan here soon." />

      {!loading && rows.length > 0 && (
        <div
          className={stretching ? 'kb-wrap kb-stretching' : 'kb-wrap'}
          style={phone ? undefined : ({ '--kb-extra': `${extra}px` } as CSSProperties)}
        >
        {!phone && edgeHandle(-1)}
        <div
          ref={kbRef}
          className={`kb${resizing ? ' kb-resizing' : ''}${fade.left ? ' kb-fade-l' : ''}${fade.right ? ' kb-fade-r' : ''}`}
          style={phone ? undefined : ({ '--kb-col-w': `${colWidth}px` } as CSSProperties)}
          onScroll={updateFade}
          role="list"
          aria-label={view === 'milestones' ? 'Milestones' : 'Task status'}
        >
          {columns.map((col, i) => {
            const colDone = col.rows.filter((row) => statusOf(row) === 'Done').length;
            const dropping = canDrag && dropKey === col.key ? ' kb-drop' : '';
            const complete = view === 'milestones' && col.rows.length > 0 && colDone === col.rows.length;
            const isNow = view === 'milestones' && col.key === progress.stage;
            const open = !phone || (toggled[`${view}:${col.key}`] ?? startsOpen(col));
            const bodyId = `sv-col-${view}-${i}`;
            const foldId = `${service}|${view}|${col.key}`;
            const count = view === 'milestones' ? `${colDone}/${col.rows.length}` : col.rows.length;
            if (!phone && folded.includes(foldId)) {
              return (
                <section
                  key={col.key}
                  data-col={col.key}
                  className={`kb-col kb-col-folded${complete ? ' kb-col-done' : ''}${isNow ? ' kb-col-now' : ''}${dropping}`}
                  role="listitem"
                  aria-label={col.label}
                  {...dropProps(col.key)}
                >
                  <button
                    type="button"
                    className="kb-unfold"
                    aria-expanded={false}
                    title={`Open ${col.label}`}
                    onClick={() => toggleFold(foldId)}
                  >
                    <ChevronRight className="kb-fold-icon" aria-hidden="true" />
                    <span className="kb-count">{count}</span>
                    <span className="kb-fold-title">{col.label}</span>
                  </button>
                </section>
              );
            }
            const head = (
              <>
                {view === 'milestones' && (
                  <span className="kb-num" aria-hidden="true">
                    {complete ? <Check /> : i + 1}
                  </span>
                )}
                <span className="kb-head-text">
                  <span className="kb-title">{col.label}</span>
                  {isNow && <span className="kb-now">Now</span>}
                </span>
                <span className="kb-count">{count}</span>
                {phone && <ChevronDown className="kb-chevron" aria-hidden="true" />}
                {!phone && (
                  <button
                    type="button"
                    className="kb-fold"
                    aria-expanded={true}
                    aria-label={`Collapse ${col.label}`}
                    title={`Collapse ${col.label}`}
                    onClick={() => toggleFold(foldId)}
                  >
                    <ChevronLeft className="kb-fold-icon" aria-hidden="true" />
                  </button>
                )}
              </>
            );
            return (
              <section
                key={col.key}
                data-col={col.key}
                className={`kb-col${complete ? ' kb-col-done' : ''}${isNow ? ' kb-col-now' : ''}${open ? '' : ' kb-col-closed'}${view === 'status' ? ` kb-st ${statusTone(col.key)}` : ''}${view === initialView && col.key === focus ? ' kb-col-focus' : ''}${dropping}`}
                role="listitem"
                aria-label={col.label}
                {...dropProps(col.key)}
              >
                {phone ? (
                  <button
                    type="button"
                    className="kb-head kb-head-btn"
                    aria-expanded={open}
                    aria-controls={bodyId}
                    onClick={() => setToggled((t) => ({ ...t, [`${view}:${col.key}`]: !open }))}
                  >
                    {head}
                  </button>
                ) : (
                  <header className="kb-head">{head}</header>
                )}
                {view === 'milestones' && (
                  <div className="kb-bar">
                    <span style={{ width: `${col.rows.length === 0 ? 0 : (colDone / col.rows.length) * 100}%` }} />
                  </div>
                )}
                {open && (
                  <div className="kb-cards" id={bodyId}>
                    {col.goal != null && <p className="kb-goal">{col.goal}</p>}
                    {col.rows.length === 0 ? (
                      <p className="kb-empty">Nothing here.</p>
                    ) : (
                      col.rows.map((row) => {
                        const card = (
                          <TaskCard
                            key={row.id}
                            row={row}
                            onDone={markDone}
                            onSaved={refresh}
                            compact
                            subtasks={steps.get(row.id)}
                            sub={view === 'status' ? milestoneLabel(milestoneOf(row)) : null}
                          />
                        );
                        if (!canDrag) return card;
                        return (
                          <div
                            key={row.id}
                            className={`kb-drag${dragId === row.id ? ' kb-dragging' : ''}${moved[row.id] != null ? ' kb-saving' : ''}`}
                            draggable
                            onDragStart={(event) => startCardDrag(row.id, event)}
                            onDragEnd={endCardDrag}
                          >
                            {card}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
                {!phone && (
                  <div
                    className="kb-resize"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Drag to make columns wider or narrower"
                    aria-valuemin={COL_MIN}
                    aria-valuemax={COL_MAX}
                    aria-valuenow={colWidth}
                    tabIndex={0}
                    title="Drag to resize columns. Double-click to reset."
                    onPointerDown={startColDrag}
                    onPointerMove={moveColDrag}
                    onPointerUp={endColDrag}
                    onPointerCancel={endColDrag}
                    onDoubleClick={() => setColWidth(COL_DEFAULT)}
                    onKeyDown={keyCol}
                  />
                )}
              </section>
            );
          })}
        </div>
        {!phone && edgeHandle(1)}
        </div>
      )}
    </div>
  );
}
