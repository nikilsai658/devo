import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth/auth';
import { StudentTaskSubmissionService } from '../../../features/services/studenttasksubmission/studenttasksubmission-service';
import { Feedback } from '../../feedback/feedback';
import { formatSize, saveBlobResponse } from '../../material-utils';
import { ConfirmService } from '../confirm-dailog/confirm';

@Component({
  selector: 'app-task-submissions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-submissions.html',
  styleUrl: './task-submissions.css',
})
export class TaskSubmissions implements OnInit {

  private confirmDialog = inject(ConfirmService);

  readonly formatSize = formatSize;
  readonly pageSizes = [10, 25, 50, 100];

  submissions: any[] = [];

  page = 1;
  pageSize = 25;
  totalCount = 0;
  totalPages = 0;
  loading = false;

  // The API only pages; these narrow down the rows of the page that is open.
  search = '';
  statusFilter = '';
  onlySubmitted = false;

  detail: any = null;
  loadingDetail = false;

  feedback = new Feedback();

  constructor(
    private api: StudentTaskSubmissionService,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId) && this.auth.hasPermission('VIEW_STUDENT_TASK_SUBMISSION')) {
      this.load();
    }
  }

  get statuses(): string[] {
    return [...new Set(this.submissions.map(s => s.status).filter(Boolean))].sort();
  }

  get visible(): any[] {
    const text = this.search.trim().toLowerCase();
    return this.submissions.filter(s =>
      (!this.statusFilter || s.status === this.statusFilter) &&
      (!this.onlySubmitted || s.hasSubmission) &&
      (!text || `${s.studentName} ${s.studentEmail} ${s.taskTitle} ${s.courseName} ${s.domainName}`.toLowerCase().includes(text)));
  }

  load(): void {
    this.loading = true;

    this.api.getSubmissions(this.page, this.pageSize).subscribe({
      next: (res: any) => {
        this.submissions = Array.isArray(res?.data) ? res.data : [];
        const info = res?.pagination;
        this.totalCount = info?.totalCount ?? this.submissions.length;
        this.totalPages = info?.totalPages ?? 1;
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.submissions = [];
        this.loading = false;
        this.feedback.fail(err, 'Failed to load submissions');
        this.cd.markForCheck();
      }
    });
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }
    this.page = page;
    this.load();
  }

  changePageSize(size: string): void {
    this.pageSize = Number(size);
    this.page = 1;
    this.load();
  }

  statusClass(status: string): string {
    const s = (status ?? '').toLowerCase();
    if (s.includes('submit') || s.includes('complete') || s.includes('done')) {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
    if (s.includes('pending') || s.includes('progress') || s.includes('assign')) {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    return 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30';
  }

  //=====================================
  // Detail / download / delete
  //=====================================

  open(row: any): void {
    this.detail = row;
    this.loadingDetail = true;

    this.api.getSubmission(row.id).subscribe({
      next: (res: any) => {
        this.detail = res?.data ?? row;
        this.loadingDetail = false;
        this.cd.markForCheck();
      },
      error: () => {
        this.loadingDetail = false;
        this.cd.markForCheck();
      }
    });
  }

  closeDetail(): void {
    this.detail = null;
  }

  download(row: any): void {
    this.api.download(row.id).subscribe({
      next: (res: any) => saveBlobResponse(res, row.fileName || `${row.studentName}-${row.taskTitle}`),
      error: (err) => {
        this.feedback.fail(err, 'Failed to download the submission');
        this.cd.markForCheck();
      }
    });
  }

  async remove(row: any): Promise<void> {
    if (!(await this.confirmDialog.ask(
      `Delete the submission of ${row.studentName} for "${row.taskTitle}"? The student will have to submit again.`))) {
      return;
    }

    this.api.deleteSubmission(row.id).subscribe({
      next: (res: any) => {
        this.closeDetail();
        this.feedback.ok('Submission deleted', res);
        this.load();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to delete the submission');
        this.cd.markForCheck();
      }
    });
  }
}
