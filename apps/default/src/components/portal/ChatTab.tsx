import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';

import { MESSAGES_PROJECT_ID } from '@/client';
import { SUPPORT_EMAIL } from '@/config';
import type { UseLiveNodesResult } from '@/hooks/use-live-nodes';
import {
  REACTIONS,
  addChatFilesToFiles,
  dayLabel,
  initials,
  isAgencyEmail,
  isImage,
  notifyRelay,
  readSeen,
  saveData,
  sizeLabel,
  timeLabel,
  toMessage,
  toMessages,
  toggleReaction,
  uploadChatFile,
} from '@/lib/chat';
import type { ChatData, ChatFile, ChatMessage } from '@/lib/chat';
import { createNode, deleteNode } from '@/lib/genesis-data';
import { usePeople } from '@/lib/people';
import type { Person } from '@/lib/people';
import { UNSUPPORTED } from '@/lib/store-file';
import {
  CornerUpLeft,
  FileText,
  ListChecks,
  Loader2,
  MessageCircle,
  Paperclip,
  Pencil,
  Send,
  SmilePlus,
  Trash2,
  X,
} from '@/lib/icons';

/**
 * Teams-style chat between the church and Faith Funnels: files (up to 500 MB), reactions,
 * replies, edit and delete. Data and the GHL relay live in `lib/chat.ts`.
 */

const SETUP_ERROR = 'Chat is not set up in this portal yet. Please tell Faith Funnels.';
const DATA_MISSING = 'Chat needs one more column ("Data") to save files, reactions and replies. Please tell Faith Funnels.';
/** Messages from one person within this gap are grouped under one name. */
const GROUP_MS = 5 * 60 * 1000;

type Pending = { key: string; name: string; pct: number; file?: ChatFile; error?: string };

