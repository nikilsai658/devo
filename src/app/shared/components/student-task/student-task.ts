import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, ChangeDetectionStrategy, inject } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Student } from '../../../features/services/student/student';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';
import { ConfirmService } from '../confirm-dialog/confirm';
import { extractErrorMessage } from '../../feedback/feedback';
import { ALLOWED_EXTENSIONS, saveBlobResponse, validateUpload } from '../../material-utils';

@Component({
  selector: 'app-student-task',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  templateUrl: './student-task.html',
  styleUrl: './student-task.css',
})
export class StudentTask implements OnInit {
  private confirmDialog = inject(ConfirmService);

  // For the file picker's accept filter (same list the API allows).
  readonly acceptTypes = ALLOWED_EXTENSIONS.join(',');

  taskId!: number;
  domainId!: number;
  courseId!: number;
  domainName = '';
  courseName = '';
  task: any = null;
  loading = true;
  uploading = false;
  uploadPercent = 0;
  loadError = '';
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

    this.taskId = history.state?.taskId;
    this.domainId = history.state?.domainId;
    this.courseId = history.state?.courseId;
    this.domainName = history.state?.domainName ?? '';
    this.courseName = history.state?.courseName ?? '';

    if (this.taskId == null) {
      this.router.navigate(['/main/student-assignments'], { state: this.courseState });
      return;
    }

    this.loadTask();
  }

  loadTask(): void {
    this.api.gettaskbyId(this.taskId).subscribe({
      next: (res: any) => {
        this.cd.markForCheck();

        this.task = res?.data ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.cd.markForCheck();

        this.loadError = err?.status === 404 ? '' : extractErrorMessage(err, 'The task could not be loaded.');
        this.task = null;
        this.loading = false;
      }
    });
  }

  back(): void {
    this.router.navigate(['/main/student-assignments'], { state: this.courseState });
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploadError = '';

    // Same type/size rules as the API, checked before anything is sent.
    const problem = validateUpload(file);
    if (problem) {
      this.uploadError = problem;
      input.value = '';
      this.cd.markForCheck();
      return;
    }

    if (this.task?.hasSubmission && !(await this.confirmDialog.ask(
      `"${file.name}" will replace the file you already submitted for this task.`,
      { title: 'Replace your submission?', confirmText: 'Replace', danger: false }
    ))) {
      input.value = '';
      return;
    }

    this.uploading = true;
    this.uploadPercent = 0;
    this.cd.markForCheck();

    this.api.uploadtaskWithProgress(this.taskId, file).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadPercent = Math.round((100 * event.loaded) / event.total);
          this.cd.markForCheck();
        }
        if (event.type === HttpEventType.Response) {
          this.uploading = false;
          input.value = '';
          this.loadTask();
          this.cd.markForCheck();
        }
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = extractErrorMessage(err, 'Upload failed. Please try again.');
        input.value = '';
        this.cd.markForCheck();
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
        saveBlobResponse(res, this.task?.taskTitle || 'task');
        this.cd.markForCheck();
      },
      error: (err) => {
        this.downloading = false;
        this.downloadError = extractErrorMessage(err, 'Download failed. Please try again.');
        this.cd.markForCheck();
      }
    });
  }
}
