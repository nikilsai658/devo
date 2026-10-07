import { HttpResponse } from '@angular/common/http';

// Same list as the API (MaterialStorage): anything else is refused there, so refuse it here first.
export const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.csv', '.txt', '.md', '.rtf',
  '.png', '.jpg', '.jpeg', '.gif', '.webp',
  '.mp4', '.webm', '.mp3', '.wav',
  '.zip', '.java', '.py', '.c', '.cpp', '.cs', '.js', '.ts', '.json', '.sql', '.ipynb'
];

// The web server in front of the API rejects request bodies over 25 MB (the API itself allows 50).
export const MAX_UPLOAD_MB = 25;

export const MATERIAL_TYPES = ['PDF', 'Video', 'Image', 'PPT', 'DOC', 'Excel', 'ZIP', 'Code', 'Audio'];

const TYPE_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'PDF',
  '.doc': 'DOC', '.docx': 'DOC', '.rtf': 'DOC', '.txt': 'DOC', '.md': 'DOC',
  '.ppt': 'PPT', '.pptx': 'PPT',
  '.xls': 'Excel', '.xlsx': 'Excel', '.csv': 'Excel',
  '.png': 'Image', '.jpg': 'Image', '.jpeg': 'Image', '.gif': 'Image', '.webp': 'Image',
  '.mp4': 'Video', '.webm': 'Video',
  '.mp3': 'Audio', '.wav': 'Audio',
  '.zip': 'ZIP',
  '.java': 'Code', '.py': 'Code', '.c': 'Code', '.cpp': 'Code', '.cs': 'Code', '.js': 'Code',
  '.ts': 'Code', '.json': 'Code', '.sql': 'Code', '.ipynb': 'Code'
};

export function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot < 0 ? '' : fileName.substring(dot).toLowerCase();
}

export function guessMaterialType(fileName: string): string {
  return TYPE_BY_EXTENSION[extensionOf(fileName)] ?? '';
}

// Returns a message when the file cannot be uploaded, otherwise null.
export function validateUpload(file: File): string | null {
  if (!ALLOWED_EXTENSIONS.includes(extensionOf(file.name))) {
    return 'This file type is not allowed. Allowed: ' + ALLOWED_EXTENSIONS.join(', ');
  }
  if (file.size === 0) {
    return 'The file is empty.';
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `The file is larger than ${MAX_UPLOAD_MB} MB.`;
  }
  return null;
}

// Spreadsheets accepted by the bulk endpoints (user import, year promotion).
export const SPREADSHEET_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

// Returns a message when the file is not a spreadsheet the bulk endpoints accept, otherwise null.
export function validateSpreadsheet(file: File): string | null {
  if (!SPREADSHEET_EXTENSIONS.includes(extensionOf(file.name))) {
    return 'Please choose a CSV or Excel file (' + SPREADSHEET_EXTENSIONS.join(', ') + ').';
  }
  if (file.size === 0) {
    return 'The file is empty.';
  }
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
    return `The file is larger than ${MAX_UPLOAD_MB} MB.`;
  }
  return null;
}

export function formatSize(bytes: number): string {
  if (!bytes) {
    return '-';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Types a browser can show inline without running anything. A blob: URL has this app's origin,
// so an HTML or SVG file opened from it could run script with the user's session.
const INLINE_SAFE_TYPES = /^(application\/pdf|image\/(png|jpe?g|gif|webp)|video\/(mp4|webm)|audio\/(mpeg|mp3|wav|x-wav|webm))$/i;

// A blob that is safe to open in a tab: viewable media as-is, any text as plain text, anything
// else null (offer a download instead).
export function previewableBlob(blob: Blob): Blob | null {
  const type = (blob.type || '').split(';')[0].trim().toLowerCase();
  if (INLINE_SAFE_TYPES.test(type)) {
    return blob;
  }
  if (type.startsWith('text/') || type === 'application/json') {
    return new Blob([blob], { type: 'text/plain;charset=utf-8' });
  }
  return null;
}

// How long an opened preview's blob: URL stays valid (the tab has loaded it by then).
const PREVIEW_URL_LIFETIME_MS = 60_000;

// Shows the blob in an already-opened tab, then releases the blob URL.
export function showBlobInTab(tab: Window, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  tab.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), PREVIEW_URL_LIFETIME_MS);
}

// Saves a blob response (from GETBlob) using the file name the server sent.
export function saveBlobResponse(res: HttpResponse<Blob>, fallbackName: string): void {
  const blob = res.body;
  if (!blob) {
    return;
  }
  saveBlob(blob, fileNameFromResponse(res) ?? fallbackName);
}

// The file name in a Content-Disposition header (filename* or filename), or null.
export function fileNameFromResponse(res: HttpResponse<Blob>): string | null {
  const disposition = res.headers?.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match[1]);
  } catch {
    // Not percent-encoded after all: use it as sent.
    return match[1];
  }
}

// Saves a blob as a download. The link is attached while clicked and the URL released a moment
// later: some browsers cancel a download whose URL is revoked in the same tick.
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