export function ChatTab({ email, name, messages }: { email: string; name: string; messages: UseLiveNodesResult }) {
  const { nodes, loading, error, refresh } = messages;
  const list = useMemo(() => toMessages(nodes), [nodes]);
  const byId = useMemo(() => new Map(list.map((m) => [m.id, m])), [list]);
  const meIsAgency = isAgencyEmail(email);
  const isMine = (m: ChatMessage) => (meIsAgency ? m.isAgency : !m.isAgency && m.from.toLowerCase() === email.toLowerCase());
  // Names and photos come from each person's profile (like Google Messages), so a change there shows here at once.
  const people = usePeople();
  const personOf = (m: ChatMessage) => people.who(m.from, m.name, m.isAgency);
  // Reactions store emails. Show names instead: "You", or that person's name.
  const nameOf = (who: string) => (who.toLowerCase() === email.toLowerCase() ? 'You' : people.who(who).name);

  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // "New messages" line: the first Faith Funnels message this browser had not seen when Chat opened.
  const [seenAtOpen] = useState(readSeen);
  // Counted over every row, hidden ones too, to match the unread badge in PortalPage.
  const firstUnreadId = useMemo(() => {
    if (meIsAgency) return null;
    let count = 0;
    let unread = false;
    for (const m of nodes.map(toMessage)) {
      if (m.isAgency) count += 1;
      if (count > seenAtOpen) unread = true;
      if (unread && m.isAgency && list.some((shown) => shown.id === m.id)) return m.id;
    }
    return null;
  }, [nodes, list, seenAtOpen, meIsAgency]);

  // Stay at the bottom when new messages come in.
  useEffect(() => {
    const log = logRef.current;
    if (log != null) log.scrollTop = log.scrollHeight;
  }, [list.length]);

  const uploading = pending.some((p) => p.file == null && p.error == null);
  const readyFiles = pending.flatMap((p) => (p.file != null ? [p.file] : []));

  function addFiles(files: File[]) {
    if (editing != null || files.length === 0) return;
    setNotice(null);
    for (const file of files) {
      const key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setPending((prev) => [...prev, { key, name: file.name, pct: 0 }]);
      const update = (patch: Partial<Pending>) => setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
      uploadChatFile(file, (pct) => update({ pct }))
        .then((stored) => update({ file: stored, pct: 100 }))
        .catch((err: unknown) => {
          console.error('Chat upload failed', err);
          const text = err instanceof Error && (err.message.includes('larger than') || err.message.includes(UNSUPPORTED)) ? err.message : 'Did not upload. Try again.';
          update({ error: text });
        });
    }
  }

  async function send() {
    const text = draft.trim();
    if (sending || uploading) return;

    if (editing != null) {
      if (text === '' || text === editing.text) {
        cancelEdit();
        return;
      }
      setSending(true);
      try {
        await saveData(editing.id, editing.data, { editedAt: new Date().toISOString() }, { Message: text });
        cancelEdit();
        await refresh();
      } catch (err) {
        console.error('Chat edit failed', err);
        setNotice('Your change did not save. Please try again.');
      } finally {
        setSending(false);
      }
      return;
    }

    if (text === '' && readyFiles.length === 0) return;
    setSending(true);
    setNotice(null);
    const now = new Date().toISOString();
    const data: ChatData = {
      name: name !== '' ? name : undefined,
      sentAt: now,
      source: 'portal',
      ...(readyFiles.length > 0 ? { files: readyFiles } : {}),
      ...(replyTo != null ? { replyTo: replyTo.id } : {}),
    };
    try {
      const { id, ignoredKeys } = await createNode(MESSAGES_PROJECT_ID, {
        Message: text !== '' ? text : readyFiles.map((f) => f.name).join(', '),
        From: email,
        'Sent At': now,
        Data: JSON.stringify(data),
      });
      if (ignoredKeys.includes('Message') || ignoredKeys.includes('From')) {
        if (id != null) await deleteNode(MESSAGES_PROJECT_ID, id);
        throw new Error(SETUP_ERROR);
      }
      if (ignoredKeys.includes('Data')) setNotice(DATA_MISSING);
      notifyRelay(id);
      addChatFilesToFiles(readyFiles, email);
      setDraft('');
      setReplyTo(null);
      setPending([]);
      await refresh();
    } catch (err) {
      console.error('Chat send failed', err);
      setNotice(
        err instanceof Error && err.message === SETUP_ERROR
          ? SETUP_ERROR
          : `Your message did not send. Please try again, or email ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function react(m: ChatMessage, emoji: string) {
    setPicker(null);
    try {
      await saveData(m.id, m.data, { reactions: toggleReaction(m.data, emoji, email) });
      await refresh();
    } catch (err) {
      console.error('Reaction failed', err);
      setNotice('That did not work. Please try again.');
    }
  }

  async function remove(m: ChatMessage) {
    if (!window.confirm('Delete this message?')) return;
    try {
      // Hidden, not erased: the row stays in Taskade (and GHL) as a record.
      await saveData(m.id, m.data, { deleted: true });
      if (replyTo?.id === m.id) setReplyTo(null);
      if (editing?.id === m.id) cancelEdit();
      await refresh();
    } catch (err) {
      console.error('Delete failed', err);
      setNotice('That did not work. Please try again.');
    }
  }

  function startReply(m: ChatMessage) {
    setEditing(null);
    setReplyTo(m);
    setActive(null);
    inputRef.current?.focus();
  }

  function startEdit(m: ChatMessage) {
    setReplyTo(null);
    setPending([]);
    setEditing(m);
    setDraft(m.text);
    setActive(null);
    inputRef.current?.focus();
  }

  function cancelEdit() {
    setEditing(null);
    setDraft('');
  }

  function jumpTo(id: string) {
    document.getElementById(`ch-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlash(id);
    window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 1600);
  }

  const dropProps = {
    onDragOver: (e: DragEvent) => {
      if (!Array.from(e.dataTransfer.types).includes('Files') || editing != null) return;
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
  };

  return (
    <section className={`ff-item ch${dragging ? ' ch-dragging' : ''}`} {...dropProps}>
      <div className="ch-log" ref={logRef} aria-live="polite" onClick={() => setPicker(null)}>
        {loading && list.length === 0 ? (
          <div className="ch-empty">
            <Loader2 className="ff-spin" style={{ width: 28, height: 28, color: 'var(--ff-orange)' }} />
          </div>
        ) : error != null && list.length === 0 ? (
          <p className="ff-error" role="alert">
            We could not load your messages. Please refresh the page.
          </p>
        ) : list.length === 0 ? (
          <div className="ch-empty">
            <MessageCircle />
            <p className="ch-empty-title">No messages yet</p>
            <p>Ask a question, share an update, or drop in a file. Our team gets it right away.</p>
          </div>
        ) : (
          list.map((m, i) => {
            const prev = list[i - 1];
            const day = dayLabel(m.sentAt);
            const newDay = prev == null || dayLabel(prev.sentAt) !== day;
            const grouped = joinsPrev(list, i, firstUnreadId);
            // The photo sits by the last message of a run, like Google Messages.
            const lastOfRun = !joinsPrev(list, i + 1, firstUnreadId);
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <div className="ch-divider">
                    <span>{day}</span>
                  </div>
                )}
                {m.id === firstUnreadId && (
                  <div className="ch-divider ch-divider-new">
                    <span>New messages</span>
                  </div>
                )}
                <Message
                  m={m}
                  mine={isMine(m)}
                  grouped={grouped}
                  lastOfRun={lastOfRun}
                  person={personOf(m)}
                  me={email}
                  nameOf={nameOf}
                  quoted={m.data.replyTo != null ? (byId.get(m.data.replyTo) ?? null) : null}
                  personOf={personOf}
                  active={active === m.id}
                  picker={picker === m.id}
                  flash={flash === m.id}
                  onToggle={() => setActive((a) => (a === m.id ? null : m.id))}
                  onPicker={() => setPicker((p) => (p === m.id ? null : m.id))}
                  onReact={(emoji) => void react(m, emoji)}
                  onReply={() => startReply(m)}
                  onEdit={() => startEdit(m)}
                  onDelete={() => void remove(m)}
                  onJump={jumpTo}
                />
              </Fragment>
            );
          })
        )}
      </div>

      <div className="ch-compose">
        {replyTo != null && (
          <div className="ch-bar">
            <CornerUpLeft />
            <span className="ch-bar-text">
              Replying to <strong>{personOf(replyTo).name}</strong>: {snippet(replyTo)}
            </span>
            <IconBtn label="Cancel reply" onClick={() => setReplyTo(null)}>
              <X />
            </IconBtn>
          </div>
        )}
        {editing != null && (
          <div className="ch-bar">
            <Pencil />
            <span className="ch-bar-text">Editing your message</span>
            <IconBtn label="Cancel edit" onClick={cancelEdit}>
              <X />
            </IconBtn>
          </div>
        )}
        {pending.length > 0 && (
          <ul className="ch-pending">
            {pending.map((p) => (
              <li key={p.key} className={p.error != null ? 'ch-chip ch-chip-error' : 'ch-chip'}>
                {p.file == null && p.error == null ? <Loader2 className="ff-spin" /> : <FileText />}
                <span className="ch-chip-name">{p.name}</span>
                <span className="ch-chip-meta">{p.error ?? (p.file == null ? `${p.pct}%` : sizeLabel(p.file.size))}</span>
                {p.file == null && p.error == null && (
                  <span className="ch-chip-bar" style={{ width: `${p.pct}%` }} aria-hidden="true" />
                )}
                <IconBtn label={`Remove ${p.name}`} onClick={() => setPending((prev) => prev.filter((x) => x.key !== p.key))}>
                  <X />
                </IconBtn>
              </li>
            ))}
          </ul>
        )}

        <form
          className="ch-form"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          {editing == null && (
            <label className="ch-attach" title="Attach files (up to 500 MB each)" aria-label="Attach files">
              <Paperclip />
              <input
                ref={fileRef}
                type="file"
                multiple
                className="ob-file"
                onChange={(e) => {
                  addFiles(Array.from(e.target.files ?? []));
                  e.target.value = '';
                }}
              />
            </label>
          )}
          <textarea
            ref={inputRef}
            className="ff-textarea ch-input"
            rows={1}
            placeholder={editing != null ? 'Edit your message' : 'Type a message'}
            aria-label="Type a message"
            value={draft}
            disabled={sending}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends. Shift + Enter makes a new line. Escape cancels a reply or edit.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              } else if (e.key === 'Escape') {
                setReplyTo(null);
                if (editing != null) cancelEdit();
              }
            }}
          />
          <button
            type="submit"
            className="ff-btn ff-btn-primary ch-send"
            disabled={sending || uploading || (draft.trim() === '' && (editing != null || readyFiles.length === 0))}
            aria-label={editing != null ? 'Save' : 'Send'}
          >
            {sending ? <Loader2 className="ff-spin" /> : <Send />}
            <span className="ch-send-label">{editing != null ? 'Save' : 'Send'}</span>
          </button>
        </form>
        {notice != null && (
          <p className="ff-error" role="alert">
            {notice}
          </p>
        )}
        <p className="ff-small ch-note">Enter to send · Shift + Enter for a new line · Files up to 500 MB</p>
      </div>
      {dragging && <div className="ch-drop">Drop files to attach</div>}
      <style>{CSS}</style>
    </section>
  );
}

