import { useMemo } from 'react';

import { APPROVALS_PROJECT_ID, SERVICE_LINKS, SERVICES, SERVICES_PROJECT_ID } from '@/client';
import { taskStatusOf } from '@/components/portal/TasksTab';
import { planFor } from '@/data/service-plans';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { getFieldValue, getTitle } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';
import { ArrowRight, Check, ExternalLink } from '@/lib/icons';
import type { OnboardingState } from '@/lib/onboarding';
import { serviceStage } from '@/lib/progress';
import type { ServiceStage } from '@/lib/progress';
import { forMyServices } from '@/lib/scope';
import { ALL_SERVICES } from '@/services';

export type HomeTarget = 'kickoff' | 'tasks' | 'files';

/**
 * A service's stages (its milestones, then Live). Wide screens get the full dot track with
 * names; phones get a compact segmented bar with "Step 3 of 7" so long names never squash.
 */
export function Stepper({ progress }: { progress: ServiceStage }) {
  const { stages, at, stage } = progress;
  return (
    <div className="home-stage">
      <ol className="home-stepper" aria-label={`Stage: ${stage}`} style={{ gridTemplateColumns: `repeat(${stages.length}, 1fr)` }}>
        {stages.map((s, i) => (
          <li key={s} className={i < at || progress.live ? 'is-done' : i === at ? 'is-now' : ''}>
            <span className="home-stepper-dot">{i < at || progress.live ? <Check /> : null}</span>
            <span className="home-stepper-label">{s}</span>
          </li>
        ))}
      </ol>
      <div className="home-stage-compact">
        <div className="home-stage-segs">
          {stages.map((s, i) => (
            <span key={s} className={i < at || progress.live ? 'is-done' : i === at ? 'is-now' : ''} />
          ))}
        </div>
        <p className="home-stage-text">
          {progress.live ? (
            'All stages done'
          ) : (
            <>
              Step {at + 1} of {stages.length} · <strong>{stage}</strong>
              {at + 1 < stages.length && <span className="home-stage-next"> then {stages[at + 1]}</span>}
            </>
          )}
        </p>
      </div>
    </div>
  );
}

/** Where one service is: from its tasks, unless the Stage field in "Portal — Services" names a milestone or Live. */
export function stageOfService(serviceRows: GenesisNode[], service: string, taskRows: GenesisNode[]): ServiceStage {
  const row = serviceRows.find((n) => (getTitle(n) ?? '').trim() === service);
  const override = row == null ? null : getFieldValue(row, 'Stage');
  return serviceStage(
    service,
    taskRows.filter((t) => getFieldValue(t, 'Service') === service),
    override,
  );
}

