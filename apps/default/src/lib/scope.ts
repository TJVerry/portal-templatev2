import { SERVICES } from '@/client';
import { getFieldValue } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';

/**
 * Rows this church should see: everything tagged with a service they bought,
 * plus rows with no service (general items). The whole app belongs to one church,
 * so there is no per-person filter.
 * Subtasks (rows nested under another row) are left out: they show inside their task.
 */
export function forMyServices(rows: GenesisNode[]): GenesisNode[] {
  return rows.filter((row) => {
    if (row.parentId != null) return false;
    const service = getFieldValue(row, 'Service');
    return service == null || service === '' || (SERVICES as string[]).includes(service);
  });
}

/** Rows for one service, or all rows when `service` is null. */
export function forService(rows: GenesisNode[], service: string | null): GenesisNode[] {
  if (service == null) return rows;
  return rows.filter((row) => getFieldValue(row, 'Service') === service);
}

/** Today's date as YYYY-MM-DD, for date fields. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
