import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ChangeDetectionStrategy, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';

import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { saveBlob } from '../../material-utils';

// Judge0 language ids used by the code editor (see code-editor.ts).
const LANGUAGES: Record<number, { name: string; ext: string }> = {
  71: { name: 'Python', ext: 'py' },
  63: { name: 'JavaScript', ext: 'js' },
  62: { name: 'Java', ext: 'java' },
  54: { name: 'C++', ext: 'cpp' },
  51: { name: 'C#', ext: 'cs' },
};

@Component({
  selector: 'app-superadmin-student-assignment-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './superadmin-student-assignment-code.html',
  styleUrl: './superadmin-student-assignment-code.css',
})
export class SuperadminStudentAssignmentCode implements OnInit {

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  collegeId!: number;
  domainId!: number;
  studentId!: string;
  assignmentId!: number;

  collegeName = '';
  domainName = '';
  studentName = '';
  studentEmail = '';
  registerNumber = '';
  assignmentTitle = '';

  assignmentCode: any = null;
  codeLines: string[] = [];

  loading = false;
  error = '';
  copied = false;
  copyFailed = false;
  wrap = false;

  constructor(
    private api: Superadmin,
    private cd: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {

    // Data needs the browser session (and router state); the server renders the empty page.
    if (!this.isBrowser) {
      return;
    }

    // Get values from router state
    const state = history.state ?? {};
    this.collegeId = state.collegeId;
    this.domainId = state.domainId;
    this.studentId = state.studentId;
    this.assignmentId = state.assignmentId;
    this.collegeName = state.collegeName ?? '';
    this.domainName = state.domainName ?? '';
    this.studentName = state.studentName ?? '';
    this.studentEmail = state.studentEmail ?? '';
    this.registerNumber = state.registerNumber ?? '';
    this.assignmentTitle = state.assignmentTitle ?? '';

    // Opened without choosing a submission first (bookmark, new tab).
    if (!this.collegeId || !this.domainId || !this.studentId || !this.assignmentId) {
      this.router.navigate(['/main/superadmin-colleges']);
      return;
    }

    this.getAssignmentCode();
  }

  getAssignmentCode(): void {

    if (
      !this.collegeId ||
      !this.domainId ||
      !this.studentId ||
      !this.assignmentId
    ) {
      this.error = 'Required assignment information is missing.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.api
      .getsuperadmincollege_domain_student_assignment_code(
        this.collegeId,
        this.domainId,
        this.studentId,
        this.assignmentId
      )
      .subscribe({
        next: (response) => {
          this.cd.markForCheck();


          this.assignmentCode = response;
          if ((response as any)?.isFailure || !(response as any)?.data) {
            this.error = 'No submitted code was found for this assignment.';
          }
          this.codeLines = (this.sourceCode || '').replace(/\r\n/g, '\n').split('\n');

          this.loading = false;
        },

        error: (err) => {
          this.cd.markForCheck();



          this.error = 'Failed to load assignment code.';
          this.loading = false;

        }
      });
  }

  // ---------------- Derived values ----------------

  get data(): any {
    return this.assignmentCode?.data ?? null;
  }

  get sourceCode(): string {
    return this.data?.sourceCode ?? '';
  }

  get title(): string {
    return this.data?.title || this.assignmentTitle || 'Assignment';
  }

  get language(): { name: string; ext: string } {
    return LANGUAGES[Number(this.data?.languageId)] ?? { name: 'Unknown', ext: 'txt' };
  }

  get fileName(): string {
    return `solution.${this.language.ext}`;
  }

  get sizeLabel(): string {
    const bytes = new Blob([this.sourceCode]).size;
    return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
  }

  initials(name?: string): string {
    const words = (name || 'S').trim().split(/\s+/);
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  // ---------------- Actions ----------------

  copyCode(): void {

    const sourceCode = this.sourceCode;

    if (!sourceCode) {
      return;
    }

    const done = (ok: boolean) => {
      this.copied = ok;
      this.copyFailed = !ok;
      this.cd.markForCheck();

      setTimeout(() => {
        this.cd.markForCheck();

        this.copied = false;
        this.copyFailed = false;
      }, 2000);
    };

    // The async clipboard API needs a secure context; fall back otherwise.
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(sourceCode).then(() => { this.cd.markForCheck(); return done(true); }, () => { this.cd.markForCheck(); return done(this.legacyCopy(sourceCode)); });
    } else {
      done(this.legacyCopy(sourceCode));
    }
  }

  private legacyCopy(text: string): boolean {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }

  downloadCode(): void {
    if (!this.sourceCode) {
      return;
    }
    const safeStudent = (this.studentName || 'student').replace(/[^\w-]+/g, '_');
    const safeTitle = this.title.replace(/[^\w-]+/g, '_');
    const blob = new Blob([this.sourceCode], { type: 'text/plain;charset=utf-8' });
    saveBlob(blob, `${safeStudent}_${safeTitle}.${this.language.ext}`);
  }

  // ---------------- Navigation ----------------

  backToColleges(): void {
    this.router.navigate(['/main/superadmin-colleges']);
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

  backToAssignments(): void {
    this.router.navigate(['/main/superadmin-student-assignments'], {
      state: {
        collegeId: this.collegeId,
        collegeName: this.collegeName,
        domainId: this.domainId,
        domainName: this.domainName,
        studentId: this.studentId,
        studentName: this.studentName,
        studentEmail: this.studentEmail,
        registerNumber: this.registerNumber
      }
    });
  }
}
