/**
 * Approvals: items the church says OK to (a design, ads, posts). They live in the "Portal — Approvals" list
 * and show inside the Tasks tab under "Needs Approval". There is no separate Approvals tab.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';

import { APPROVALS_PROJECT_ID, SERVICES } from '@/client';
import { today } from '@/lib/scope';
import { createNode, deleteNode, getFieldValue, getTitle, updateNode } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';
import { Check, ExternalLink, Loader2, MessageSquare, Plus } from '@/lib/icons';

export const PENDING = 'Pending';
/** What the church sees for a Pending approval, and the Tasks filter name. */
export const NEEDS_OK = 'Needs Approval';
const APPROVED = 'Approved';
const CHANGES = 'Changes Requested';

export function approvalStatusOf(row: GenesisNode): string {
  return getFieldValue(row, 'Status') ?? PENDING;
}

function tagClass(status: string): string {
  if (status === PENDING) return 'ff-tag ff-tag-hot';
  if (status === APPROVED) return 'ff-tag ff-tag-ok';
  return 'ff-tag ff-tag-warn';
}

export type Decide = (id: string, status: string, comment: string) => Promise<void>;

export function ApprovalCard({ row, onDecide }: { row: GenesisNode; onDecide: Decide }) {
  const status = approvalStatusOf(row);
  const link = getFieldValue(row, 'Preview Link');
  const service = getFieldValue(row, 'Service');
  const description = getFieldValue(row, 'Description');
  const oldComment = getFieldValue(row, 'Client Comment');
  const decidedAt = getFieldValue(row, 'Decided At');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  async function decide(next: string) {
    setSaving(next);
    try {
      await onDecide(row.id, next, comment.trim());
    } finally {
      setSaving(null);
    }
  }

  return (
    <article className="ff-item ff-lift">
      <div className="ff-item-head">
        <h3 className="ff-item-title">{getTitle(row, 'Item') ?? 'Item'}</h3>
        <span className={tagClass(status)}>{status === PENDING ? NEEDS_OK : status}</span>
      </div>
      {service != null && service !== '' && <p className="ff-item-meta">{service}</p>}
      {description != null && description.trim() !== '' && <p className="ra-description">{description}</p>}
      <div className="ff-item-body">
        {link != null && link !== '' && (
          <a href={link} target="_blank" rel="noreferrer" className="ff-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
            <ExternalLink style={{ width: 16, height: 16 }} /> Open preview
          </a>
        )}

        {status === PENDING ? (
          <>
            <textarea
              className="ff-textarea"
              rows={2}
              placeholder="Comments or changes (needed if you ask for changes)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="ff-row-actions">
              <button
                type="button"
                className="ff-btn ff-btn-primary ff-btn-sm"
                disabled={saving != null}
                onClick={() => void decide(APPROVED)}
              >
                {saving === APPROVED ? <Loader2 className="ff-spin" /> : <Check />} Approve
              </button>
              <button
                type="button"
                className="ff-btn ff-btn-secondary ff-btn-sm"
                disabled={saving != null || comment.trim() === ''}
                onClick={() => void decide(CHANGES)}
              >
                {saving === CHANGES ? <Loader2 className="ff-spin" /> : <MessageSquare />} Ask for changes
              </button>
            </div>
          </>
        ) : (
          <p className="ff-small" style={{ margin: 0 }}>
            {decidedAt != null && decidedAt !== '' ? `${status} on ${decidedAt}.` : `${status}.`}
            {oldComment != null && oldComment !== '' && (
              <span style={{ display: 'block', marginTop: 4, whiteSpace: 'pre-wrap' }}>Note: {oldComment}</span>
            )}
          </p>
        )}
      </div>
    </article>
  );
}

/**
 * Saves the church's answer on an approval. Several people share one portal, so it records who answered.
 * Used by the Tasks tab ("Needs your OK"). Returns the decide function and whether the last save failed.
 */
export function useDecide(email: string, refresh: () => Promise<unknown>) {
  const [saveError, setSaveError] = useState(false);
  const decide: Decide = async (id, status, comment) => {
    setSaveError(false);
    try {
      await updateNode(APPROVALS_PROJECT_ID, id, {
        Status: status,
        'Client Comment': comment === '' ? `(${email})` : `${comment} (${email})`,
        'Decided At': today(),
      });
      await refresh();
    } catch (err) {
      console.error('Approval update failed', err);
      setSaveError(true);
    }
  };
  return { decide, saveError };
}