/** True when message `i` continues the run above it: same person, same day, within GROUP_MS. */
function joinsPrev(list: ChatMessage[], i: number, firstUnreadId: string | null): boolean {
  const m = list[i];
  const prev = list[i - 1];
  if (m == null || prev == null || m.sentAt == null || prev.sentAt == null) return false;
  return (
    dayLabel(prev.sentAt) === dayLabel(m.sentAt) &&
    prev.from === m.from &&
    prev.isAgency === m.isAgency &&
    m.sentAt.getTime() - prev.sentAt.getTime() < GROUP_MS &&
    m.id !== firstUnreadId
  );
}

/** "You", "You and Mike", "You, Mike and Sarah". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function snippet(m: ChatMessage): string {
  const text = m.text.trim() !== '' ? m.text : (m.data.files ?? []).map((f) => f.name).join(', ');
  return text.length > 90 ? `${text.slice(0, 90)}…` : text;
}

/** Text with clickable links. */
function Linkified({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="ch-link">
            {part}
          </a>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function Message({
  m,
  mine,
  grouped,
  lastOfRun,
  person,
  me,
  nameOf,
  quoted,
  personOf,
  active,
  picker,
  flash,
  onToggle,
  onPicker,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onJump,
}: {
  m: ChatMessage;
  mine: boolean;
  grouped: boolean;
  lastOfRun: boolean;
  /** Who sent it: name and photo from their profile. */
  person: Person;
  me: string;
  nameOf: (email: string) => string;
  quoted: ChatMessage | null;
  personOf: (m: ChatMessage) => Person;
  active: boolean;
  picker: boolean;
  flash: boolean;
  onToggle: () => void;
  onPicker: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onJump: (id: string) => void;
}) {
  const files = m.data.files ?? [];
  const images = files.filter(isImage);
  const others = files.filter((f) => !isImage(f));
  const reactions = Object.entries(m.data.reactions ?? {}).filter(([, people]) => people.length > 0);
  // A files-only message stores the file names as its text; do not show them twice.
  const showText = m.text.trim() !== '' && !(files.length > 0 && m.text === files.map((f) => f.name).join(', '));
  const canChange = mine && m.data.source !== 'ghl';

  return (
    <div
      id={`ch-${m.id}`}
      className={`ch-row${mine ? ' ch-mine' : ''}${grouped ? ' ch-grouped' : ''}${active ? ' ch-active' : ''}${flash ? ' ch-flash' : ''}`}
    >
      {!mine &&
        (lastOfRun ? (
          <span className={`ch-avatar${m.isAgency ? ' ch-avatar-ff' : ''}`} title={person.name} aria-hidden="true">
            {person.photoUrl !== '' ? <img src={person.photoUrl} alt="" loading="lazy" /> : initials(person.name)}
          </span>
        ) : (
          <span className="ch-avatar ch-avatar-gap" aria-hidden="true" />
        ))}
      <div className="ch-body">
        {!grouped && (
          <p className="ch-meta">
            {mine ? 'You' : person.name}
            {m.sentAt != null && <span className="ch-time"> · {timeLabel(m.sentAt)}</span>}
          </p>
        )}
        <div className="ch-bubble-wrap">
          <div
            className="ch-bubble"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a, button') == null) onToggle();
            }}
          >
            {quoted != null && (
              <button type="button" className="ch-quote" onClick={() => onJump(quoted.id)}>
                <strong>{personOf(quoted).name}</strong>
                <span>{snippet(quoted)}</span>
              </button>
            )}
            {m.data.taskTitle != null && m.data.taskTitle !== '' && (
              <span className="ch-task">
                <ListChecks aria-hidden="true" /> Task: {m.data.taskTitle}
              </span>
            )}
            {showText && (
              <p className="ch-text">
                <Linkified text={m.text} />
              </p>
            )}
            {images.length > 0 && (
              <div className="ch-images">
                {images.map((f) => (
                  <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="ch-img" title={f.name}>
                    <img src={f.url} alt={f.name} loading="lazy" />
                  </a>
                ))}
              </div>
            )}
            {others.map((f) => (
              <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="ch-file">
                <FileText />
                <span className="ch-file-name">{f.name}</span>
                {f.size != null && <span className="ch-file-size">{sizeLabel(f.size)}</span>}
              </a>
            ))}
            {m.data.editedAt != null && <span className="ch-edited">(edited)</span>}
          </div>

          {/* Clicks here must not reach the log, which closes the picker on any click. */}
          <div className="ch-actions" role="toolbar" aria-label="Message actions" onClick={(e) => e.stopPropagation()}>
            <IconBtn label="React" onClick={onPicker}>
              <SmilePlus />
            </IconBtn>
            <IconBtn label="Reply" onClick={onReply}>
              <CornerUpLeft />
            </IconBtn>
            {canChange && (
              <>
                <IconBtn label="Edit" onClick={onEdit}>
                  <Pencil />
                </IconBtn>
                <IconBtn label="Delete" onClick={onDelete}>
                  <Trash2 />
                </IconBtn>
              </>
            )}
          </div>
          {picker && (
            <div
              ref={(el) => el?.scrollIntoView({ block: 'nearest' })}
              className="ch-picker"
              role="menu"
              aria-label="Pick a reaction"
              onClick={(e) => e.stopPropagation()}
            >
              {REACTIONS.map((emoji) => (
                <button key={emoji} type="button" role="menuitem" onClick={() => onReact(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {reactions.length > 0 && (
          <div className="ch-reactions">
            {reactions.map(([emoji, people]) => {
              const reacted = people.some((p) => p.toLowerCase() === me.toLowerCase());
              const who = joinNames(people.map(nameOf));
              return (
                <button
                  key={emoji}
                  type="button"
                  className={`ch-reaction${reacted ? ' ch-reacted' : ''}`}
                  aria-label={`${emoji} ${people.length}, from ${who}`}
                  aria-pressed={reacted}
                  onClick={() => onReact(emoji)}
                >
                  {emoji} {people.length}
                  {/* Who reacted: shows on hover or keyboard focus. */}
                  <span className="ch-tip" aria-hidden="true">
                    <span className="ch-tip-emoji">{emoji}</span>
                    {who}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="ch-icon-btn" onClick={onClick} aria-label={label} title={label}>
      {children}
    </button>
  );
}

const CSS = `
.ch { position: relative; display: flex; flex-direction: column; padding: 0; overflow: hidden; }
.ch-log { display: flex; flex-direction: column; gap: 2px; height: min(62vh, 640px); min-height: 280px; overflow-y: auto; padding: 20px 20px 12px; }
.ch-empty { margin: auto; text-align: center; color: var(--ff-muted); display: flex; flex-direction: column; align-items: center; gap: 4px; max-width: 360px; }
.ch-empty svg { width: 36px; height: 36px; color: var(--ff-orange); }
.ch-empty p { margin: 0; }
.ch-empty-title { font-weight: 800; font-size: 19px; color: var(--ff-dark); }

.ch-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0 10px; font-size: 13px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: var(--ff-muted); }
.ch-divider::before, .ch-divider::after { content: ''; flex: 1; height: 1.5px; background: var(--ff-line); }
.ch-divider-new { color: var(--ff-orange-deep); }
.ch-divider-new::before, .ch-divider-new::after { background: var(--ff-orange); }

.ch-row { display: flex; gap: 10px; align-items: flex-end; margin-top: 12px; max-width: 86%; }
.ch-grouped { margin-top: 3px; }
.ch-mine { align-self: flex-end; flex-direction: row-reverse; }
.ch-avatar { flex-shrink: 0; width: 36px; height: 36px; border-radius: 9999px; display: inline-flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; background: var(--ff-line); color: var(--ff-dark); overflow: hidden; }
.ch-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.ch-avatar-gap { background: transparent; height: 0; }
.ch-avatar-ff { background: var(--ff-dark); color: #fff; }
.ch-body { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
.ch-mine .ch-body { align-items: flex-end; }
.ch-meta { margin: 0 0 4px; font-size: 14px; font-weight: 800; color: var(--ff-dark); }
.ch-time { font-weight: 600; color: var(--ff-muted); }

.ch-bubble-wrap { position: relative; display: flex; align-items: center; gap: 6px; max-width: 100%; }
.ch-mine .ch-bubble-wrap { flex-direction: row-reverse; }
.ch-bubble { display: flex; flex-direction: column; gap: 8px; padding: 10px 14px; border-radius: 4px 16px 16px 16px; background: #fff;
  border: 1.5px solid var(--ff-line); color: var(--ff-dark); font-size: 17px; line-height: 1.45; min-width: 0; max-width: 100%;
  transition: box-shadow .3s ease; }
.ch-mine .ch-bubble { background: var(--ff-dark); border-color: var(--ff-dark); color: #fff; border-radius: 16px 4px 16px 16px; }
.ch-flash .ch-bubble { box-shadow: 0 0 0 4px rgba(227,119,83,.45); }
.ch-text { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.ch-link { color: inherit; text-decoration: underline; text-underline-offset: 2px; }
.ch-edited { font-size: 13px; opacity: .7; }
.ch-task { display: inline-flex; align-items: center; gap: 6px; align-self: flex-start; max-width: 100%; font-size: 13px; font-weight: 800;
  padding: 2px 10px; border-radius: 9999px; background: rgba(227,119,83,.14); color: var(--ff-orange-deep); overflow-wrap: anywhere; }
.ch-mine .ch-task { background: rgba(255,255,255,.14); color: #fff; }
.ch-task svg { width: 14px; height: 14px; flex-shrink: 0; }

.ch-quote { display: flex; flex-direction: column; gap: 2px; text-align: left; font: inherit; font-size: 14px; cursor: pointer; color: inherit;
  border: 0; border-left: 3px solid var(--ff-orange); background: rgba(231,222,207,.45); border-radius: 0 8px 8px 0; padding: 6px 10px; }
.ch-mine .ch-quote { background: rgba(255,255,255,.1); }
.ch-quote span { opacity: .85; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

.ch-images { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 6px; }
.ch-img { display: block; border-radius: 8px; overflow: hidden; background: var(--ff-line); }
.ch-img img { display: block; width: 100%; max-height: 260px; object-fit: cover; }
.ch-file { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; text-decoration: none; color: inherit;
  background: var(--ff-cream); border: 1.5px solid var(--ff-line); min-width: 0; }
.ch-mine .ch-file { background: rgba(255,255,255,.08); border-color: rgba(255,255,255,.18); }
.ch-file svg { width: 22px; height: 22px; flex-shrink: 0; color: var(--ff-orange); }
.ch-file-name { font-weight: 800; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ch-file-size { margin-left: auto; font-size: 13px; opacity: .7; white-space: nowrap; }

.ch-actions { display: flex; gap: 2px; padding: 2px; border-radius: 10px; background: var(--ff-card); box-shadow: var(--ff-shadow-sm);
  opacity: 0; pointer-events: none; transition: opacity .15s ease; }
.ch-row:hover .ch-actions, .ch-active .ch-actions, .ch-actions:focus-within { opacity: 1; pointer-events: auto; }
.ch-icon-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border: 0; border-radius: 8px;
  background: transparent; color: var(--ff-muted); cursor: pointer; }
.ch-icon-btn svg { width: 18px; height: 18px; }
.ch-icon-btn:hover { background: var(--ff-line); color: var(--ff-dark); }
.ch-icon-btn:focus-visible, .ch-reaction:focus-visible, .ch-picker button:focus-visible, .ch-quote:focus-visible { outline: 3px solid var(--ff-orange); outline-offset: 2px; }

/* Opens below the message: above, the top message's picker is cut off by the scroll area. */
.ch-picker { position: absolute; top: calc(100% + 6px); left: 0; z-index: 5; display: flex; gap: 2px; padding: 6px; border-radius: 9999px;
  background: var(--ff-card); box-shadow: var(--ff-shadow-card); }
.ch-mine .ch-picker { left: auto; right: 0; }
.ch-picker button { font-size: 22px; line-height: 1; width: 40px; height: 40px; border: 0; border-radius: 9999px; background: transparent; cursor: pointer;
  transition: transform .12s ease; }
.ch-picker button:hover { transform: scale(1.2); background: var(--ff-line); }

.ch-reactions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.ch-reaction { font: inherit; font-size: 14px; font-weight: 800; padding: 2px 10px; border-radius: 9999px; cursor: pointer;
  background: var(--ff-card); border: 1.5px solid var(--ff-line); color: var(--ff-dark); }
.ch-reacted { border-color: var(--ff-orange); background: rgba(227,119,83,.12); }
.ch-reaction { position: relative; }
.ch-tip { position: absolute; bottom: calc(100% + 8px); left: 0; z-index: 6; display: flex; align-items: center; gap: 8px;
  width: max-content; max-width: 260px; padding: 8px 12px; border-radius: 10px; background: var(--ff-dark); color: #fff;
  font-size: 14px; font-weight: 700; line-height: 1.35; text-align: left; white-space: normal; box-shadow: var(--ff-shadow-card);
  opacity: 0; visibility: hidden; transform: translateY(4px); transition: opacity .12s ease, transform .12s ease, visibility .12s; pointer-events: none; }
.ch-mine .ch-tip { left: auto; right: 0; }
.ch-tip-emoji { font-size: 22px; line-height: 1; flex-shrink: 0; }
.ch-reaction:hover .ch-tip, .ch-reaction:focus-visible .ch-tip { opacity: 1; visibility: visible; transform: none; }

.ch-compose { border-top: 1.5px solid var(--ff-line); padding: 12px 20px 14px; display: flex; flex-direction: column; gap: 8px; background: var(--ff-card); }
.ch-bar { display: flex; align-items: center; gap: 8px; padding: 6px 6px 6px 12px; border-left: 3px solid var(--ff-orange); border-radius: 0 8px 8px 0;
  background: #fff; font-size: 15px; }
.ch-bar > svg { width: 16px; height: 16px; color: var(--ff-orange); flex-shrink: 0; }
.ch-bar-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ch-pending { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
.ch-chip { position: relative; overflow: hidden; display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 4px 4px 4px 10px;
  border-radius: 10px; background: #fff; border: 1.5px solid var(--ff-line); font-size: 14px; }
.ch-chip > svg { width: 16px; height: 16px; color: var(--ff-orange); flex-shrink: 0; }
.ch-chip-name { font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
.ch-chip-meta { color: var(--ff-muted); white-space: nowrap; }
.ch-chip-error { border-color: var(--ff-warn); }
.ch-chip-error .ch-chip-meta { color: var(--ff-warn); }
.ch-chip-bar { position: absolute; left: 0; bottom: 0; height: 3px; background: var(--ff-orange); transition: width .2s ease; }
.ch-form { display: flex; gap: 8px; align-items: flex-end; }
.ch-attach { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; flex-shrink: 0; border-radius: 12px;
  cursor: pointer; color: var(--ff-dark); border: 1.5px solid var(--ff-line); background: #fff; }
.ch-attach:hover { border-color: var(--ff-orange); color: var(--ff-orange-deep); }
.ch-attach:focus-within { outline: 3px solid var(--ff-orange); outline-offset: 2px; }
.ch-attach svg { width: 20px; height: 20px; }
.ch-input { flex: 1; resize: none; min-height: 48px; max-height: 200px; field-sizing: content; }
.ch-send { height: 48px; }
.ch-note { margin: 0; font-size: 13px; }
.ch-drop { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px;
  color: var(--ff-dark); background: rgba(244,239,230,.94); border: 3px dashed var(--ff-orange); border-radius: 16px; pointer-events: none; }

@media (hover: none) { .ch-row:hover .ch-actions { opacity: 0; pointer-events: none; } .ch-active .ch-actions { opacity: 1; pointer-events: auto; } }
@media (max-width: 640px) {
  /* Chat fills the space down to the tab bar, so the message box sits at the bottom. */
  .ff-body:has(.ch) { padding-bottom: 12px; }
  .ff-body:has(.ch) > *:has(.ch), .pp-panel:has(> .ch) { flex: 1; min-height: 0; width: 100%; display: flex; flex-direction: column; }
  .ch { flex: 1; min-height: 0; }
  .ch-log { padding: 14px 12px 10px; flex: 1; height: auto; min-height: 160px; }
  .ch-row { max-width: 85%; }
  .ch-mine { max-width: 80%; }
  /* The hidden toolbar beside the bubble steals width on phones: stack it below, only when tapped. */
  .ch-bubble-wrap, .ch-mine .ch-bubble-wrap { flex-direction: column; align-items: flex-start; gap: 4px; }
  .ch-mine .ch-bubble-wrap { align-items: flex-end; }
  .ch-actions { display: none; }
  .ch-active .ch-actions { display: flex; }
  .ch-compose { padding: 10px 12px 12px; }
  .ch-send-label { display: none; }
  .ch-send { width: 48px; padding: 0; justify-content: center; }
  .ch-note { display: none; }
}
@media (prefers-reduced-motion: reduce) { .ch-bubble, .ch-actions, .ch-picker button, .ch-chip-bar, .ch-tip { transition: none; } }
`;
