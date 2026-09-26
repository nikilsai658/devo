import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Student } from '../../../features/services/student/student';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';

@Component({
  selector: 'app-student-task',
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  templateUrl: './student-task.html',
  styleUrl: './student-task.css',
})
export class StudentTask implements OnInit {

  taskId!: number;
  domainId!: number;
  courseId!: number;
  domainName = '';
  courseName = '';
  task: any = null;
  loading = true;
  uploading = false;
  downloading = false;
  uploadError = '';
  downloadError = '';

  get isPending(): boolean {
    return (this.task?.status || 'Pending') === 'Pending';
  }

  private get courseState() {
    return { domainId: this.domainId, domainName: this.domainName, courseId: this.courseId, courseName: this.courseName };
  }

  get breadcrumb(): BreadcrumbItem[] {
    return [
      { label: 'My Domains', link: '/main/student-domain' },
      { label: this.domainName || 'My Courses', link: '/main/student-courses',
        state: { domainId: this.domainId, domainName: this.domainName } },
      { label: this.courseName || 'Tasks', link: '/main/student-assignments', state: this.courseState },
      { label: this.task?.taskTitle || 'Task' }
    ];
  }

  constructor(
    private api: Student,
    private router: Router,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.taskId = history.state.taskId;
    this.domainId = history.state.domainId;
    this.courseId = history.state.courseId;
    this.domainName = history.state.domainName ?? '';
    this.courseName = history.state.courseName ?? '';

    if (this.taskId == null) {
      this.router.navigate(['/main/student-assignments'], { state: this.courseState });
      return;
    }

    this.loadTask();
  }

  loadTask(): void {
    this.api.gettaskbyId(this.taskId).subscribe({
      next: (res: any) => {
        this.task = res?.data ?? null;
        this.loading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.task = null;
        this.loading = false;
        this.cd.detectChanges();
      }
    });
  }

  back(): void {
    this.router.navigate(['/main/student-assignments'], { state: this.courseState });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    this.uploadError = '';
    this.api.uploadtask(this.taskId, file).subscribe({
      next: () => {
        this.uploading = false;
        input.value = '';
        this.loadTask();
      },
      error: () => {
        this.uploading = false;
        this.uploadError = 'Upload failed. Please try again.';
        input.value = '';
        this.cd.detectChanges();
      }
    });
  }

  download(): void {
    if (this.downloading) return;
    this.downloading = true;
    this.downloadError = '';
    this.api.downloadtask(this.taskId).subscribe({
      next: (res: any) => {
        this.downloading = false;
        this.cd.detectChanges();
        const blob: Blob = res.body;
        const disposition: string = res.headers?.get('content-disposition') ?? '';
        const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
        const fileName = match ? decodeURIComponent(match[1]) : (this.task?.taskTitle || 'task');

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => {
        this.downloading = false;
        this.downloadError = 'Download failed. Please try again.';
        this.cd.detectChanges();
      }
    });
  }
}
