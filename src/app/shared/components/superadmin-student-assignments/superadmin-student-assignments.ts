import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { Router } from '@angular/router';

type ResultFilter = 'all' | 'passed' | 'notPassed' | 'notStarted';

@Component({
  selector: 'app-superadmin-student-assignments',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './superadmin-student-assignments.html',
  styleUrl: './superadmin-student-assignments.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminStudentAssignments implements OnInit {

  assignments: any[] = [];

  loading = false;

  collegeId!: number;
  domainId!: number;
  studentId!: string;

  studentName = '';
  studentEmail = '';
  registerNumber = '';
  domainName = '';
  collegeName = '';

  search = '';
  resultFilter: ResultFilter = 'all';

  readonly filters: { key: ResultFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'passed', label: 'Passed' },
    { key: 'notPassed', label: 'Not passed' },
    { key: 'notStarted', label: 'Not started' },
  ];

  constructor(
    private api: Superadmin,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {

    // Get data passed through router state
    const state = history.state;
    this.collegeId = state.collegeId;
    this.domainId = state.domainId;
    this.studentId = state.studentId;
    this.studentName = state.studentName ?? '';
    this.studentEmail = state.studentEmail ?? '';
    this.registerNumber = state.registerNumber ?? '';
    this.domainName = state.domainName ?? '';
    this.collegeName = state.collegeName ?? '';

    // Validate IDs
    if (
      this.collegeId &&
      this.domainId &&
      this.studentId
    ) {
      this.loadStudentAssignments();
    } else {
      console.error('Required student assignment details are missing.');
    }
  }

  loadStudentAssignments(): void {

    this.loading = true;

    this.api
      .getsuperadmincollege_domain_student_assignments(
        this.collegeId,
        this.domainId,
        this.studentId
      )
      .subscribe({

        next: (res: any) => {

          this.assignments = res?.data ?? [];

          this.loading = false;

          this.cd.markForCheck();
        },

        error: (error) => {

          console.error(
            'Error loading student assignments:',
            error
          );

          this.assignments = [];

          this.loading = false;

          this.cd.markForCheck();
        }

      });
  }

  // ---------------- Filtering & summary ----------------

  private matchesFilter(a: any, filter: ResultFilter): boolean {
    switch (filter) {
      case 'passed': return !!a.isPassed;
      case 'notPassed': return !a.isPassed && !!a.isStarted;
      case 'notStarted': return !a.isStarted;
      default: return true;
    }
  }

  filterCount(filter: ResultFilter): number {
    return this.assignments.filter(a => this.matchesFilter(a, filter)).length;
  }

  get filteredAssignments(): any[] {
    const term = this.search.trim().toLowerCase();
    return this.assignments.filter(a =>
      this.matchesFilter(a, this.resultFilter) &&
      (!term ||
        (a.title || '').toLowerCase().includes(term) ||
        (a.courseName || '').toLowerCase().includes(term))
    );
  }

  get passedCount(): number {
    return this.filterCount('passed');
  }

  get totalAttempts(): number {
    return this.assignments.reduce((sum, a) => sum + (Number(a.attempts) || 0), 0);
  }

  get averageScore(): number {
    return this.assignments.length
      ? Math.round(this.assignments.reduce((sum, a) => sum + (Number(a.score) || 0), 0) / this.assignments.length)
      : 0;
  }

  // 125 -> "2m 5s", 3700 -> "1h 1m"
  formatDuration(seconds: number | null | undefined): string {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h) return `${h}h ${m}m`;
    if (m) return `${m}m ${s}s`;
    return `${s}s`;
  }

  initials(name?: string): string {
    const words = (name || 'S').trim().split(/\s+/);
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  clearFilters(): void {
    this.search = '';
    this.resultFilter = 'all';
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

  viewCode(assignment: any): void {
    this.router.navigate(
      ['/main/superadmin-student-assignment-code'],
      {
        state: {
          collegeId: this.collegeId,
          domainId: this.domainId,
          studentId: this.studentId,
          assignmentId: assignment.assignmentId,
          collegeName: this.collegeName,
          domainName: this.domainName,
          studentName: this.studentName,
          studentEmail: this.studentEmail,
          registerNumber: this.registerNumber,
          assignmentTitle: assignment.title
        }
      }
    );
  }

}
