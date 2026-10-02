import { Check, Plus } from '@/lib/icons';

const OTHER_PREFIX = 'Other';

/**
 * Tap-to-pick chips in labelled groups, plus an optional "Other" chip that opens a text box.
 * The Other answer is stored as "Other: <text>" next to the picked chips.
 */
export function ChipsInput({
  groups,
  value,
  onChange,
  other,
}: {
  groups: { label: string; options: string[] }[];
  value: string | string[] | undefined;
  onChange: (next: string[]) => void;
  other: boolean;
}) {
  const picked = Array.isArray(value) ? value : [];
  const otherEntry = picked.find((p) => p === OTHER_PREFIX || p.startsWith(`${OTHER_PREFIX}: `));
  const otherOn = otherEntry != null;
  const otherText = otherEntry != null && otherEntry.startsWith(`${OTHER_PREFIX}: `) ? otherEntry.slice(OTHER_PREFIX.length + 2) : '';
  const withoutOther = picked.filter((p) => p !== otherEntry);

  function toggle(option: string) {
    onChange(picked.includes(option) ? picked.filter((p) => p !== option) : [...picked, option]);
  }

  return (
    <div className="ob-chipgroups">
      {groups.map((group) => (
        <div key={group.label} className="ob-chipgroup">
          <span className="ob-chipgroup-label">{group.label}</span>
          <div className="ob-chips">
            {group.options.map((option) => {
              const on = picked.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  className="ob-chip"
                  onClick={() => toggle(option)}
                >
                  {on && <Check />}
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {other && (
        <div className="ob-chipgroup">
          <div className="ob-chips">
            <button
              type="button"
              role="checkbox"
              aria-checked={otherOn}
              className="ob-chip"
              onClick={() => onChange(otherOn ? withoutOther : [...withoutOther, OTHER_PREFIX])}
            >
              {otherOn ? <Check /> : <Plus />}
              Other
            </button>
          </div>
          {otherOn && (
            <input
              className="ff-input ob-input"
              autoFocus
              placeholder="Which tool? Separate more than one with commas."
              value={otherText}
              onChange={(e) => {
                const text = e.target.value;
                onChange([...withoutOther, text.trim() === '' ? OTHER_PREFIX : `${OTHER_PREFIX}: ${text}`]);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
