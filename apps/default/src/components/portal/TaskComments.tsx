import { useMemo, useRef, useState } from 'react';

import { FILES_PROJECT_ID, MESSAGES_PROJECT_ID } from '@/client';
import { SUPPORT_EMAIL } from '@/config';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { createNode, deleteNode } from '@/lib/genesis-data';
import { FileText, FolderOpen, Loader2, Paperclip, Plus, Search, Send, Trash2, X } from '@/lib/icons';
import { PersonAvatar, usePeople } from '@/lib/people';
import { dayLabel, isAgencyEmail, isImage, notifyRelay, saveData, sizeLabel, timeLabel, uploadChatFile } from '@/lib/chat';
import type { ChatData, ChatFile, ChatMessage } from '@/lib/chat';
import { buildIndex, FOLDER_FIELD } from '@/lib/media';
import { today } from '@/lib/scope';
import { noteParts } from '@/lib/task-detail';
import { useTaskComments } from '@/lib/task-comments';

/** New files sent with a task comment are also added to the Files tab, in this folder. */
const TASK_FOLDER = 'Task files';
const SETUP_ERROR = 'Comments are not set up in this portal yet. Please tell Faith Funnels.';

/** A file waiting to go out with the comment: uploading, uploaded (`fresh`), or picked from the Files tab. */
type Pending = { key: string; name: string; pct: number; file?: ChatFile; fresh?: boolean; error?: string };

