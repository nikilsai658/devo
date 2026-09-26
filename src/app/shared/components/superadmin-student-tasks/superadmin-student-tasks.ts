import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnInit,
  PLATFORM_ID
} from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { Router } from '@angular/router';

type SubmissionFilter = 'all' | 'submitted' | 'notSubmitted';

@Component({
  selector: 'app-superadmin-student-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './superadmin-student-tasks.html',
  styleUrl: './superadmin-student-tasks.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminStudentTasks implements OnInit {

  tasks: any[] = [];

  loading = false;

  // taskId currently being downloaded
  downloadingId: any = null;
  // taskId whose last download failed
  failedId: any = null;

  collegeId!: number;
  domainId!: number;
  studentId!: string;

  studentName = '';
  studentEmail = '';
  registerNumber = '';
  domainName = '';
  collegeName = '';

  search = '';
  submissionFilter: SubmissionFilter = 'all';

  readonly filters: { key: SubmissionFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'notSubmitted', label: 'Not submitted' },
  ];

  constructor(
    private api: Superadmin,
    private cd: ChangeDetectorRef,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    if (!isPlatformBrowser(this.platformId)) return;

    // Get data passed through router state
    this.collegeId = history.state.collegeId;
    this.domainId = history.state.domainId;
    this.studentId = history.state.studentId;
    this.studentName = history.state.studentName ?? '';
    this.studentEmail = history.state.studentEmail ?? '';
    this.registerNumber = history.state.registerNumber ?? '';
    this.domainName = history.state.domainName ?? '';
    this.collegeName = history.state.collegeName ?? '';

    if (
      this.collegeId &&
      this.domainId &&
      this.studentId
    ) {
      this.loadStudentTasks();
    } else {
      console.error('Required student task details are missing.');
    }
  }

  loadStudentTasks(): void {

    this.loading = true;

    this.api
      .getsuperadmincollege_domain_student_tasks(
        this.collegeId,
        this.domainId,
        this.studentId
      )
      .subscribe({

        next: (res: any) => {

          this.tasks = res?.data ?? [];

          this.loading = false;

          this.cd.markForCheck();
        },

        error: (error) => {

          console.error('Error loading student tasks:', error);

          this.tasks = [];

          this.loading = false;

          this.cd.markForCheck();
        }

      });
  }

  download(task: any): void {

    this.downloadingId = task.taskId;
    this.failedId = null;
    this.cd.markForCheck();

    this.api
      .downloadsuperadmincollege_domain_student_task(
        this.collegeId,
        this.domainId,
        this.studentId,
        task.taskId
      )
      .subscribe({

        next: (res: any) => {
          const blob: Blob = res.body;
          const disposition: string = res.headers?.get('content-disposition') ?? '';
          const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
          const fileName = match ? decodeURIComponent(match[1]) : (task.taskTitle || task.title || 'task');

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          a.click();
          URL.revokeObjectURL(url);

          this.downloadingId = null;
          this.cd.markForCheck();
        },

        error: (error) => {

          console.error('Error downloading task:', error);

          this.downloadingId = null;
          this.failedId = task.taskId;

          this.cd.markForCheck();
        }

      });
  }

  // ---------------- Filtering & summary ----------------

  isSubmitted(task: any): boolean {
    return !!task.submittedOn;
  }

  private matchesFilter(task: any, filter: SubmissionFilter): boolean {
    if (filter === 'submitted') return this.isSubmitted(task);
    if (filter === 'notSubmitted') return !this.isSubmitted(task);
    return true;
  }

  filterCount(filter: SubmissionFilter): number {
    return this.tasks.filter(t => this.matchesFilter(t, filter)).length;
  }

  get filteredTasks(): any[] {
    const term = this.search.trim().toLowerCase();
    return this.tasks.filter(t =>
      this.matchesFilter(t, this.submissionFilter) &&
      (!term ||
        (t.taskTitle || t.title || '').toLowerCase().includes(term) ||
        (t.courseName || '').toLowerCase().includes(term))
    );
  }

  get courseCount(): number {
    return new Set(this.tasks.map(t => t.courseName).filter(Boolean)).size;
  }

  initials(name?: string): string {
    const words = (name || 'S').trim().split(/\s+/);
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  clearFilters(): void {
    this.search = '';
    this.submissionFilter = 'all';
  }

  // ---------------- Navigation ----------------

  backToColleges(): void {
    this.router.navigate(['/main/superamin-colleges']);
  }

  backToDomains(): void {
    this.router.navigate(['/main/superadmin-domains'], {
      state: { collegeId: this.collegeId, collegeName: this.collegeName }
    });
  }

  backToStudents(): void {
    this.router.navigate(['/main/superadmin-domain-students'], {
      state: {
        collegeId: this.collegeId,
        collegeName: this.collegeName,
        domainId: this.domainId,
        domainName: this.domainName
      }
    });
  }

}
