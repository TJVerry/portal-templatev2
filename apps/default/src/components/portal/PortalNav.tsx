import type { ReactNode } from 'react';

import { CHURCH_NAME } from '@/client';
import { AGENCY_NAME, SUPPORT_EMAIL } from '@/config';
import { ChevronRight, CreditCard, LifeBuoy, LogOut, PanelLeftClose, PanelLeftOpen, User } from '@/lib/icons';
import { LOGO_DARK_SRC } from '@/lib/logo-dark';

export interface NavTab<T extends string> {
  id: T;
  label: string;
  icon: ReactNode;
  badge: number;
}

/** Two letters for the avatar: first + last name, else the start of the email. */
export function initialsOf(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter((p) => p !== '');
  const first = parts[0] ?? '';
  const last = parts.length >= 2 ? (parts[parts.length - 1] ?? '') : '';
  const letters = last !== '' ? first.slice(0, 1) + last.slice(0, 1) : first !== '' ? first.slice(0, 2) : email.slice(0, 2);
  return letters !== '' ? letters.toUpperCase() : '?';
}

/** Inside a round avatar: their photo when they added one, else initials. */
export function AvatarFace({ name, email, photoUrl = '' }: { name: string; email: string; photoUrl?: string }) {
  return photoUrl !== '' ? <img className="pp-avatar-img" src={photoUrl} alt="" /> : <>{initialsOf(name, email)}</>;
}

/**
 * The portal menu. Desktop: a sidebar (`side`) that can fold down to an icon rail.
 * Tablet and phone: the same content inside the slide-in Drawer (`drawer`). Main sections up top, account at the bottom.
 */
export function PortalNav<T extends string>({
  variant,
  tabs,
  current,
  onSelect,
  onSignOut,
  name,
  email,
  photoUrl = '',
  collapsed = false,
  onToggleCollapsed,
}: {
  variant: 'side' | 'drawer';
  tabs: NavTab<T>[];
  current: string;
  onSelect: (id: T | 'profile' | 'billing') => void;
  onSignOut: () => void;
  name: string;
  email: string;
  /** Profile photo link. Empty shows initials. */
  photoUrl?: string;
  /** Side only: icons only. Labels move to tooltips. */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}) {
  const folded = variant === 'side' && collapsed;

  const item = (id: string, label: string, icon: ReactNode, onClick: () => void, badge?: ReactNode) => (
    <button
      key={id}
      type="button"
      className="pn-item"
      aria-current={current === id ? 'page' : undefined}
      aria-label={folded ? label : undefined}
      title={folded ? label : undefined}
      onClick={onClick}
    >
      <span className="pn-icon">{icon}</span>
      <span className="pn-text">{label}</span>
      {badge}
    </button>
  );

  return (
    <div className={`pn pn-${variant}${folded ? ' pn-collapsed' : ''}`}>
      {variant === 'side' && (
        <div className="pn-brand">
          <div className="pn-brand-row">
            <img className="ff-logo pn-logo" src={LOGO_DARK_SRC} alt={AGENCY_NAME} />
            {onToggleCollapsed != null && (
              <button
                type="button"
                className="pn-collapse"
                onClick={onToggleCollapsed}
                aria-expanded={!folded}
                aria-label={folded ? 'Expand menu' : 'Collapse menu'}
                title={folded ? 'Expand menu' : 'Collapse menu'}
              >
                {folded ? <PanelLeftOpen /> : <PanelLeftClose />}
              </button>
            )}
          </div>
          <span className="pn-church" title={CHURCH_NAME}>
            {CHURCH_NAME}
          </span>
        </div>
      )}

      <div className="pn-group">
        <span className="pn-label">Menu</span>
        {tabs.map((t) =>
          item(
            t.id,
            t.label,
            t.icon,
            () => onSelect(t.id),
            t.badge > 0 &&
              (t.id === 'kickoff' ? (
                <span className="pn-dot" aria-label="Needs you" />
              ) : (
                <span className="pp-badge" aria-label={`${t.badge} waiting`}>
                  {t.badge}
                </span>
              )),
          ),
        )}
      </div>

      <div className="pn-group">
        <span className="pn-label">Account</span>
        {item('profile', 'Profile', <User />, () => onSelect('profile'))}
        {item('billing', 'Billing', <CreditCard />, () => onSelect('billing'))}
        {item('help', 'Need help?', <LifeBuoy />, () => {
          window.location.href = `mailto:${SUPPORT_EMAIL}`;
        })}
      </div>

      <div className="pn-foot">
        <button
          type="button"
          className="pn-me"
          aria-label="Open your profile"
          title={folded ? `${name !== '' ? name : 'Your profile'} · ${email}` : undefined}
          onClick={() => onSelect('profile')}
        >
          <span className="pn-avatar" aria-hidden="true">
            <AvatarFace name={name} email={email} photoUrl={photoUrl} />
          </span>
          <span className="pn-me-text">
            <span className="pn-me-name">{name !== '' ? name : 'Your profile'}</span>
            <span className="pn-me-email">{email}</span>
          </span>
          <ChevronRight className="pn-me-chevron" />
        </button>
        <button type="button" className="pn-signout" onClick={onSignOut} aria-label="Sign out" title="Sign out">
          <LogOut />
        </button>
      </div>
    </div>
  );
}