function newKey(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Comments on one task, inside the task view (TaskSheet).
 * People can write a comment, attach new files, or point to a file already in the Files tab.
 */
export function TaskComments({ taskId, taskTitle }: { taskId: string; taskTitle: string }) {
  const ctx = useTaskComments();
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<Pending[]>([]);
  const [picking, setPicking] = useState(false);
  // While typing, the file buttons fold into one "+" (like a phone keyboard). "+" opens them again.
  const [showTools, setShowTools] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  if (ctx == null) return null;
  const { messages, email, name, byTask } = ctx;
  const comments = byTask.get(taskId) ?? [];
  const meIsAgency = isAgencyEmail(email);
  const isMine = (m: ChatMessage) => (meIsAgency ? m.isAgency : !m.isAgency && m.from.toLowerCase() === email.toLowerCase());

  const uploading = pending.some((p) => p.file == null && p.error == null);
  const ready = pending.filter((p): p is Pending & { file: ChatFile } => p.file != null);
  const toolsOpen = draft === '' || showTools || picking;

  function changeDraft(value: string) {
    setDraft(value);
    if (value === '') setShowTools(false);
  }

  function update(key: string, patch: Partial<Pending>) {
    setPending((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  }

  function addFiles(files: File[]) {
    setNotice(null);
    for (const file of files) {
      const key = newKey();
      setPending((prev) => [...prev, { key, name: file.name, pct: 0 }]);
      uploadChatFile(file, (pct) => update(key, { pct }))
        .then((stored) => update(key, { file: stored, fresh: true, pct: 100 }))
        .catch((err: unknown) => {
          console.error('Task comment upload failed', err);
          update(key, { error: err instanceof Error && err.message.includes('larger than') ? err.message : 'Did not upload. Try again.' });
        });
    }
  }

  function addLibraryFile(file: ChatFile) {
    setPicking(false);
    if (pending.some((p) => p.file?.url === file.url)) return;
    setPending((prev) => [...prev, { key: newKey(), name: file.name, pct: 100, file }]);
    inputRef.current?.focus();
  }

  async function send() {
    const text = draft.trim();
    if (sending || uploading || (text === '' && ready.length === 0)) return;
    setSending(true);
    setNotice(null);
    const now = new Date().toISOString();
    const files = ready.map((p) => p.file);
    const data: ChatData = {
      name: name !== '' ? name : undefined,
      sentAt: now,
      source: 'portal',
      taskId,
      taskTitle,
      ...(files.length > 0 ? { files } : {}),
    };
    try {
      const { id, ignoredKeys } = await createNode(MESSAGES_PROJECT_ID, {
        Message: text !== '' ? text : files.map((f) => f.name).join(', '),
        From: email,
        'Sent At': now,
        Data: JSON.stringify(data),
      });
      // Without Data the comment cannot be tied to its task. Take it back out.
      if (ignoredKeys.includes('Message') || ignoredKeys.includes('From') || ignoredKeys.includes('Data')) {
        if (id != null) await deleteNode(MESSAGES_PROJECT_ID, id);
        throw new Error(SETUP_ERROR);
      }
      notifyRelay(id);
      // New uploads also go in the Files tab, so nothing gets lost. A failure here does not undo the comment.
      for (const p of ready.filter((r) => r.fresh)) {
        await createNode(FILES_PROJECT_ID, {
          'File Name': p.file.name,
          'File URL': p.file.url,
          [FOLDER_FIELD]: TASK_FOLDER,
          'Uploaded By': email,
          'Uploaded At': today(),
          Note: `Task: ${taskTitle}`,
        }).catch((err: unknown) => console.warn('Could not add the file to the Files tab', err));
      }
      changeDraft('');
      setPending([]);
      await messages.refresh();
    } catch (err) {
      console.error('Task comment failed', err);
      setNotice(
        err instanceof Error && err.message === SETUP_ERROR
          ? SETUP_ERROR
          : `Your comment did not send. Please try again, or email ${SUPPORT_EMAIL}.`,
      );
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function remove(m: ChatMessage) {
    if (!window.confirm('Delete this comment?')) return;
    try {
      // Hidden, not erased: the row stays in Taskade (and GHL) as a record.
      await saveData(m.id, m.data, { deleted: true });
      await messages.refresh();
    } catch (err) {
      console.error('Delete failed', err);
      setNotice('That did not work. Please try again.');
    }
  }

  return (
    <div className="tc">
      {comments.length === 0 ? (
        <p className="ff-small" style={{ margin: 0 }}>
          No comments yet. Ask a question or add a file for this task.
        </p>
      ) : (
        <ul className="tc-list">
          {comments.map((m) => (
            <Comment key={m.id} m={m} mine={isMine(m)} onDelete={() => void remove(m)} />
          ))}
        </ul>
      )}

      <form
        className="tc-form"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {pending.length > 0 && (
          <ul className="tc-chips">
            {pending.map((p) => (
              <li key={p.key} className={p.error != null ? 'tc-chip tc-chip-error' : 'tc-chip'}>
                {p.file == null && p.error == null ? <Loader2 className="ff-spin" /> : <FileText />}
                <span className="tc-chip-name">{p.name}</span>
                <span className="tc-chip-meta">
                  {p.error ?? (p.file == null ? `${p.pct}%` : p.fresh ? sizeLabel(p.file.size) : 'From Files')}
                </span>
                <button
                  type="button"
                  className="tc-icon-btn"
                  aria-label={`Remove ${p.name}`}
                  title="Remove"
                  onClick={() => setPending((prev) => prev.filter((x) => x.key !== p.key))}
                >
                  <X />
                </button>
              </li>
            ))}
          </ul>
        )}

        {picking && <FilePicker onPick={addLibraryFile} onClose={() => setPicking(false)} />}

        {/* One row, like a phone's message bar: attach, pick from Files, the text box, send. */}
        <div className="tc-bar">
          {!toolsOpen && (
            <button
              type="button"
              className="tc-icon-btn tc-tool"
              aria-label="Show file options"
              title="Add files"
              onClick={() => setShowTools(true)}
            >
              <Plus aria-hidden="true" />
            </button>
          )}
          <label className="tc-icon-btn tc-tool" title="Attach new files" hidden={!toolsOpen}>
            <Paperclip aria-hidden="true" />
            <span className="td-sr">Attach new files</span>
            <input
              type="file"
              multiple
              className="ob-file"
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = '';
              }}
            />
          </label>
          <button
            type="button"
            className="tc-icon-btn tc-tool"
            aria-label="Add a file from the Files tab"
            title="Add from Files"
            hidden={!toolsOpen}
            aria-expanded={picking}
            onClick={() => setPicking((v) => !v)}
          >
            <FolderOpen aria-hidden="true" />
          </button>
          <textarea
            ref={inputRef}
            className="ff-textarea tc-input"
            rows={1}
            placeholder="Write a comment"
            aria-label="Write a comment"
            value={draft}
            disabled={sending}
            onChange={(e) => changeDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends. Shift + Enter makes a new line. Escape with a draft keeps the task open.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send();
              } else if (e.key === 'Escape' && draft !== '') {
                e.stopPropagation();
                changeDraft('');
              }
            }}
          />
          <button
            type="submit"
            className="tc-send"
            aria-label="Send"
            title="Send"
            disabled={sending || uploading || (draft.trim() === '' && ready.length === 0)}
          >
            {sending ? <Loader2 className="ff-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
          </button>
        </div>
        {notice != null && (
          <p className="ff-error" role="alert" style={{ margin: 0 }}>
            {notice}
          </p>
        )}
      </form>
    </div>
  );
}

function Comment({ m, mine, onDelete }: { m: ChatMessage; mine: boolean; onDelete: () => void }) {
  const files = m.data.files ?? [];
  const images = files.filter(isImage);
  const others = files.filter((f) => !isImage(f));
  // A files-only comment stores the file names as its text; do not show them twice.
  const showText = m.text.trim() !== '' && !(files.length > 0 && m.text === files.map((f) => f.name).join(', '));
  const when = m.sentAt != null ? `${dayLabel(m.sentAt)}, ${timeLabel(m.sentAt)}` : '';
  // Name and photo from their profile, so a change there shows here at once.
  const person = usePeople().who(m.from, m.name, m.isAgency);
  return (
    <li className="tc-item">
      <PersonAvatar person={person} />
      <div className="tc-body">
        <p className="tc-meta">
          {mine ? 'You' : person.name}
          {when !== '' && <span className="tc-time"> · {when}</span>}
          {mine && m.data.source !== 'ghl' && (
            <button type="button" className="tc-icon-btn tc-del" aria-label="Delete comment" title="Delete" onClick={onDelete}>
              <Trash2 />
            </button>
          )}
        </p>
        {showText && (
          <p className="tc-text">
            {noteParts(m.text).map((part, i) =>
              'url' in part ? (
                <a key={i} className="ff-link" href={part.url} target="_blank" rel="noreferrer">
                  {part.text}
                </a>
              ) : (
                <span key={i}>{part.text}</span>
              ),
            )}
          </p>
        )}
        {images.length > 0 && (
          <div className="td-images">
            {images.map((f) => (
              <a key={f.url} className="td-image" href={f.url} target="_blank" rel="noreferrer" title={f.name}>
                <img src={f.url} alt={f.name} loading="lazy" />
              </a>
            ))}
          </div>
        )}
        {others.map((f) => (
          <a key={f.url} className="td-file" href={f.url} target="_blank" rel="noreferrer">
            <span className="td-file-icon">
              <FileText />
            </span>
            <span className="td-file-name">{f.name}</span>
            {f.size != null && <span className="tc-time">{sizeLabel(f.size)}</span>}
          </a>
        ))}
      </div>
    </li>
  );
}

/** Pick a file that is already in the Files tab. */
function FilePicker({ onPick, onClose }: { onPick: (file: ChatFile) => void; onClose: () => void }) {
  const { nodes, loading, error } = useLiveNodes(FILES_PROJECT_ID);
  const files = useMemo(() => buildIndex(nodes).files, [nodes]);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = q === '' ? files : files.filter((f) => `${f.folder}/${f.name}`.toLowerCase().includes(q));

  return (
    <div className="tc-pick">
      <div className="tc-pick-head">
        <Search aria-hidden="true" />
        <input
          className="tc-pick-search"
          type="search"
          placeholder="Search your files"
          aria-label="Search your files"
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              onClose();
            }
          }}
        />
        <button type="button" className="tc-icon-btn" aria-label="Close file list" title="Close" onClick={onClose}>
          <X />
        </button>
      </div>
      {loading && files.length === 0 ? (
        <p className="ff-small tc-pick-empty">
          <Loader2 className="ff-spin" /> Loading files
        </p>
      ) : error != null && files.length === 0 ? (
        <p className="ff-error tc-pick-empty">We could not load your files.</p>
      ) : shown.length === 0 ? (
        <p className="ff-small tc-pick-empty">{files.length === 0 ? 'No files in the Files tab yet.' : 'No file matches that.'}</p>
      ) : (
        <ul className="tc-pick-list">
          {shown.map((f) => (
            <li key={f.id}>
              <button type="button" className="tc-pick-item" onClick={() => onPick({ name: f.name, url: f.url })}>
                <FileText aria-hidden="true" />
                <span className="tc-pick-name">{f.name}</span>
                {f.folder !== '' && <span className="tc-time">{f.folder.split('/').join(' / ')}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
