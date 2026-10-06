import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FacultyCourseService } from '../../../features/services/facultycourse/facultycourse-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-my-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-courses.html',
  styleUrl: './my-courses.css',
})
export class MyCourses implements OnInit {

  courses: { courseId: number; courseName: string }[] = [];
  loading = true;

  feedback = new Feedback();

  constructor(
    private api: FacultyCourseService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.api.getMyCourses().subscribe({
      next: (res: any) => {
        this.courses = Array.isArray(res?.data) ? res.data : [];
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.courses = [];
        this.loading = false;
        this.feedback.fail(err, 'Failed to load your courses');
        this.cd.markForCheck();
      }
    });
  }
}
