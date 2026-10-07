import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnDestroy,
  inject,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import {
  exhaustMap,
  filter,
  finalize,
  forkJoin,
  map,
  of,
  retry,
  Subscription,
  switchMap,
  takeWhile,
  tap,
  timeout,
  TimeoutError,
  timer
} from 'rxjs';

import { UserService } from '../../../features/services/user/user-service';
import { Feedback } from '../../feedback/feedback';
import { saveBlob, validateSpreadsheet } from '../../material-utils';

// A 21-row file takes ~40s on the server; allow plenty of headroom before
// treating a silent connection as dead.
const UPLOAD_TIMEOUT_MS = 180_000;

// How often the bulk upload job status is polled while the server works.
const UPLOAD_POLL_MS = 1000;

// Longest the page keeps polling one job. A job still unfinished after this is left to the
// server, and the admin is told to check the user list instead of watching forever.
const UPLOAD_MAX_POLL_MS = 30 * 60 * 1000;

class UploadPollingStopped extends Error {}

// Bulk user import on the Users page: sends the spreadsheet, follows the server job,
// then shows (and prints / exports) which rows were created and which failed.
@Component({
  selector: 'app-user-bulk-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-bulk-upload.html',
  styleUrls: ['./user-bulk-upload.css']
})
export class UserBulkUpload implements OnDestroy {

