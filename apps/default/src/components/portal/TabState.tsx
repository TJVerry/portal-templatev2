import type { ReactNode } from 'react';

import { Loader2 } from '@/lib/icons';

/** Loading, error and empty states shared by the portal tabs. Returns null when rows exist. */
export function TabState({
  loading,
  error,
  count,
  empty,
}: {
  loading: boolean;
  error: Error | null;
  count: number;
  empty: ReactNode;
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <Loader2 className="ff-spin" style={{ width: 28, height: 28, color: 'var(--ff-orange)' }} />
      </div>
    );
  }
  if (error != null && count === 0) {
    return (
      <p className="ff-error" role="alert" style={{ padding: '24px 0' }}>
        We could not load this list. Please refresh the page.
      </p>
    );
  }
  if (count === 0) {
    return <div className="ff-item ff-empty">{empty}</div>;
  }
  return null;
}
