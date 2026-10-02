import { getFieldValue, getTitle } from '@/lib/genesis-data';
import type { GenesisNode } from '@/lib/genesis-data';

/**
 * Media library on top of the "Portal — Files" list.
 *
 * The file itself lives in the Taskade Media library (uploadFile). Each row in the list is its card:
 * - File row: File URL set. Folder = where it sits ("" = top, "Logos/Old" = nested).
 * - Folder row: no File URL, Folder set. It keeps an empty folder alive.
 * Rows with neither are ignored.
 */
export const FOLDER_FIELD = 'Folder';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  folder: string;
  by: string;
  at: string;
  note: string;
  kind: 'image' | 'video' | 'pdf' | 'doc' | 'other';
}

export interface MediaIndex {
  files: MediaFile[];
  /** Every folder path, sorted A to Z. */
  folders: string[];
  /** Folder rows by path, so empty folders can be renamed and deleted. */
  folderRows: Map<string, string[]>;
}

/** Trims slashes and spaces around each part: " Logos / Old/ " -> "Logos/Old". */
export function cleanPath(path: string): string {
  return path
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .join('/');
}

export function parentOf(path: string): string {
  const at = path.lastIndexOf('/');
  return at === -1 ? '' : path.slice(0, at);
}

export function baseName(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

/** True when `path` is `folder` or sits inside it. */
export function isInside(path: string, folder: string): boolean {
  return path === folder || path.startsWith(`${folder}/`);
}

/** A folder name typed by a person. Returns an error message, or null when it is fine. */
export function checkFolderName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'Type a folder name.';
  if (trimmed.includes('/')) return 'A folder name cannot have a "/" in it.';
  if (trimmed.length > 60) return 'Use 60 characters or less.';
  return null;
}

export function kindOf(name: string, url: string): MediaFile['kind'] {
  const ext = (name.match(/\.([a-z0-9]+)$/i) ?? url.split('?')[0].match(/\.([a-z0-9]+)$/i))?.[1]?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'heic', 'heif'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'webm', 'm4v'].includes(ext)) return 'video';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'pages', 'key'].includes(ext)) return 'doc';
  return 'other';
}

export function buildIndex(nodes: GenesisNode[]): MediaIndex {
  const files: MediaFile[] = [];
  const folderRows = new Map<string, string[]>();
  const all = new Set<string>();

  const addWithParents = (path: string) => {
    let p = path;
    while (p !== '') {
      all.add(p);
      p = parentOf(p);
    }
  };

  for (const row of nodes) {
    const url = getFieldValue(row, 'File URL') ?? '';
    const folder = cleanPath(getFieldValue(row, FOLDER_FIELD) ?? '');
    if (url === '') {
      if (folder === '') continue;
      folderRows.set(folder, [...(folderRows.get(folder) ?? []), row.id]);
      addWithParents(folder);
      continue;
    }
    const name = getTitle(row, 'File Name') ?? 'File';
    files.push({
      id: row.id,
      name,
      url,
      folder,
      by: getFieldValue(row, 'Uploaded By') ?? '',
      at: getFieldValue(row, 'Uploaded At') ?? '',
      note: getFieldValue(row, 'Note') ?? '',
      kind: kindOf(name, url),
    });
    addWithParents(folder);
  }

  // Newest first, then A to Z.
  files.sort((a, b) => b.at.localeCompare(a.at) || a.name.localeCompare(b.name));
  const folders = [...all].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  return { files, folders, folderRows };
}

/** Direct child folders of `path`. */
export function childFolders(index: MediaIndex, path: string): string[] {
  return index.folders.filter((f) => parentOf(f) === path);
}

/** How many files sit in `folder` or any folder inside it. */
export function countInside(index: MediaIndex, folder: string): number {
  return index.files.filter((f) => isInside(f.folder, folder)).length;
}
