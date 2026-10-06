import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Student } from '../../../features/services/student/student';
import { Feedback } from '../../feedback/feedback';
import { extractErrorMessage } from '../../feedback/feedback';
import { formatSize, saveBlobResponse } from '../../material-utils';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';

@Component({
  selector: 'app-student-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  templateUrl: './student-content.html',
  styleUrl: './student-content.css',
})
export class StudentContent implements OnInit {

  readonly formatSize = formatSize;

  domainId!: number;
  courseId!: number;
  domainName = '';
  courseName = '';

  sections: any[] = [];
  open = new Set<number>();
  loading = true;
  error = '';

  feedback = new Feedback();

  get breadcrumb(): BreadcrumbItem[] {
    return [
      { label: 'My Domains', link: '/main/student-domain' },
      { label: this.domainName || 'My Courses', link: '/main/student-courses',
        state: { domainId: this.domainId, domainName: this.domainName } },
      { label: this.courseName || 'Course', link: '/main/student-assignments',
        state: { domainId: this.domainId, domainName: this.domainName, courseId: this.courseId, courseName: this.courseName } },
      { label: 'Course Content' }
    ];
  }

  constructor(
    private api: Student,
    private cd: ChangeDetectorRef,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const state = history.state ?? {};
    this.domainId = state.domainId;
    this.courseId = state.courseId;
    this.domainName = state.domainName ?? '';
    this.courseName = state.courseName ?? '';

    if (this.domainId == null || this.courseId == null) {
      this.router.navigate(['/main/student-domain']);
      return;
    }

    this.api.getcoursecontent(this.domainId, this.courseId).subscribe({
      next: (res: any) => {
        this.sections = Array.isArray(res?.data) ? res.data : [];
        // The first section starts open so there is something to see right away.
        if (this.sections.length) {
          this.open.add(this.sections[0].id);
        }
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.error = extractErrorMessage(err, 'The course content could not be loaded.');
        this.loading = false;
        this.cd.markForCheck();
      }
    });
  }

  get lessonCount(): number {
    return this.sections.reduce((n, s) => n + s.lessons.length, 0);
  }

  get materialCount(): number {
    return this.sections.reduce((n, s) => n + s.lessons.reduce((m: number, l: any) => m + l.materials.length, 0), 0);
  }

  toggle(id: number): void {
    if (this.open.has(id)) {
      this.open.delete(id);
    } else {
      this.open.add(id);
    }
  }

  download(material: any): void {
    this.api.downloadmaterial(this.domainId, this.courseId, material.id).subscribe({
      next: (res: any) => saveBlobResponse(res, material.fileName || material.title),
      error: (err) => {
        this.feedback.fail(err, 'The file could not be downloaded.');
        this.cd.markForCheck();
      }
    });
  }

  // The tab is opened first, inside the click, so the browser does not treat it as a pop-up.
  view(material: any): void {
    const tab = window.open('', '_blank');

    this.api.previewmaterial(this.domainId, this.courseId, material.id).subscribe({
      next: (res: any) => {
        const blob: Blob | null = res.body;
        if (!blob || !tab) {
          tab?.close();
          this.feedback.fail(null, 'Allow pop-ups to view files, or use Download.');
          this.cd.markForCheck();
          return;
        }
        tab.location.href = URL.createObjectURL(blob);
      },
      error: (err) => {
        tab?.close();
        this.feedback.fail(err, 'The file could not be opened.');
        this.cd.markForCheck();
      }
    });
  }
}
