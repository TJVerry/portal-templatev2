import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from 'react-oidc-context';

import { APPROVALS_PROJECT_ID, CHURCH_NAME, MESSAGES_PROJECT_ID, TASKS_PROJECT_ID } from '@/client';
import { HomeTab } from '@/components/home/HomeTab';
import type { HomeTarget } from '@/components/home/HomeTab';
import { KickoffPanel } from '@/components/home/KickoffPanel';
import { ServiceView } from '@/components/home/ServiceView';
import { OnboardingFlow, onboardingDone } from '@/components/onboarding/OnboardingFlow';
import { Drawer } from '@/components/portal/Drawer';
import { AvatarFace, PortalNav } from '@/components/portal/PortalNav';
import type { NavTab } from '@/components/portal/PortalNav';
import { PortalStyles } from '@/components/portal/PortalStyles';
import { BillingTab } from '@/components/portal/BillingTab';
import { ChatTab } from '@/components/portal/ChatTab';
import { FilesTab } from '@/components/portal/FilesTab';
import { ProfileTab } from '@/components/portal/ProfileTab';
import { ResultsIcon, ResultsTab } from '@/components/portal/ResultsTab';
import { TasksTab, taskStatusOf } from '@/components/portal/TasksTab';
import { AGENCY_NAME } from '@/config';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { isAgencyEmail, isFromAgency, readSeen, writeSeen } from '@/lib/chat';
import { getFieldValue } from '@/lib/genesis-data';
import {
  CalendarCheck,
  FolderOpen,
  House,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  MessageCircle,
} from '@/lib/icons';
import { LOGO_DARK_SRC } from '@/lib/logo-dark';
import { useOnboarding } from '@/lib/onboarding';
import { nameOf, registerUser, useProfile } from '@/lib/profile';
import { PeopleProvider } from '@/lib/people';
import { PortalNavContext } from '@/lib/portal-nav';
import type { ServiceTarget } from '@/lib/portal-nav';
import { forMyServices } from '@/lib/scope';
import { TaskCommentsProvider } from '@/lib/task-comments';
import { scrollPortalTop } from '@/lib/use-phone';

/** Profile and Billing are reached from the menu (Account), not the tab row. */
type Tab = 'home' | 'results' | 'billing' | 'profile' | 'chat' | HomeTarget;

const ACCOUNT_TITLES: Partial<Record<Tab, string>> = { billing: 'Billing', profile: 'Your profile' };

/** Desktop sidebar folded to icons. Remembered per browser; storage can be blocked, so default to open. */
const SIDE_KEY = 'ff-side-collapsed';

function readSideCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeSideCollapsed(value: boolean): void {
  try {
    localStorage.setItem(SIDE_KEY, value ? '1' : '0');
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
}

export default function PortalPage({ email, name }: { email: string; name: string | null }) {
  const auth = useAuth();
  const onboarding = useOnboarding();
  const tasks = useLiveNodes(TASKS_PROJECT_ID);
  const approvals = useLiveNodes(APPROVALS_PROJECT_ID);
  // Chat re-checks every 10 seconds (a cheap "anything new?" call) so replies show up without a refresh.
  const messages = useLiveNodes(MESSAGES_PROJECT_ID, { refreshEveryMs: 10_000, minGapOnReturnMs: 3_000 });
  const [chatSeen, setChatSeen] = useState(readSeen);
  const [tab, setTabState] = useState<Tab | null>(null);
  // A service opened from Home. Shown in place of the Home tab until closed.
  const [openService, setOpenService] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sideCollapsed, setSideCollapsed] = useState(readSideCollapsed);
  const toggleSide = () => {
    setSideCollapsed((v) => {
      writeSideCollapsed(!v);
      return !v;
    });
  };
  const setTab = (t: Tab) => {
    setOpenService(null);
    setTabState(t);
    setMenuOpen(false);
    scrollPortalTop(false);
  };
  // Where a service page opens: which board and which column. `nav` changes on every jump so the page reopens there.
  const [serviceTarget, setServiceTarget] = useState<{ view: ServiceTarget['view']; focus: string | null; nav: number }>({
    view: 'milestones',
    focus: null,
    nav: 0,
  });
  /** Opens a service page (from Home, or a task's Service, Milestone or Status chip). */
  const goToService = useCallback((target: ServiceTarget) => {
    setTabState('home');
    setMenuOpen(false);
    setOpenService(target.service);
    setServiceTarget((t) => ({ view: target.view, focus: target.focus, nav: t.nav + 1 }));
    scrollPortalTop(false);
  }, []);
  const [onboardingPct, setOnboardingPct] = useState(0);
  const signOut = () => void auth.removeUser();
  // The name saved in "Your details" wins over the name Taskade has for them.
  const me = useProfile(email, name);
  const fullName = nameOf(me.profile) !== '' ? nameOf(me.profile) : (name ?? '');
  const firstName = me.profile.firstName !== '' ? me.profile.firstName : (fullName.split(' ')[0] ?? '');
  const photoUrl = me.profile.photoUrl;

  // First visit: add them to Portal — Users (once per page load) so others can assign them tasks.
  const registered = useRef(false);
  useEffect(() => {
    if (me.loading || me.rowId != null || registered.current) return;
    registered.current = true;
    void registerUser(email, me.profile).then(me.refresh);
  }, [me.loading, me.rowId, me.profile, me.refresh, email]);

  // Signed in: forget the sign-in attempt flag the sign-in page uses for its error message.
  useEffect(() => {
    try {
      sessionStorage.removeItem('ff-signin-tried');
    } catch {
      // Storage blocked: nothing to clear.
    }
  }, []);

  const done = onboardingDone(onboarding.status);
  const ready = done && !onboarding.loading;
  const booked = onboarding.kickoffBookedAt != null && onboarding.kickoffBookedAt !== '';
  // Right after onboarding, land on booking. Otherwise land on Home.
  const current: Tab = tab ?? (done && !booked ? 'kickoff' : 'home');

  const myTasks = useMemo(() => forMyServices(tasks.nodes), [tasks.nodes]);
  const waitingCount = myTasks.filter((row) => taskStatusOf(row) === 'Waiting on You').length;
  const pendingCount = forMyServices(approvals.nodes).filter(
    (row) => (getFieldValue(row, 'Status') ?? 'Pending') === 'Pending',
  ).length;

  // Unread = Faith Funnels messages this browser has not seen. Opening Chat marks them seen.
  const agencyCount = messages.nodes.filter(isFromAgency).length;
  const unreadCount = current === 'chat' ? 0 : Math.max(agencyCount - chatSeen, 0);
  useEffect(() => {
    if (current !== 'chat' || messages.loading || agencyCount === chatSeen) return;
    writeSeen(agencyCount);
    setChatSeen(agencyCount);
  }, [current, messages.loading, agencyCount, chatSeen]);

  const tabs: (NavTab<Tab> & { short: string })[] = [
    { id: 'home', label: 'Home', short: 'Home', icon: <House />, badge: 0 },
    ...(!booked
      ? [{ id: 'kickoff' as Tab, label: 'Kickoff call', short: 'Kickoff', icon: <CalendarCheck />, badge: 1 }]
      : []),
    { id: 'results', label: 'Results', short: 'Results', icon: <ResultsIcon />, badge: 0 },
    { id: 'tasks', label: 'Tasks', short: 'Tasks', icon: <ListChecks />, badge: waitingCount + pendingCount },
    { id: 'files', label: 'Files', short: 'Files', icon: <FolderOpen />, badge: 0 },
    { id: 'chat', label: 'Chat', short: 'Chat', icon: <MessageCircle />, badge: unreadCount },
  ];
  const pageTitle = ACCOUNT_TITLES[current] ?? tabs.find((t) => t.id === current)?.label;

  const navProps = {
    tabs,
    current,
    onSelect: (id: Tab) => setTab(id),
    onSignOut: signOut,
    name: fullName,
    email,
    photoUrl,
  };

  return (
    <div className={ready ? `ff-shell pp-shell pp-shell-nav${sideCollapsed ? ' pp-side-collapsed' : ''}` : 'ff-shell pp-shell'}>
      <PortalStyles />
      <header className="ff-top">
        {/* Progress bar shows during onboarding only, not on the homepage. */}
        {!onboarding.loading && !done && (
          <div
            className="ff-progress"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={onboardingPct}
            aria-label="Onboarding progress"
          >
            <div className="ff-progress-fill" style={{ width: `${Math.max(onboardingPct, 3)}%` }} />
          </div>
        )}
        <div className="ff-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className="ff-btn ff-btn-ghost ff-btn-sm pp-menu-btn"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <Menu />
            </button>
            <img className="ff-logo" src={LOGO_DARK_SRC} alt={AGENCY_NAME} />
          </div>
          <div className="pp-top-actions">
            {ready ? (
              <>
                <button
                  type="button"
                  className="pp-avatar-btn"
                  aria-label="Your profile"
                  title="Your profile"
                  aria-current={current === 'profile' ? 'page' : undefined}
                  onClick={() => setTab('profile')}
                >
                  <AvatarFace name={fullName} email={email} photoUrl={photoUrl} />
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ff-btn ff-btn-ghost ff-btn-sm" onClick={signOut}>
                  <LogOut /> Sign out
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {ready && (
        <aside className="pp-side" aria-label="Portal menu">
          <PortalNav variant="side" {...navProps} collapsed={sideCollapsed} onToggleCollapsed={toggleSide} />
        </aside>
      )}

      <div className="ff-body ff-body-top">
        {onboarding.loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
            <Loader2 className="ff-spin" style={{ width: 32, height: 32, color: 'var(--ff-orange)' }} />
          </div>
        ) : !done ? (
          <OnboardingFlow
            email={email}
            fullName={fullName}
            firstName={firstName}
            onboarding={onboarding}
            menuOpen={menuOpen}
            onMenuClose={() => setMenuOpen(false)}
            onProgress={setOnboardingPct}
            onSignOut={signOut}
          />
        ) : (
          <section className="ff-col-wide pt-wide ff-enter">
            <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title={CHURCH_NAME}>
              <PortalNav variant="drawer" {...navProps} />
            </Drawer>
            {/* The welcome shows on Home only; other pages get a plain page title. A service page has its own heading. */}
            <div className={current === 'home' && openService == null ? 'pp-hero' : 'pp-hero pp-hero-sub'}>
              <span className="ff-eyebrow">{CHURCH_NAME}</span>
              <h1 className="ff-h1">
                Welcome{firstName !== '' ? ', ' : ' '}
                <span className="ff-box">{firstName !== '' ? firstName : 'back'}</span>
              </h1>
            </div>
            {current !== 'home' && <h1 className="ff-h1 pp-page-title">{pageTitle}</h1>}

            <div className="ff-tabs" role="tablist" aria-label="Portal sections">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={current === t.id}
                  className="ff-tab"
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                  {t.badge > 0 && t.id !== 'kickoff' && <span className="pp-badge">{t.badge}</span>}
                </button>
              ))}
            </div>

            <PortalNavContext.Provider value={goToService}>
            <PeopleProvider messages={messages} me={{ email, name: fullName, photoUrl }}>
            <TaskCommentsProvider messages={messages} email={email} name={fullName}>
              <div role="tabpanel" key={`${current}-${openService ?? ''}-${serviceTarget.nav}`} className="ff-enter pp-panel">
              {current === 'home' && openService != null && (
                <ServiceView
                  service={openService}
                  tasks={tasks}
                  admin={isAgencyEmail(email)}
                  initialView={serviceTarget.view}
                  focus={serviceTarget.focus}
                  onBack={() => {
                    setOpenService(null);
                    scrollPortalTop(false);
                  }}
                />
              )}
              {current === 'home' && openService == null && (
                <HomeTab
                  tasks={tasks.nodes}
                  onboarding={onboarding}
                  onGo={(t) => setTab(t)}
                  onOpenService={(s) => goToService({ service: s, view: 'milestones', focus: null })}
                />
              )}
              {current === 'kickoff' && <KickoffPanel email={email} name={fullName} onboarding={onboarding} />}
              {current === 'results' && <ResultsTab />}
              {current === 'tasks' && <TasksTab tasks={tasks} approvals={approvals} email={email} service={null} />}
              {current === 'files' && <FilesTab email={email} />}
              {current === 'chat' && <ChatTab email={email} name={fullName} messages={messages} />}
              {current === 'billing' && <BillingTab email={email} />}
              {current === 'profile' && (
                <ProfileTab
                  email={email}
                  name={fullName}
                  onboarding={onboarding}
                  me={me}
                  onBilling={() => setTab('billing')}
                  onSignOut={signOut}
                />
              )}
              </div>
            </TaskCommentsProvider>
            </PeopleProvider>
            </PortalNavContext.Provider>
          </section>
        )}
      </div>

      {ready && (
        <nav className="pp-tabbar" aria-label="Portal sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className="pp-tabbar-btn"
              aria-current={current === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              <span className="pp-tabbar-icon">
                {t.icon}
                {t.badge > 0 && (
                  <span className="pp-tabbar-badge" aria-label={t.id === 'kickoff' ? 'Needs you' : `${t.badge} waiting`}>
                    {t.id === 'kickoff' ? '' : t.badge}
                  </span>
                )}
              </span>
              <span className="pp-tabbar-label">{t.short}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
