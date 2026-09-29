import { ChangeDetectorRef, Component, Inject, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { Student } from '../../../features/services/student/student';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';

@Component({
  selector: 'app-student-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule,FormsModule,ReactiveFormsModule, Breadcrumb],
  templateUrl: './student-courses.html',
  styleUrl: './student-courses.css',
})
export class StudentCourses {
   courses: any[] = [];
  loading = false;
  domainId!: number ;
  domainName = '';

  get breadcrumb(): BreadcrumbItem[] {
    return [
      { label: 'My Domains', link: '/main/student-domain' },
      { label: this.domainName || 'My Courses' }
    ];
  }

  constructor(
    private api: Student,
    private cd: ChangeDetectorRef,
    private router:Router,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.domainId = history.state.domainId;
    this.domainName = history.state.domainName ?? '';

    if (this.domainId == null) {
      this.router.navigate(['/main/student-domain']);
      return;
    }

    this.loadstudentcourse();
  }

  loadstudentcourse(): void {
  if (this.domainId == null) {
    return;
  }

  this.loading = true;

  this.api.getstudentcourse(this.domainId).subscribe({

    next: (res: any) => {
      this.cd.markForCheck();

      const allCourses = res?.data ?? [];

      const hasDomainField = allCourses.some(
        (c: any) => c.domainId !== undefined && c.domainId !== null
      );

      this.courses = hasDomainField
        ? allCourses.filter((c: any) => c.domainId === this.domainId)
        : allCourses;

      this.loading = false;
      this.cd.detectChanges();
    },

    error: (err) => {
      this.cd.markForCheck();

      console.error('Courses API error:', err);

      this.courses = [];
      this.loading = false;
      this.cd.detectChanges();
    }

  });
}
  view(courseId: number, courseName?: string): void {
  this.router.navigate(['/main/student-assignments'], {
    state: { domainId: this.domainId, domainName: this.domainName, courseId, courseName }
  });
}
}
