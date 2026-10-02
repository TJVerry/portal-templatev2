import { Plus, X } from '@/lib/icons';
import { encodeRows, formatPhone, parseRows } from '@/lib/validate';
import type { Row } from '@/lib/validate';

export interface RowColumn {
  key: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'time' | 'select';
  options?: string[];
  placeholder?: string;
  /** Grid width, e.g. '1fr' or '140px'. */
  width?: string;
}

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const SERVICE_TIME_COLUMNS: RowColumn[] = [
  { key: 'day', label: 'Day', type: 'select', options: DAYS, width: 'minmax(130px, 1.2fr)' },
  { key: 'start', label: 'Starts', type: 'time', width: 'minmax(120px, 1fr)' },
  { key: 'end', label: 'Ends', type: 'time', width: 'minmax(120px, 1fr)' },
  { key: 'label', label: 'Name (optional)', type: 'text', placeholder: 'Traditional', width: 'minmax(140px, 1.4fr)' },
];

export const TEAM_COLUMNS: RowColumn[] = [
  { key: 'name', label: 'Name', type: 'text', placeholder: 'Jane Smith', width: 'minmax(130px, 1.2fr)' },
  { key: 'role', label: 'Role', type: 'text', placeholder: 'Worship leader', width: 'minmax(120px, 1fr)' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'jane@church.org', width: 'minmax(160px, 1.4fr)' },
  { key: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 555-5555', width: 'minmax(130px, 1fr)' },
];

/**
 * A small editable table: one row per service time or teammate, "Add" button below,
 * X to remove. Stored as JSON strings so it fits the Answers shape.
 */
export function RowsInput({
  columns,
  value,
  onChange,
  addLabel,
  newRow,
  max = 12,
}: {
  columns: RowColumn[];
  value: string | string[] | undefined;
  onChange: (next: string[]) => void;
  addLabel: string;
  newRow: (rows: Row[]) => Row;
  max?: number;
}) {
  const rows = parseRows(value);
  const template = columns.map((c) => c.width ?? '1fr').join(' ') + ' 40px';

  function update(i: number, key: string, next: string) {
    onChange(encodeRows(rows.map((row, j) => (j === i ? { ...row, [key]: next } : row))));
  }

  return (
    <div className="ob-rows">
      {rows.length > 0 && (
        <div className="ob-rows-head" style={{ gridTemplateColumns: template }} aria-hidden="true">
          {columns.map((c) => (
            <span key={c.key}>{c.label}</span>
          ))}
          <span />
        </div>
      )}
      {rows.map((row, i) => (
        <div key={i} className="ob-row" style={{ gridTemplateColumns: template }}>
          {columns.map((c) => {
            const id = `row-${i}-${c.key}`;
            return (
              <label key={c.key} className="ob-cell" htmlFor={id}>
                <span className="ob-cell-label">{c.label}</span>
                {c.type === 'select' ? (
                  <select id={id} className="ff-input" value={row[c.key] ?? ''} onChange={(e) => update(i, c.key, e.target.value)}>
                    <option value="">Pick one</option>
                    {(c.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    className="ff-input"
                    type={c.type}
                    inputMode={c.type === 'tel' ? 'tel' : c.type === 'email' ? 'email' : undefined}
                    step={c.type === 'time' ? 900 : undefined}
                    placeholder={c.placeholder}
                    value={row[c.key] ?? ''}
                    onChange={(e) => update(i, c.key, e.target.value)}
                    onBlur={(e) => {
                      if (c.type === 'tel') update(i, c.key, formatPhone(e.target.value));
                      if (c.type === 'email') update(i, c.key, e.target.value.trim());
                    }}
                  />
                )}
              </label>
            );
          })}
          <button
            type="button"
            className="ob-row-remove"
            aria-label="Remove this row"
            onClick={() => onChange(encodeRows(rows.filter((_, j) => j !== i)))}
          >
            <X />
          </button>
        </div>
      ))}
      {rows.length < max && (
        <button type="button" className="ff-btn ff-btn-secondary ff-btn-sm ob-rows-add" onClick={() => onChange(encodeRows([...rows, newRow(rows)]))}>
          <Plus /> {addLabel}
        </button>
      )}
    </div>
  );
}
