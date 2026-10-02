import { createContext, useContext } from 'react';

/** Which board to show when a service opens, and which column to scroll to (a milestone or a Status). */
export interface ServiceTarget {
  service: string;
  view: 'milestones' | 'status';
  focus: string | null;
}

/**
 * Lets a task (its Service, Milestone and Status chips) open its service page from anywhere in the portal.
 * PortalPage provides it. Null outside the portal: the chips then do not link.
 */
export const PortalNavContext = createContext<((target: ServiceTarget) => void) | null>(null);

export function useOpenService(): ((target: ServiceTarget) => void) | null {
  return useContext(PortalNavContext);
}
