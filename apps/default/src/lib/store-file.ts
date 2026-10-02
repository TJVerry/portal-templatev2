import { UPLOAD_FLOW_ID } from '@/client';
import { gatewayRequest } from '@/lib/genesis-gateway';
import { uploadFile } from '@/lib/genesis-data';
import { UPLOAD_MAX_BYTES } from '@/lib/genesis-data/upload';

/** Common types by extension. The browser leaves `type` empty for some files (and the flow refuses those). */
const TYPES: Record<string, string> = {
  txt: 'text/plain',
  csv: 'text/csv',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  heic: 'image/heic',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  zip: 'application/zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ai: 'application/postscript',
  eps: 'application/postscript',
  psd: 'image/vnd.adobe.photoshop',
};

/** Shown to the person as is. Callers check for this text. */
export const UNSUPPORTED = 'cannot be uploaded here';

/**
 * The upload flow (tested Oct 2026) answers 500 for a "%" in the name, and 400 for:
 * no extension, an empty or application/octet-stream type, and SVG.
 * So: clean the name, fill in the type, and stop early with a clear message for the rest.
 * The portal still shows the original name; only the stored copy gets the clean one.
 */
function flowSafeFile(file: File): File {
  const name = file.name.replace(/[%\\/]/g, '-');
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
  const generic = file.type === '' || file.type === 'application/octet-stream';
  const type = generic ? (TYPES[ext] ?? '') : file.type;
  if (ext === '' || type === '' || ext === 'svg' || type === 'image/svg+xml') {
    throw new Error(`"${file.name}" ${UNSUPPORTED}. Save it as a PDF, PNG or JPG, or zip it, then try again.`);
  }
  return name === file.name && type === file.type ? file : new File([file], name, { type });
}

/**
 * Taskade's direct upload route is still rolling out. It answers 404 here, and Taskade shows that
 * to people as "Request failed 404" even though the flow below then works. So it starts off.
 * Set to false to try it again once Taskade turns it on (after one 404 we stop trying it).
 */
let directUploadOff = true;

/**
 * Saves one file to this space's Taskade Media library and returns its link.
 *
 * 1. Taskade's direct upload (`uploadFile`), when it is switched on for the account.
 * 2. Otherwise the "Portal File Upload" automation (webhook trigger with a File input
 *    named `file`, and a Webhook Output `url` = that file). Its id is UPLOAD_FLOW_ID in client.ts.
 */
export async function storeFile(file: File): Promise<{ url: string; name: string }> {
  if (!directUploadOff) {
    try {
      const stored = await uploadFile(file);
      return { url: stored.url, name: stored.name };
    } catch (err) {
      if (!(err instanceof Error && err.message.startsWith('File upload is not available'))) throw err;
      directUploadOff = true;
    }
  }
  if (UPLOAD_FLOW_ID === '') {
    throw new Error('File upload is not set up for this portal (UPLOAD_FLOW_ID is empty).');
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    throw new Error(`"${file.name}" is larger than 10 MB. Choose a smaller file.`);
  }
  const upload = flowSafeFile(file);
  const body = new FormData();
  body.append('file', upload, upload.name);
  const data = await gatewayRequest<{ url?: unknown }>(`/webhooks/${encodeURIComponent(UPLOAD_FLOW_ID)}/run`, {
    method: 'POST',
    body,
    signal: AbortSignal.timeout(120_000),
  });
  if (typeof data.url !== 'string' || !data.url.startsWith('https://')) {
    throw new Error('The upload did not return a file URL');
  }
  return { url: data.url, name: file.name };
}
