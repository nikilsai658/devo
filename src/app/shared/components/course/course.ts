import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID, ChangeDetectionStrategy
} from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { Auth } from '../../../core/auth/auth';
import { CourseService } from '../../../features/services/course/course-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-course',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './course.html',
  styleUrls: ['./course.css']
})
export class Course implements OnInit {

  courses: any[] = [];

  courseForm!: FormGroup;

  isEditMode = false;

  selectedCourseId = 0;

  showModal = false;

  feedback = new Feedback();

  constructor(
    private api: CourseService,
    private fb: FormBuilder,
    private cookie: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.courseForm = this.fb.group({

      name: ['', Validators.required],

      description: ['', Validators.required]

    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.cookie.get('token');

    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    if (this.auth.hasPermission('VIEW_COURSE')) {
      this.loadCourses();
    }

  }

  //=====================================
  // Load Courses
  //=====================================

  loadCourses(): void {

    this.api.getCourses().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        if (Array.isArray(res)) {
          this.courses = res;
        }
        else if (Array.isArray(res.data)) {
          this.courses = res.data;
        }
        else if (Array.isArray(res.result)) {
          this.courses = res.result;
        }
        else {
          this.courses = [];
        }
        this.cd.detectChanges();
      },

      error: (err) => {
        this.cd.markForCheck();


        console.error(err);
        this.courses = [];

      }

    });

  }

  //=====================================
  // Modal Controls
  //=====================================

  openAddModal(): void {

    if (!this.auth.hasPermission('CREATE_COURSE')) {
      this.feedback.fail('You do not have permission to add courses.');
      return;
    }

    this.isEditMode = false;

    this.selectedCourseId = 0;

    this.courseForm.reset();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.resetForm();

  }

  //=====================================
  // Create Course
  //=====================================

  createCourse(): void {

    if (!this.auth.hasPermission('CREATE_COURSE')) {
      this.feedback.fail('You do not have permission to add courses.');
      return;
    }

    if (this.courseForm.invalid) {

      this.courseForm.markAllAsTouched();

      return;

    }

    this.api.createCourse(this.courseForm.value).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.resetForm();

        this.feedback.ok('Course added successfully');

        this.loadCourses();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to add course');

      }

    });

  }

  //=====================================
  // Edit Course
  //=====================================

  editCourse(course: any): void {

    if (!this.auth.hasPermission('UPDATE_COURSE')) {
      this.feedback.fail('You do not have permission to edit courses.');
      return;
    }

    this.isEditMode = true;

    this.selectedCourseId = course.id;

    this.courseForm.patchValue({

      name: course.name,

      description: course.description

    });

    this.showModal = true;

  }

  //=====================================
  // Update Course
  //=====================================

  updateCourse(): void {

    if (!this.auth.hasPermission('UPDATE_COURSE')) {
      this.feedback.fail('You do not have permission to edit courses.');
      return;
    }

    if (this.courseForm.invalid) {

      this.courseForm.markAllAsTouched();

      return;

    }

    this.api.updateCourse(

      this.selectedCourseId,

      this.courseForm.value

    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.resetForm();

        this.feedback.ok('Course updated successfully');

        this.loadCourses();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to update course');

      }

    });

  }

  //=====================================
  // Delete Course
  //=====================================

  deleteCourse(id: number): void {

    if (!this.auth.hasPermission('DELETE_COURSE')) {
      this.feedback.fail('You do not have permission to delete courses.');
      return;
    }

    if (!confirm('Delete this Course?')) {
      return;
    }

    this.api.deleteCourse(id).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Course deleted successfully');

        this.loadCourses();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to delete course');

      }

    });

  }

  //=====================================
  // Reset Form
  //=====================================

  resetForm(): void {

    this.courseForm.reset({

      name: '',

      description: ''

    });

    this.isEditMode = false;

    this.selectedCourseId = 0;

    this.showModal = false;

  }

}