/**
 * Faith Funnels only: "Request approval" button and its small form. Adds a Pending row to "Portal — Approvals",
 * so the church sees it at once under Needs Approval and at the top of All Tasks.
 */
const MISSING = 'Missing column: ';

export function RequestApproval({ onAdded }: { onAdded: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState('');
  const [service, setService] = useState<string>(SERVICES[0] ?? '');
  const [details, setDetails] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function close() {
    setOpen(false);
    setItem('');
    setDetails('');
    setLink('');
    setError('');
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    const name = item.trim();
    const about = details.trim();
    const url = link.trim();
    if (name === '') return setError('Add a title.');
    if (url !== '' && !/^https?:\/\//i.test(url)) return setError('The link must start with https://');
    setBusy(true);
    setError('');
    try {
      const { id, ignoredKeys } = await createNode(APPROVALS_PROJECT_ID, {
        Item: name,
        Service: service,
        'Preview Link': url,
        Status: PENDING,
        // Sent only when filled in, so a list without a Description column still works for title-only requests.
        ...(about !== '' ? { Description: about } : {}),
      });
      // A list without these columns cannot show the request. Remove the half-made row.
      const missing = ['Item', 'Status', 'Description'].filter((key) => ignoredKeys.includes(key));
      if (missing.length > 0) {
        if (id != null) await deleteNode(APPROVALS_PROJECT_ID, id);
        throw new Error(MISSING + missing.join(', '));
      }
      await onAdded();
      close();
    } catch (err) {
      console.error('Approval request failed', err);
      // Only Faith Funnels sees this form, so name the missing column outright.
      const text = err instanceof Error ? err.message : '';
      setError(
        text.startsWith(MISSING)
          ? `"Portal — Approvals" needs a text column named "${text.slice(MISSING.length)}". Add it in Taskade, then try again.`
          : 'We could not send that. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="ff-btn ff-btn-secondary ff-btn-sm" onClick={() => setOpen(true)}>
        <Plus /> Request approval
      </button>
    );
  }

  return (
    <form className="ff-item ra-form" onSubmit={(e) => void send(e)}>
      <div>
        <h3 className="ff-item-title">Request approval</h3>
        <p className="ff-item-meta">The church sees it right away under Needs Approval.</p>
      </div>
      <div className="ra-field">
        <label className="ff-label" htmlFor="ra-item">Title</label>
        <input
          id="ra-item"
          className="ff-input"
          value={item}
          placeholder="Homepage design"
          autoFocus
          onChange={(e) => {
            setItem(e.target.value);
            setError('');
          }}
        />
      </div>
      {SERVICES.length > 1 && (
        <div className="ra-field">
          <label className="ff-label" htmlFor="ra-service">Service</label>
          <select id="ra-service" className="ff-input" value={service} onChange={(e) => setService(e.target.value)}>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="ra-field">
        <label className="ff-label" htmlFor="ra-details">Description (optional)</label>
        <textarea
          id="ra-details"
          className="ff-textarea"
          rows={3}
          value={details}
          placeholder="What to look at, and what kind of feedback helps"
          onChange={(e) => {
            setDetails(e.target.value);
            setError('');
          }}
        />
      </div>
      <div className="ra-field">
        <label className="ff-label" htmlFor="ra-link">Link (optional)</label>
        <input
          id="ra-link"
          className="ff-input"
          type="url"
          inputMode="url"
          value={link}
          placeholder="https://"
          onChange={(e) => {
            setLink(e.target.value);
            setError('');
          }}
        />
      </div>
      {error !== '' && (
        <p className="ff-error" role="alert" style={{ margin: 0 }}>
          {error}
        </p>
      )}
      <div className="ff-row-actions">
        <button type="submit" className="ff-btn ff-btn-primary ff-btn-sm" disabled={busy}>
          {busy ? <Loader2 className="ff-spin" /> : <Check />} Send request
        </button>
        <button type="button" className="ff-btn ff-btn-ghost ff-btn-sm" disabled={busy} onClick={close}>
          Cancel
        </button>
      </div>
    </form>
  );
}
