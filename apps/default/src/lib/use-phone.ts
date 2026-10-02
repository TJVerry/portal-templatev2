import { useEffect, useState } from 'react';

/** Same breakpoint as the `max-width: 640px` rules in PortalStyles. */
const PHONE = '(max-width: 640px)';

function matches(): boolean {
  try {
    return window.matchMedia(PHONE).matches;
  } catch {
    return false;
  }
}

/** True on phone-width screens. Updates when the screen rotates or resizes. */
export function usePhone(): boolean {
  const [phone, setPhone] = useState(matches);
  useEffect(() => {
    let query: MediaQueryList;
    try {
      query = window.matchMedia(PHONE);
    } catch {
      return;
    }
    const onChange = () => setPhone(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return phone;
}

/**
 * Scroll the portal back to the top. The page scrolls inside `.ff-body`, not the window,
 * so `window.scrollTo` alone does nothing there.
 */
export function scrollPortalTop(smooth = true): void {
  const behavior: ScrollBehavior = smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto';
  document.querySelector('.ff-body')?.scrollTo({ top: 0, behavior });
  window.scrollTo({ top: 0, behavior });
}
