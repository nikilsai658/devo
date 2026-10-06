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

export function formatSize(bytes: number): string {
  if (!bytes) {
    return '-';
  }
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Saves a blob response (from GETBlob) using the file name the server sent.
export function saveBlobResponse(res: HttpResponse<Blob>, fallbackName: string): void {
  const blob = res.body;
  if (!blob) {
    return;
  }
  const disposition = res.headers?.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : fallbackName;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
