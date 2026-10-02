import { useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent, ReactNode } from 'react';

import { TabState } from '@/components/portal/TabState';
import { FILES_PROJECT_ID } from '@/client';
import { SUPPORT_EMAIL } from '@/config';
import { useLiveNodes } from '@/hooks/use-live-nodes';
import { today } from '@/lib/scope';
import { createNode, deleteNode, updateNode } from '@/lib/genesis-data';
import {
  Check,
  ChevronRight,
  ExternalLink,
  FileIcon,
  FileText,
  Film,
  Folder,
  FolderInput,
  FolderPlus,
  House,
  ImageIcon,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from '@/lib/icons';
import {
  FOLDER_FIELD,
  baseName,
  buildIndex,
  checkFolderName,
  childFolders,
  cleanPath,
  countInside,
  isInside,
  parentOf,
} from '@/lib/media';
import type { MediaFile } from '@/lib/media';
import { usePeople } from '@/lib/people';
import { storeFile, UNSUPPORTED } from '@/lib/store-file';

type View = 'grid' | 'list';
type UploadRow = { key: string; name: string; state: 'busy' | 'done' | 'error'; error?: string };
type FileEdit = { id: string; mode: 'move' | 'rename' | 'delete'; value: string };
type FolderEdit = { path: string; mode: 'rename' | 'delete'; value: string };

const DRAG_TYPE = 'application/x-ff-file';
const VIEW_KEY = 'ff-files-view';
const SETUP_ERROR = 'Folders are not set up in this portal yet. Please tell Faith Funnels.';

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

function folderLabel(path: string): string {
  return path === '' ? 'All files' : path.split('/').join(' / ');
}

/**
 * Media library: folders, uploads (many at once, drag and drop), move, rename, delete.
 * Files are stored in the Taskade Media library. The "Portal — Files" list is the index,
 * with a Folder column (see lib/media.ts).
 */
export function FilesTab({ email }: { email: string }) {
  const { nodes, loading, error, refresh } = useLiveNodes(FILES_PROJECT_ID);
  const index = useMemo(() => buildIndex(nodes), [nodes]);

  const [path, setPath] = useState('');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<View>(readView);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [newFolder, setNewFolder] = useState<string | null>(null);
  const [fileEdit, setFileEdit] = useState<FileEdit | null>(null);
  const [folderEdit, setFolderEdit] = useState<FolderEdit | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // If the open folder disappears (renamed or deleted elsewhere), go up.
  useEffect(() => {
    if (!loading && path !== '' && !index.folders.includes(path)) setPath(parentOf(path));
  }, [index.folders, loading, path]);

  function changeView(next: View) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // Private window: the choice lasts until reload.
    }
  }

  function openFolder(next: string) {
    setPath(next);
    setQuery('');
    setFileEdit(null);
    setFolderEdit(null);
    setMessage(null);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      console.error('Files action failed', err);
      setMessage(err instanceof Error && err.message === SETUP_ERROR ? SETUP_ERROR : 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function uploadMany(list: FileList | File[], folder: string) {
    const files = Array.from(list);
    if (files.length === 0) return;
    const batch = files.map((file, i) => ({ key: `${Date.now()}-${i}`, name: file.name, state: 'busy' as const }));
    setUploads((prev) => [...prev.filter((u) => u.state === 'busy'), ...batch]);
    for (let i = 0; i < files.length; i += 1) {
      const { key } = batch[i];
      try {
        const stored = await storeFile(files[i]);
        const { ignoredKeys } = await createNode(FILES_PROJECT_ID, {
          'File Name': stored.name,
          'File URL': stored.url,
          [FOLDER_FIELD]: folder,
          'Uploaded By': email,
          'Uploaded At': today(),
        });
        if (folder !== '' && ignoredKeys.includes(FOLDER_FIELD)) setMessage(SETUP_ERROR);
        setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, state: 'done' } : u)));
      } catch (err) {
        console.error('Upload failed', err);
        const text =
          err instanceof Error && err.message.includes('larger than 10 MB')
            ? 'Too big. The limit is 10 MB.'
            : err instanceof Error && err.message.includes(UNSUPPORTED)
              ? err.message
              : `Did not upload. Email it to ${SUPPORT_EMAIL}.`;
        setUploads((prev) => prev.map((u) => (u.key === key ? { ...u, state: 'error', error: text } : u)));
      }
    }
    await refresh();
  }

  async function createFolder(name: string) {
    const problem = checkFolderName(name);
    if (problem != null) {
      setMessage(problem);
      return;
    }
    const full = cleanPath(`${path}/${name}`);
    if (index.folders.includes(full)) {
      setMessage(`There is already a folder called "${name.trim()}" here.`);
      return;
    }
    await run(async () => {
      const { id, ignoredKeys } = await createNode(FILES_PROJECT_ID, {
        'File Name': name.trim(),
        [FOLDER_FIELD]: full,
        'Uploaded By': email,
        'Uploaded At': today(),
        Note: 'Folder',
      });
      if (ignoredKeys.includes(FOLDER_FIELD)) {
        if (id != null) await deleteNode(FILES_PROJECT_ID, id);
        throw new Error(SETUP_ERROR);
      }
      setNewFolder(null);
    });
  }

  async function renameFolder(from: string, name: string) {
    const problem = checkFolderName(name);
    if (problem != null) {
      setMessage(problem);
      return;
    }
    const to = cleanPath(`${parentOf(from)}/${name}`);
    if (to === from) {
      setFolderEdit(null);
      return;
    }
    if (index.folders.includes(to)) {
      setMessage(`There is already a folder called "${name.trim()}" here.`);
      return;
    }
    const moved = (p: string) => to + p.slice(from.length);
    await run(async () => {
      for (const file of index.files.filter((f) => isInside(f.folder, from))) {
        await updateNode(FILES_PROJECT_ID, file.id, { [FOLDER_FIELD]: moved(file.folder) });
      }
      for (const [folder, ids] of index.folderRows) {
        if (!isInside(folder, from)) continue;
        for (const id of ids) {
          await updateNode(FILES_PROJECT_ID, id, { [FOLDER_FIELD]: moved(folder), 'File Name': baseName(moved(folder)) });
        }
      }
      setFolderEdit(null);
    });
  }

  async function deleteFolder(folder: string) {
    const inside = countInside(index, folder);
    if (inside > 0) {
      setMessage(`Move or delete the ${inside} file${inside === 1 ? '' : 's'} in "${baseName(folder)}" first.`);
      setFolderEdit(null);
      return;
    }
    await run(async () => {
      for (const [p, ids] of index.folderRows) {
        if (!isInside(p, folder)) continue;
        for (const id of ids) await deleteNode(FILES_PROJECT_ID, id);
      }
      setFolderEdit(null);
    });
  }

  const moveFile = (id: string, to: string) =>
    run(async () => {
      await updateNode(FILES_PROJECT_ID, id, { [FOLDER_FIELD]: to });
      setFileEdit(null);
    });

  const renameFile = (id: string, name: string) =>
    name.trim() === ''
      ? Promise.resolve(setMessage('Type a file name.'))
      : run(async () => {
          await updateNode(FILES_PROJECT_ID, id, { 'File Name': name.trim() });
          setFileEdit(null);
        });

  const deleteFile = (id: string) =>
    run(async () => {
      await deleteNode(FILES_PROJECT_ID, id);
      setFileEdit(null);
    });

  // Drag and drop: a file card onto a folder moves it; files from the computer upload into it.
  function dropProps(folder: string) {
    return {
      onDragOver: (e: DragEvent) => {
        const types = Array.from(e.dataTransfer.types);
        if (!types.includes(DRAG_TYPE) && !types.includes('Files')) return;
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(folder);
      },
      onDragLeave: (e: DragEvent) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        setDropTarget((t) => (t === folder ? null : t));
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTarget(null);
        const id = e.dataTransfer.getData(DRAG_TYPE);
        if (id !== '') {
          const file = index.files.find((f) => f.id === id);
          if (file != null && file.folder !== folder) void moveFile(id, folder);
          return;
        }
        if (e.dataTransfer.files.length > 0) void uploadMany(e.dataTransfer.files, folder);
      },
    };
  }

  const q = query.trim().toLowerCase();
  const searching = q !== '';
  const shownFolders = searching
    ? index.folders.filter((f) => baseName(f).toLowerCase().includes(q))
    : childFolders(index, path);
  const shownFiles = searching
    ? index.files.filter((f) => `${f.name} ${f.note}`.toLowerCase().includes(q))
    : index.files.filter((f) => f.folder === path);
  const crumbs = path === '' ? [] : path.split('/').map((_, i, parts) => parts.slice(0, i + 1).join('/'));
  const uploading = uploads.some((u) => u.state === 'busy');
  const total = index.files.length + index.folders.length;

  return (
    <div className="ff-stack ml">
      <section className="ff-item ml-bar">
        <nav className="ml-crumbs" aria-label="Folder path">
          <button
            type="button"
            className={`ml-crumb${dropTarget === '' ? ' ml-drop' : ''}`}
            onClick={() => openFolder('')}
            aria-current={path === '' && !searching ? 'page' : undefined}
            {...dropProps('')}
          >
            <House /> All files
          </button>
          {!searching &&
            crumbs.map((crumb) => (
              <span key={crumb} className="ml-crumb-wrap">
                <ChevronRight className="ml-crumb-sep" />
                <button
                  type="button"
                  className={`ml-crumb${dropTarget === crumb ? ' ml-drop' : ''}`}
                  onClick={() => openFolder(crumb)}
                  aria-current={crumb === path ? 'page' : undefined}
                  {...dropProps(crumb)}
                >
                  {baseName(crumb)}
                </button>
              </span>
            ))}
          {searching && (
            <span className="ml-crumb-wrap">
              <ChevronRight className="ml-crumb-sep" />
              <span className="ml-crumb ml-crumb-static">Search results</span>
            </span>
          )}
        </nav>

        <div className="ml-tools">
          <label className="ml-search">
            <Search />
            <input
              className="ff-input"
              type="search"
              placeholder="Search all files"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search all files"
            />
          </label>
          <div className="ml-toggle" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'grid'} onClick={() => changeView('grid')} aria-label="Grid view" title="Grid view">
              <LayoutGrid />
            </button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => changeView('list')} aria-label="List view" title="List view">
              <List />
            </button>
          </div>
          <button
            type="button"
            className="ff-btn ff-btn-secondary ff-btn-sm"
            disabled={busy || searching}
            onClick={() => {
              setNewFolder('');
              setMessage(null);
            }}
          >
            <FolderPlus /> New folder
          </button>
          <label className={`ff-btn ff-btn-primary ff-btn-sm${uploading ? ' ml-disabled' : ''}`}>
            {uploading ? <Loader2 className="ff-spin" /> : <Upload />}
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              ref={inputRef}
              type="file"
              multiple
              className="ob-file"
              disabled={uploading}
              onChange={(e) => {
                const list = e.target.files;
                if (list != null) void uploadMany(Array.from(list), path);
                e.target.value = '';
              }}
            />
          </label>
        </div>

        {newFolder != null && (
          <form
            className="ml-inline"
            onSubmit={(e) => {
              e.preventDefault();
              void createFolder(newFolder);
            }}
          >
            <FolderPlus className="ml-inline-icon" />
            <input
              className="ff-input"
              autoFocus
              value={newFolder}
              placeholder={`New folder in ${folderLabel(path)}`}
              aria-label="Folder name"
              onChange={(e) => setNewFolder(e.target.value)}
              disabled={busy}
            />
            <button type="submit" className="ff-btn ff-btn-primary ff-btn-sm" disabled={busy}>
              {busy ? <Loader2 className="ff-spin" /> : <Check />} Create
            </button>
            <button type="button" className="ff-btn ff-btn-ghost ff-btn-sm" onClick={() => setNewFolder(null)} aria-label="Cancel">
              <X />
            </button>
          </form>
        )}

        {message != null && (
          <p className="ff-error" role="alert">
            {message}
          </p>
        )}

        {uploads.length > 0 && (
          <ul className="ml-uploads">
            {uploads.map((u) => (
              <li key={u.key} className={`ml-upload ml-upload-${u.state}`}>
                {u.state === 'busy' ? <Loader2 className="ff-spin" /> : u.state === 'done' ? <Check /> : <X />}
                <span className="ml-upload-name">{u.name}</span>
                {u.error != null && <span className="ml-upload-error">{u.error}</span>}
              </li>
            ))}
            {!uploading && (
              <li>
                <button type="button" className="ff-btn ff-btn-ghost ff-btn-sm" onClick={() => setUploads([])}>
                  Clear
                </button>
              </li>
            )}
          </ul>
        )}
      </section>

      {(loading || (error != null && total === 0)) && <TabState loading={loading} error={error} count={0} empty={null} />}

      {!loading && !(error != null && total === 0) && (
        <div className={`ml-area${dropTarget === path && !searching ? ' ml-drop' : ''}`} {...(searching ? {} : dropProps(path))}>
          {shownFolders.length > 0 && (
            <section>
              <p className="ff-count ml-section">Folders</p>
              <div className="ml-folders">
                {shownFolders.map((folder) => {
                  const count = countInside(index, folder);
                  const editing = folderEdit?.path === folder ? folderEdit : null;
                  return (
                    <div key={folder} className={`ml-folder ff-lift${dropTarget === folder ? ' ml-drop' : ''}`} {...dropProps(folder)}>
                      {editing?.mode === 'rename' ? (
                        <form
                          className="ml-inline ml-inline-tight"
                          onSubmit={(e) => {
                            e.preventDefault();
                            void renameFolder(folder, editing.value);
                          }}
                        >
                          <input
                            className="ff-input"
                            autoFocus
                            value={editing.value}
                            aria-label="New folder name"
                            onChange={(e) => setFolderEdit({ ...editing, value: e.target.value })}
                            disabled={busy}
                          />
                          <IconBtn label="Save" type="submit" disabled={busy}>
                            <Check />
                          </IconBtn>
                          <IconBtn label="Cancel" onClick={() => setFolderEdit(null)}>
                            <X />
                          </IconBtn>
                        </form>
                      ) : editing?.mode === 'delete' ? (
                        <div className="ml-inline ml-inline-tight">
                          <span className="ml-confirm">Delete "{baseName(folder)}"?</span>
                          <button type="button" className="ff-btn ff-btn-primary ff-btn-sm ml-danger" disabled={busy} onClick={() => void deleteFolder(folder)}>
                            Delete
                          </button>
                          <IconBtn label="Cancel" onClick={() => setFolderEdit(null)}>
                            <X />
                          </IconBtn>
                        </div>
                      ) : (
                        <>
                          <button type="button" className="ml-folder-open" onClick={() => openFolder(folder)}>
                            <Folder className="ml-folder-icon" />
                            <span className="ml-folder-text">
                              <span className="ml-name">{baseName(folder)}</span>
                              <span className="ml-meta">
                                {searching ? `${folderLabel(parentOf(folder))} · ` : ''}
                                {count} file{count === 1 ? '' : 's'}
                              </span>
                            </span>
                          </button>
                          <span className="ml-actions">
                            <IconBtn label="Rename folder" onClick={() => setFolderEdit({ path: folder, mode: 'rename', value: baseName(folder) })}>
                              <Pencil />
                            </IconBtn>
                            <IconBtn label="Delete folder" onClick={() => setFolderEdit({ path: folder, mode: 'delete', value: '' })}>
                              <Trash2 />
                            </IconBtn>
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {shownFiles.length > 0 && (
            <section>
              <p className="ff-count ml-section">Files</p>
              <div className={view === 'grid' ? 'ml-grid' : 'ml-list'}>
                {shownFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    view={view}
                    showFolder={searching}
                    edit={fileEdit?.id === file.id ? fileEdit : null}
                    folders={index.folders}
                    busy={busy}
                    onEdit={setFileEdit}
                    onMove={(to) => void moveFile(file.id, to)}
                    onRename={(name) => void renameFile(file.id, name)}
                    onDelete={() => void deleteFile(file.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {shownFolders.length === 0 && shownFiles.length === 0 && (
            <div className="ml-empty">
              {searching ? (
                <p>No files match "{query.trim()}".</p>
              ) : (
                <>
                  <Upload />
                  <p className="ml-name">{path === '' ? 'No files yet' : 'This folder is empty'}</p>
                  <p>Drop files here, or press Upload. Up to 10 MB each.</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  type = 'button',
  disabled,
  href,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  type?: 'button' | 'submit';
  disabled?: boolean;
  href?: string;
}) {
  if (href != null) {
    return (
      <a className="ml-icon-btn" href={href} target="_blank" rel="noreferrer" aria-label={label} title={label}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className="ml-icon-btn" onClick={onClick} aria-label={label} title={label} disabled={disabled}>
      {children}
    </button>
  );
}

function Thumb({ file }: { file: MediaFile }) {
  const [broken, setBroken] = useState(false);
  if (file.kind === 'image' && !broken) {
    return <img className="ml-thumb-img" src={file.url} alt="" loading="lazy" onError={() => setBroken(true)} />;
  }
  const Icon = file.kind === 'image' ? ImageIcon : file.kind === 'video' ? Film : file.kind === 'pdf' || file.kind === 'doc' ? FileText : FileIcon;
  const ext = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toUpperCase();
  return (
    <span className="ml-thumb-icon">
      <Icon />
      {ext != null && <span className="ml-ext">{ext}</span>}
    </span>
  );
}

function FileCard({
  file,
  view,
  showFolder,
  edit,
  folders,
  busy,
  onEdit,
  onMove,
  onRename,
  onDelete,
}: {
  file: MediaFile;
  view: View;
  showFolder: boolean;
  edit: FileEdit | null;
  folders: string[];
  busy: boolean;
  onEdit: (edit: FileEdit | null) => void;
  onMove: (to: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  // "Uploaded By" holds an email: show that person's current name.
  const people = usePeople();
  const by = file.by.includes('@') ? people.who(file.by).name : file.by;
  const meta = [showFolder ? folderLabel(file.folder) : '', by, file.at, file.note].filter((v) => v !== '').join(' · ');
  return (
    <article
      className={`ml-file ff-lift ml-file-${view}`}
      draggable={edit == null}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, file.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <a className="ml-thumb" href={file.url} target="_blank" rel="noreferrer" aria-label={`Open ${file.name}`} draggable={false}>
        <Thumb file={file} />
      </a>
      <div className="ml-file-body">
        <p className="ml-name" title={file.name}>
          {file.name}
        </p>
        {meta !== '' && <p className="ml-meta">{meta}</p>}

        {edit?.mode === 'move' && (
          <form
            className="ml-inline ml-inline-tight"
            onSubmit={(e) => {
              e.preventDefault();
              onMove(edit.value);
            }}
          >
            <select className="ff-input" value={edit.value} aria-label="Move to folder" onChange={(e) => onEdit({ ...edit, value: e.target.value })} disabled={busy}>
              <option value="">All files (top)</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {folderLabel(f)}
                </option>
              ))}
            </select>
            <IconBtn label="Move here" type="submit" disabled={busy || edit.value === file.folder}>
              <Check />
            </IconBtn>
            <IconBtn label="Cancel" onClick={() => onEdit(null)}>
              <X />
            </IconBtn>
          </form>
        )}
        {edit?.mode === 'rename' && (
          <form
            className="ml-inline ml-inline-tight"
            onSubmit={(e) => {
              e.preventDefault();
              onRename(edit.value);
            }}
          >
            <input className="ff-input" autoFocus value={edit.value} aria-label="New file name" onChange={(e) => onEdit({ ...edit, value: e.target.value })} disabled={busy} />
            <IconBtn label="Save" type="submit" disabled={busy}>
              <Check />
            </IconBtn>
            <IconBtn label="Cancel" onClick={() => onEdit(null)}>
              <X />
            </IconBtn>
          </form>
        )}
        {edit?.mode === 'delete' && (
          <div className="ml-inline ml-inline-tight">
            <span className="ml-confirm">Delete this file?</span>
            <button type="button" className="ff-btn ff-btn-primary ff-btn-sm ml-danger" disabled={busy} onClick={onDelete}>
              Delete
            </button>
            <IconBtn label="Cancel" onClick={() => onEdit(null)}>
              <X />
            </IconBtn>
          </div>
        )}
      </div>
      {edit == null && (
        <span className="ml-actions">
          <IconBtn label="Open" href={file.url}>
            <ExternalLink />
          </IconBtn>
          <IconBtn label="Move to folder" onClick={() => onEdit({ id: file.id, mode: 'move', value: file.folder })}>
            <FolderInput />
          </IconBtn>
          <IconBtn label="Rename" onClick={() => onEdit({ id: file.id, mode: 'rename', value: file.name })}>
            <Pencil />
          </IconBtn>
          <IconBtn label="Delete" onClick={() => onEdit({ id: file.id, mode: 'delete', value: '' })}>
            <Trash2 />
          </IconBtn>
        </span>
      )}
    </article>
  );
}