  private readonly userService = inject(UserService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Emitted whenever users may have been created, so the page reloads its list.
  readonly imported = output<void>();

  uploadFeedback = new Feedback();

  // Text for this card's screen-reader live region.
  srMessage = '';

  selectedFile: File | null = null;

  // ==========================
  // Bulk Upload Results
  // ==========================

  uploadId: string | null = null;

  // Kept separate from `loading` (the users table), so a table refresh
  // can't re-enable the Upload button mid-upload.
  uploading = false;
  uploadPhase: 'sending' | 'processing' | null = null;
  uploadPercent = 0;
  uploadElapsed = 0;
  // Latest job status from User/BulkUpload/{jobId}/status (totalRows,
  // processedRows, successCount, failedCount, percentComplete, …).
  uploadJob: any = null;
  // Final counts from the job, shown in the results badges.
  uploadSummary: { success: number; failed: number } | null = null;
  // Set when an upload finishes, so the progress bar stays on screen at
  // 100% with the outcome instead of vanishing.
  uploadComplete: {
    total: number | null;
    success: number | null;
    failed: number;
    completed: boolean;
  } | null = null;
  private uploadSub: Subscription | null = null;
  private uploadTimer: ReturnType<typeof setInterval> | null = null;

  uploadResultsLoading = false;
  showUploadResults = false;
  successUsers: any[] = [];
  failedUsers: any[] = [];

  private announce(message: string): void {

    this.srMessage = message;

    this.cdr.markForCheck();

  }

  // ==========================
  // File Selected
  // ==========================

  onFileSelected(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    if (
      input.files &&
      input.files.length > 0
    ) {

      this.selectedFile =
        input.files[0];


    }

  }

  // ==========================
  // Upload File
  // ==========================

  uploadFile(fileInput?: HTMLInputElement): void {

    // Guard against double-clicks that land before the button re-renders
    // as disabled.
    if (this.uploading) {

      return;

    }

    if (!this.selectedFile) {

      this.uploadFeedback.fail('Please select a file');

      return;

    }

    const problem = validateSpreadsheet(this.selectedFile);

    if (problem) {

      this.uploadFeedback.fail(problem);

      return;

    }

    this.uploading = true;

    this.uploadPhase = 'sending';

    this.uploadPercent = 0;

    this.uploadElapsed = 0;

    this.uploadJob = null;

    this.uploadSummary = null;

    this.uploadComplete = null;

    this.showUploadResults = false;

    this.successUsers = [];

    this.failedUsers = [];

    this.uploadTimer = setInterval(() => {
      this.cdr.markForCheck();


      this.uploadElapsed++;

    }, 1000);

    this.uploadSub = this.userService
      .uploadUsers(
        this.selectedFile
      )
      .pipe(
        // `each` resets on every progress event, so this only fires when
        // the connection goes quiet — not while a big file is sending.
        timeout({ each: UPLOAD_TIMEOUT_MS }),
        tap((event: any) => {

          if (event.type !== HttpEventType.UploadProgress) {

            return;

          }

          this.uploadPercent = event.total
            ? Math.round((100 * event.loaded) / event.total)
            : 0;

          // Whole file sent — the rest of the wait is the server
          // creating the users.
          if (
            event.total &&
            event.loaded >= event.total &&
            this.uploadPhase !== 'processing'
          ) {

            this.uploadPhase = 'processing';

            this.announce(
              'File sent. Creating users on the server, this can take a minute or more.'
            );

          }

          this.cdr.markForCheck();

        }),
        filter((event: any) => event.type === HttpEventType.Response),
        // File accepted: poll the job status until the server finishes,
        // emitting each status so the progress bar can follow along.
        switchMap((event: any) => {

          const res = event.body;


          const jobId =
            res?.data?.jobId ??
            res?.jobId ??
            res?.uploadId ??
            res?.data?.uploadId ??
            res?.id ??
            res?.data?.id ??
            null;

          this.selectedFile = null;

          // Clear the native input too, so the same file can be picked
          // again and the old name isn't left showing.
          if (fileInput) {

            fileInput.value = '';

          }

          if (!jobId) {

            return of(null);

          }

          this.uploadId = jobId;

          this.uploadPhase = 'processing';

          const pollingStarted = Date.now();

          return timer(0, UPLOAD_POLL_MS).pipe(
            tap(() => {
              if (Date.now() - pollingStarted > UPLOAD_MAX_POLL_MS) {
                throw new UploadPollingStopped();
              }
            }),
            exhaustMap(() =>
              this.userService
                .progress(jobId)
                // Ride out a brief network blip instead of losing the job.
                .pipe(retry({ count: 3, delay: UPLOAD_POLL_MS }))
            ),
            map((statusRes: any) => statusRes?.data ?? statusRes),
            takeWhile((job: any) => !this.isJobDone(job), true)
          );

        }),
        finalize(() => {
          this.cdr.markForCheck();


          this.stopUploadTracking();

        })
      )
      .subscribe({

        next: (job: any) => {
          this.cdr.markForCheck();


          // No job id in the upload response — nothing to track.
          if (!job) {

            this.uploadComplete = {
              total: null,
              success: null,
              failed: 0,
              completed: true
            };

            this.imported.emit();

            this.uploadFeedback.ok('Users uploaded successfully');

            return;

          }

          this.uploadJob = job;

          if (!this.isJobDone(job)) {

            return;

          }

          const result = job.result;

          this.uploadSummary = {
            success: result?.success ?? job.successCount ?? 0,
            failed: result?.failed ?? job.failedCount ?? 0
          };

          const completed =
            String(job.status).toLowerCase() === 'completed';

          this.uploadComplete = {
            total:
              job.totalRows ??
              this.uploadSummary.success + this.uploadSummary.failed,
            success: this.uploadSummary.success,
            failed: this.uploadSummary.failed,
            completed
          };

          if (!completed) {

            this.uploadFeedback.fail(
              job.message || 'Bulk upload did not complete.'
            );

          }

          this.imported.emit();

          this.loadUploadResults(
            this.uploadId as string,
            result?.errors
          );

        },

        error: (err) => {
          this.cdr.markForCheck();



          if (err instanceof UploadPollingStopped) {

            this.uploadFeedback.fail(
              'The server is still working on this file. It will finish on its own — ' +
              'refresh the user list later instead of uploading the file again.'
            );

            this.imported.emit();

            return;

          }

          if (err instanceof TimeoutError || err?.status === 504) {

            // The server may still finish the import after we stop
            // waiting, so re-uploading straight away could create
            // duplicates. Refresh the list so the admin can check first.
            this.uploadFeedback.fail(
              'The upload timed out. The server may still be processing it — ' +
              'check the user list before uploading the same file again.'
            );

            this.imported.emit();

            return;

          }

          this.uploadFeedback.fail(err, 'Unable to upload users.');

        }

      });

  }

  // ==========================
  // Cancel Upload
  // ==========================

  cancelUpload(): void {

    if (!this.uploading) {

      return;

    }

    // Unsubscribing aborts the HTTP request (finalize resets the state).
    this.uploadSub?.unsubscribe();

    this.uploadFeedback.fail(
      'Upload cancelled. If the file had already been sent, some users ' +
      'may still have been created — check the user list before retrying.'
    );

    this.imported.emit();

  }

  // A job with no status is treated as finished so an unexpected
  // response shape can't leave the page polling forever.
  private isJobDone(job: any): boolean {

    const status = String(job?.status ?? '').toLowerCase();

    return !['pending', 'queued', 'processing', 'inprogress', 'running']
      .includes(status);

  }

  // Percent of rows the server has processed so far.
  get uploadJobPercent(): number {

    const job = this.uploadJob;

    if (!job) {

      return 0;

    }

    const percent =
      job.percentComplete ??
      (job.totalRows ? (100 * (job.processedRows ?? 0)) / job.totalRows : 0);

    return Math.min(100, Math.max(0, Math.round(percent)));

  }

  // Overall result of the finished upload, drives the summary card's look.
  get uploadOutcome(): 'success' | 'partial' | 'failed' {

    const done = this.uploadComplete;

    if (!done || (done.completed && !done.failed)) {

      return 'success';

    }

    return done.success ? 'partial' : 'failed';

  }

  // Share of rows created / rejected, for the split bar on the summary card.
  get uploadSuccessPercent(): number {

    const done = this.uploadComplete;

    if (!done || done.success === null) {

      return 100;

    }

    const total = done.total || done.success + done.failed;

    return total ? Math.round((100 * done.success) / total) : 0;

  }

  get uploadFailedPercent(): number {

    const done = this.uploadComplete;

    if (!done || done.success === null) {

      return 0;

    }

    const total = done.total || done.success + done.failed;

    return total ? Math.round((100 * done.failed) / total) : 0;

  }

  // The status API reports failures as "email - reason" strings.
  private parseUploadErrors(errors: any): any[] {

    if (!Array.isArray(errors)) {

      return [];

    }

    return errors.map((error: any) => {

      const text = String(error ?? '');

      const index = text.indexOf(' - ');

      if (index === -1) {

        return { email: null, reason: text.trim() };

      }

      return {
        email: text.slice(0, index).trim() || null,
        reason: text.slice(index + 3).trim()
      };

    });

  }

  private stopUploadTracking(): void {

    if (this.uploadTimer) {

      clearInterval(this.uploadTimer);

      this.uploadTimer = null;

    }

    this.uploadSub = null;

    this.uploading = false;

    this.uploadPhase = null;

    // markForCheck, not detectChanges: this also runs from ngOnDestroy,
    // when the view is already gone.
    this.cdr.markForCheck();

  }

  // Leaving the page drops the request; warn while one is in flight.
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {

    if (this.uploading) {

      event.preventDefault();

    }

  }

  ngOnDestroy(): void {

    this.uploadSub?.unsubscribe();

    if (this.uploadTimer) {

      clearInterval(this.uploadTimer);

    }

  }

  // ==========================
  // Load Bulk Upload Results
  // ==========================

  // `errors` are the job status's "email - reason" strings, used for the
  // failed list when the failed endpoint returns no rows.
  loadUploadResults(
    uploadId: string,
    errors?: any
  ): void {

    this.uploadResultsLoading = true;

    forkJoin({

      success:
        this.userService.successusers(
          uploadId
        ),

      failed:
        this.userService.failedusers(
          uploadId
        )

    })
      .pipe(
        finalize(() => {
          this.cdr.markForCheck();


          this.uploadResultsLoading = false;

          this.showUploadResults = true;

        })
      )
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();



          this.successUsers =
            this.extractList(
              res.success
            );

          this.failedUsers =
            this.extractList(
              res.failed
            );

          if (!this.failedUsers.length) {

            this.failedUsers = this.parseUploadErrors(errors);

          }

          this.announce(
            `Upload finished. ${this.uploadSummary?.success ?? this.successUsers.length} users created, ` +
            `${this.uploadSummary?.failed ?? this.failedUsers.length} failed.`
          );

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.successUsers = [];

          this.failedUsers = this.parseUploadErrors(errors);

        }

      });

  }

  // ==========================
  // Extract List Helper
  // ==========================

  extractList(res: any): any[] {

    if (Array.isArray(res)) {

      return res;

    }

    if (Array.isArray(res?.data)) {

      return res.data;

    }

    if (Array.isArray(res?.items)) {

      return res.items;

    }

    return [];

  }

  // ==========================
  // Close Upload Results
  // ==========================

  closeUploadResults(): void {

    this.showUploadResults = false;

    this.successUsers = [];

    this.failedUsers = [];

    this.uploadSummary = null;

    this.uploadJob = null;

    this.uploadId = null;

  }
  printSuccessUsers(): void {
  if (!this.successUsers?.length) {
    return;
  }

  const rows = this.successUsers.map((user: any) => `
    <tr>
      <td>${this.escapeHtml(user?.fullName ?? user?.name ?? '-')}</td>
      <td>${this.escapeHtml(user?.email ?? '-')}</td>
      <td>${this.escapeHtml(user?.roleName ?? user?.role ?? '-')}</td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank', 'width=1000,height=700');

  if (!printWindow) {
    this.uploadFeedback.fail('Pop-up blocked. Allow pop-ups for this site to print.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Successfully Created Users</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          color: #2F3E46;
        }

        h1 {
          margin-bottom: 5px;
        }

        .subtitle {
          color: #666;
          margin-bottom: 25px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th,
        td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }

        th {
          background: #2F3E46;
          color: white;
        }

        .success {
          color: #15803d;
          font-weight: bold;
        }

        @media print {
          body {
            padding: 10px;
          }
        }
      </style>
    </head>

    <body>

      <h1>Successfully Created Users</h1>

      <div class="subtitle">
        Total Successful Users:
        <strong class="success">
          ${this.successUsers.length}
        </strong>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>

    </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    this.cdr.markForCheck();

    printWindow.print();
    printWindow.close();
  }, 300);
}


printFailedUsers(): void {
  if (!this.failedUsers?.length) {
    return;
  }

  const rows = this.failedUsers.map((user: any) => `
    <tr>
      <td>${this.escapeHtml(user?.fullName ?? user?.name ?? '-')}</td>
      <td>${this.escapeHtml(user?.email ?? '-')}</td>
      <td>${this.escapeHtml(this.failedReason(user))}</td>
    </tr>
  `).join('');

  const printWindow = window.open('', '_blank', 'width=1000,height=700');

  if (!printWindow) {
    this.uploadFeedback.fail('Pop-up blocked. Allow pop-ups for this site to print.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Failed Users</title>

      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 30px;
          color: #2F3E46;
        }

        h1 {
          margin-bottom: 5px;
        }

        .subtitle {
          color: #666;
          margin-bottom: 25px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }

        th,
        td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
          vertical-align: top;
        }

        th {
          background: #2F3E46;
          color: white;
        }

        .failed {
          color: #dc2626;
          font-weight: bold;
        }

        @media print {
          body {
            padding: 10px;
          }
        }
      </style>
    </head>

    <body>

      <h1>Failed Users</h1>

      <div class="subtitle">
        Total Failed Users:
        <strong class="failed">
          ${this.failedUsers.length}
        </strong>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Reason</th>
          </tr>
        </thead>

        <tbody>
          ${rows}
        </tbody>
      </table>

    </body>
    </html>
  `);

  printWindow.document.close();

  printWindow.focus();

  setTimeout(() => {
    this.cdr.markForCheck();

    printWindow.print();
    printWindow.close();
  }, 300);
}


/**
 * Download the failed users as a CSV file (opens in Excel).
 */
exportFailedUsers(): void {
  if (!this.failedUsers?.length) {
    return;
  }

  const header = ['Name', 'Email', 'Reason'];

  const rows = this.failedUsers.map((user: any) => {
    const reason = this.failedReason(user);

    return [
      user?.fullName ?? user?.name ?? '',
      user?.email ?? '',
      reason === '-' ? '' : reason
    ];
  });

  const csv = [header, ...rows]
    .map(row => row.map(cell => this.csvCell(cell)).join(','))
    .join('\r\n');

  // BOM so Excel reads UTF-8 names correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  saveBlob(blob, `failed-users${this.uploadId ? '-' + this.uploadId : ''}.csv`);
}


failedReason(user: any): string {
  return user?.reason ??
    user?.error ??
    user?.errorMessage ??
    user?.message ??
    '-';
}


/**
 * Quote a CSV cell and neutralise spreadsheet formula injection.
 */
private csvCell(value: any): string {
  let text = String(value ?? '');

  if (/^[=+\-@\t\r]/.test(text)) {
    text = "'" + text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}


/**
 * Prevent HTML/content from breaking the print page.
 */
private escapeHtml(value: any): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

}