export function HomeTab({
  tasks,
  onboarding,
  onGo,
  onOpenService,
}: {
  tasks: GenesisNode[];
  onboarding: OnboardingState;
  onGo: (target: HomeTarget) => void;
  onOpenService: (service: string) => void;
}) {
  const services = useLiveNodes(SERVICES_PROJECT_ID);
  const approvals = useLiveNodes(APPROVALS_PROJECT_ID);

  const myTasks = useMemo(() => forMyServices(tasks), [tasks]);
  const waitingTasks = myTasks.filter((t) => taskStatusOf(t) === 'Waiting on You');
  const workingTasks = myTasks.filter((t) => taskStatusOf(t) === 'In Progress');
  const pendingApprovals = forMyServices(approvals.nodes).filter(
    (a) => (getFieldValue(a, 'Status') ?? 'Pending') === 'Pending',
  );
  const booked = onboarding.kickoffBookedAt != null && onboarding.kickoffBookedAt !== '';

  // One clear next step, most urgent first.
  const next: { title: string; body: string; action: string; target: HomeTarget } | null = !booked
    ? { title: 'Book your kickoff call', body: 'Thanks for your answers! Pick a time 5 or more days out.', action: 'Pick a time', target: 'kickoff' }
    : pendingApprovals.length > 0
      ? {
          title: `Approve ${pendingApprovals.length === 1 ? getTitle(pendingApprovals[0], 'Item') ?? 'an item' : `${pendingApprovals.length} items`}`,
          body: 'We need your OK before we go further.',
          action: 'Review now',
          target: 'tasks',
        }
      : waitingTasks.length > 0
        ? {
            title: getTitle(waitingTasks[0], 'Task') ?? 'A task is waiting on you',
            body: waitingTasks.length > 1 ? `And ${waitingTasks.length - 1} more waiting on you.` : 'This one is waiting on you.',
            action: 'Open tasks',
            target: 'tasks',
          }
        : null;

  function stageOf(service: string): ServiceStage {
    return stageOfService(services.nodes, service, myTasks);
  }

  function nextStepOf(service: string): string | null {
    const row = services.nodes.find((n) => (getTitle(n) ?? '').trim() === service);
    const text = row == null ? null : getFieldValue(row, 'Next Step');
    return text == null || text === '' ? null : text;
  }

  return (
    <div className="ff-stack">
      {next != null ? (
        <div className="home-next ff-dark">
          <span className="ff-eyebrow">Your next step</span>
          <h2 className="ff-h2" style={{ color: '#fff', marginTop: 10 }}>
            {next.title}
          </h2>
          <p style={{ color: 'var(--ff-on-dark-muted)', margin: '6px 0 16px' }}>{next.body}</p>
          <button type="button" className="ff-btn ff-btn-primary" onClick={() => onGo(next.target)}>
            {next.action} <ArrowRight />
          </button>
        </div>
      ) : (
        <div className="ff-item home-done">
          <Check />
          <div>
            <h2 className="ff-item-title">Nothing is waiting on you.</h2>
            <p className="ff-item-meta">We are working on your projects. We will let you know when we need you.</p>
          </div>
        </div>
      )}

      <h2 className="ff-h2" style={{ marginTop: 16 }}>
        Your services
      </h2>
      {ALL_SERVICES.filter((s) => SERVICES.includes(s.name)).map((s) => {
        const progress = stageOf(s.name);
        const note = nextStepOf(s.name);
        const goal = planFor(s.name)?.milestones.find((m) => m.name === progress.stage)?.goal ?? null;
        const links = SERVICE_LINKS[s.name] ?? [];
        const serviceTasks = myTasks.filter((t) => getFieldValue(t, 'Service') === s.name);
        const serviceDone = serviceTasks.filter((t) => taskStatusOf(t) === 'Done').length;
        return (
          <div key={s.name} className="ff-item ff-lift home-service">
            <button type="button" className="home-service-open" onClick={() => onOpenService(s.name)} aria-label={`Open ${s.name}`} />
            <div className="ff-item-head">
              <h3 className="ff-item-title">{s.name}</h3>
              <span className={progress.live ? 'ff-tag ff-tag-ok' : 'ff-tag'}>{progress.stage}</span>
            </div>
            <Stepper progress={progress} />
            {note != null ? (
              <p className="ff-item-meta">Next: {note}</p>
            ) : (
              goal != null && <p className="ff-item-meta">Now: {goal}</p>
            )}
            <p className="home-service-cta">
              {serviceTasks.length > 0 ? `${serviceDone} of ${serviceTasks.length} tasks done · ` : ''}
              <span className="ff-link">
                See milestones and tasks <ArrowRight />
              </span>
            </p>
            {links.length > 0 && (
              <div className="ff-row-actions" style={{ marginTop: 8 }}>
                {links.map((link) => (
                  <a key={link.url} className="ff-link" href={link.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 15 }}>
                    <ExternalLink style={{ width: 14, height: 14 }} /> {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="home-two">
        <div className="ff-item">
          <h3 className="ff-item-title">
            Waiting on you <span className="home-count">{waitingTasks.length + pendingApprovals.length}</span>
          </h3>
          {waitingTasks.length + pendingApprovals.length === 0 ? (
            <p className="ff-item-meta">Nothing right now.</p>
          ) : (
            <ul className="home-list">
              {pendingApprovals.map((a) => (
                <li key={a.id}>
                  <button type="button" className="ff-link home-list-btn" onClick={() => onGo('tasks')}>
                    Approve: {getTitle(a, 'Item') ?? 'Item'}
                  </button>
                </li>
              ))}
              {waitingTasks.map((t) => (
                <li key={t.id}>
                  <button type="button" className="ff-link home-list-btn" onClick={() => onGo('tasks')}>
                    {getTitle(t, 'Task') ?? 'Task'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="ff-item">
          <h3 className="ff-item-title">We're working on</h3>
          {workingTasks.length === 0 ? (
            <p className="ff-item-meta">{booked ? 'Getting ready for your kickoff.' : 'Waiting for your kickoff call.'}</p>
          ) : (
            <ul className="home-list">
              {workingTasks.map((t) => (
                <li key={t.id}>{getTitle(t, 'Task') ?? 'Task'}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
