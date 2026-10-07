import { HttpHeaders, HttpResponse } from '@angular/common/http';

import {
  fileNameFromResponse,
  guessMaterialType,
  previewableBlob,
  saveBlob,
  validateSpreadsheet,
  validateUpload
} from './material-utils';

const file = (name: string, size: number) => new File([new Uint8Array(size)], name);

describe('material utils', () => {
  describe('previewableBlob', () => {
    it('shows PDFs, images and media as they are', () => {
      for (const type of ['application/pdf', 'image/png', 'image/jpeg', 'video/mp4', 'audio/mpeg']) {
        const blob = new Blob(['x'], { type });
        expect(previewableBlob(blob), type).toBe(blob);
      }
    });

    it('turns any text into plain text, so HTML cannot run on this origin', () => {
      for (const type of ['text/html', 'text/javascript', 'application/json', 'text/plain; charset=utf-8']) {
        expect(previewableBlob(new Blob(['<script>x</script>'], { type }))?.type, type).toBe('text/plain;charset=utf-8');
      }
    });

    it('refuses types that could run script or need another app', () => {
      for (const type of ['image/svg+xml', 'application/xhtml+xml', 'application/zip', '']) {
        expect(previewableBlob(new Blob(['x'], { type })), type).toBeNull();
      }
    });
  });

  describe('validateUpload / validateSpreadsheet', () => {
    it('checks extension, emptiness and size', () => {
      expect(validateUpload(file('notes.pdf', 10))).toBeNull();
      expect(validateUpload(file('page.html', 10))).toContain('not allowed');
      expect(validateUpload(file('empty.pdf', 0))).toBe('The file is empty.');
      expect(validateUpload(file('big.pdf', 26 * 1024 * 1024))).toContain('larger than');
    });

    it('accepts only spreadsheets for bulk imports', () => {
      expect(validateSpreadsheet(file('users.xlsx', 10))).toBeNull();
      expect(validateSpreadsheet(file('users.CSV', 10))).toBeNull();
      expect(validateSpreadsheet(file('users.pdf', 10))).toContain('CSV or Excel');
    });
  });

  it('guesses the material type from the extension', () => {
    expect(guessMaterialType('slides.PPTX')).toBe('PPT');
    expect(guessMaterialType('unknown.xyz')).toBe('');
  });

  describe('fileNameFromResponse', () => {
    const res = (disposition?: string) => new HttpResponse<Blob>({
      headers: disposition ? new HttpHeaders({ 'content-disposition': disposition }) : new HttpHeaders()
    });

    it('reads plain and encoded names', () => {
      expect(fileNameFromResponse(res('attachment; filename="report.pdf"'))).toBe('report.pdf');
      expect(fileNameFromResponse(res("attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf"))).toBe('résumé.pdf');
    });

    it('does not throw on a malformed encoded name', () => {
      expect(fileNameFromResponse(res('attachment; filename="100%.pdf"'))).toBe('100%.pdf');
    });

    it('returns null without the header', () => {
      expect(fileNameFromResponse(res())).toBeNull();
    });
  });

  it('saveBlob clicks a temporary download link', () => {
    vi.useFakeTimers();
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:x');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    saveBlob(new Blob(['x']), 'a.txt');

    expect(create).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(document.querySelector('a[download="a.txt"]')).toBeNull();
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(revoke).toHaveBeenCalledWith('blob:x');

    vi.useRealTimers();
    vi.restoreAllMocks();
  });
});
