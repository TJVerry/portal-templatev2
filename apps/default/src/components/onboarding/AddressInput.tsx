import { useEffect, useRef, useState } from 'react';

import { MapPin } from '@/lib/icons';

/**
 * Street address with suggestions as you type. Uses Photon (photon.komoot.io), a free
 * OpenStreetMap search with no API key. If it is down or blocked, this is a plain text box.
 */

interface PhotonFeature {
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
    countrycode?: string;
  };
}

function format(p: PhotonFeature['properties']): string | null {
  const street = [p.housenumber, p.street].filter(Boolean).join(' ') || p.name;
  const city = p.city ?? p.town ?? p.village;
  if (street == null || city == null) return null;
  const stateZip = [p.state, p.postcode].filter(Boolean).join(' ');
  return [street, city, stateZip].filter((s) => s != null && s !== '').join(', ');
}

export function AddressInput({
  value,
  onChange,
  placeholder,
  autoFocus,
  id,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  autoFocus: boolean;
  id: string;
}) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    const query = value.trim();
    if (query.length < 4) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const url = `https://photon.komoot.io/api/?limit=6&lang=en&layer=house&layer=street&q=${encodeURIComponent(query)}`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) return;
        const data = (await response.json()) as { features?: PhotonFeature[] };
        const list = (data.features ?? [])
          .map((f) => format(f.properties))
          .filter((s): s is string => s != null);
        setSuggestions([...new Set(list)].slice(0, 5));
        setActive(-1);
        setOpen(true);
      } catch {
        // Offline or blocked: the field still works as plain text.
      }
    }, 300);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [value]);

  function pick(address: string) {
    skipNext.current = true;
    onChange(address);
    setOpen(false);
    setSuggestions([]);
  }

  const listId = `${id}-suggestions`;
  const showList = open && suggestions.length > 0;

  return (
    <div className="ob-address">
      <input
        id={id}
        className="ff-input ob-input"
        type="text"
        autoComplete="street-address"
        autoFocus={autoFocus}
        placeholder={placeholder ?? 'Start typing your street address'}
        value={value}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, suggestions.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            pick(suggestions[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {showList && (
        <ul className="ob-suggest" id={listId} role="listbox">
          {suggestions.map((s, i) => (
            <li key={s} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                <MapPin /> {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
