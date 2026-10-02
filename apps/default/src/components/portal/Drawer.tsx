import { useEffect, useRef, useState } from 'react';
import type { ReactNode, TouchEvent } from 'react';
import { createPortal } from 'react-dom';

import { X } from '@/lib/icons';

const EXIT_MS = 200;
const SWIPE_CLOSE_PX = 72;

/**
 * Slide-in menu from the left. Solid panel (DesignOS: no glass).
 * Closes on Escape, backdrop tap, or a swipe to the left. Locks page scroll and keeps focus inside while open.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  // Stay mounted for the exit animation after `open` turns false.
  const [mounted, setMounted] = useState(open);
  const [dragX, setDragX] = useState(0);
  const panelRef = useRef<HTMLElement>(null);
  const touch = useRef<{ x: number; y: number; horizontal: boolean | null } | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    setDragX(0);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  // Lock scroll (the portal scrolls inside `.ff-body`, not the window); remember and restore focus.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const scrollers = [document.body, document.querySelector<HTMLElement>('.ff-body')].filter((el): el is HTMLElement => el != null);
    const prev = scrollers.map((el) => el.style.overflow);
    scrollers.forEach((el) => {
      el.style.overflow = 'hidden';
    });
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      scrollers.forEach((el, i) => {
        el.style.overflow = prev[i];
      });
      opener?.focus?.({ preventScroll: true });
    };
  }, [open]);

  // Escape closes; Tab stays inside the panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || panelRef.current == null) return;
      const items = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea');
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, horizontal: null };
  }

  function onTouchMove(e: TouchEvent) {
    const s = touch.current;
    if (s == null) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    // Decide once per gesture: horizontal swipes drag the panel, vertical ones scroll it.
    if (s.horizontal == null && Math.abs(dx) + Math.abs(dy) > 8) s.horizontal = Math.abs(dx) > Math.abs(dy);
    if (s.horizontal === true) setDragX(Math.min(0, dx));
  }

  function onTouchEnd() {
    const swiped = dragX < -SWIPE_CLOSE_PX;
    touch.current = null;
    if (swiped) onClose();
    else setDragX(0);
  }

  if (!open && !mounted) return null;
  const dragging = dragX !== 0;
  // Render at the `.ff` root: an animated parent (`.ff-enter`) would trap `position: fixed`
  // inside the page column, so the menu showed up squeezed into the middle of the screen.
  const host = document.querySelector<HTMLElement>('main.ff') ?? document.body;
  return createPortal(
    <div className={`dr-root${open ? '' : ' dr-closing'}`} role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        className="dr-backdrop"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        style={dragging ? { opacity: Math.max(0, 1 + dragX / 320), transition: 'none' } : undefined}
      />
      <nav
        ref={panelRef}
        className="dr-panel"
        aria-label={title}
        tabIndex={-1}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
        style={dragging ? { transform: `translateX(${dragX}px)`, transition: 'none' } : undefined}
      >
        <div className="dr-head">
          <span className="ff-count">{title}</span>
          <button type="button" className="ff-btn ff-btn-ghost ff-btn-sm dr-close" onClick={onClose} aria-label="Close menu">
            <X />
          </button>
        </div>
        {children}
      </nav>
    </div>,
    host,
  );
}

/** One row in the drawer. */
export function DrawerItem({
  label,
  meta,
  state = 'todo',
  onClick,
  icon,
}: {
  label: string;
  meta?: string;
  state?: 'done' | 'now' | 'todo';
  onClick: () => void;
  icon?: ReactNode;
}) {
  return (
    <button type="button" className={`dr-item dr-item-${state}`} onClick={onClick} aria-current={state === 'now' ? 'step' : undefined}>
      <span className="dr-item-icon">{icon}</span>
      <span className="dr-item-text">
        <span className="dr-item-label">{label}</span>
        {meta != null && <span className="dr-item-meta">{meta}</span>}
      </span>
    </button>
  );
}
