import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID, ChangeDetectionStrategy
, inject } from '@angular/core';

import {
  CommonModule,
  isPlatformBrowser
} from '@angular/common';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { CourseTaskService } from '../../../features/services/coursetask/course-task-service';
import { CourseService } from '../../../features/services/course/course-service';
import { TaskService } from '../../../features/services/task/task-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dailog/confirm';
@Component({
  selector: 'app-course-task',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './course-task.html',
  styleUrls: ['./course-task.css']
})
export class CourseTask implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  courseTaskForm!: FormGroup;

  mappings: any[] = [];
  filteredMappings: any[] = [];

  courses: any[] = [];
  tasks: any[] = [];

  submitted = false;
  loading = false;
  editMode = false;
  showModal = false;

  selectedId: number | null = null;

  searchText = '';

  constructor(
    private fb: FormBuilder,
    public auth: Auth,
    private courseTaskService: CourseTaskService,
    private courseService: CourseService,
    private taskService: TaskService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.buildForm();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadCourses();
    this.loadTasks();
    this.loadMappings();
  }

  buildForm() {

    this.courseTaskForm = this.fb.group({

      courseName: ['', [AppValidators.required]],

      taskTitle: ['', [AppValidators.required]]

    });

  }

  // Accepts [..], { data: [..] } or { result: [..] }
  private toArray(res: any): any[] {

    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.result)) return res.result;

    return [];
  }

  //=====================================
  // Load Courses
  //=====================================

  loadCourses(): void {

    this.courseService.getCourses().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();

        this.courses = this.toArray(res);
        this.cd.detectChanges();
      },

      error: () => {
        this.cd.markForCheck();

        this.courses = [];
      }

    });

  }

  //=====================================
  // Load Tasks
  //=====================================

  loadTasks(): void {

    this.taskService.getTask().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();

        this.tasks = this.toArray(res);
        this.cd.detectChanges();
      },

      error: () => {
        this.cd.markForCheck();

        this.tasks = [];
      }

    });

  }

  //==========================
  // LOAD MAPPINGS
  //==========================

  loadMappings() {

    this.loading = true;

    this.courseTaskService
      .getCourseTask()
      .pipe(finalize(() => {
        this.cd.markForCheck();

        this.loading = false;
        this.cd.detectChanges();
      }))
      .subscribe({

        next: (res: any) => {
          this.cd.markForCheck();


          this.mappings = this.toArray(res);

          this.search();

        },

        error: () => {
          this.cd.markForCheck();


          this.mappings = [];
          this.filteredMappings = [];

        }

      });

  }

  //==========================
  // MODAL
  //==========================

  openAddModal() {
    this.resetForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  //==========================
  // SAVE (CREATE / UPDATE)
  //==========================

  save() {

    this.submitted = true;

    if (this.courseTaskForm.invalid) {

      this.courseTaskForm.markAllAsTouched();

      return;

    }

    const payload = this.courseTaskForm.value;

    if (this.editMode) {

      if (this.selectedId === null) {
        return;
      }

      this.loading = true;

      this.courseTaskService
        .UpdateCourseTask(this.selectedId, payload)
        .pipe(finalize(() => { this.cd.markForCheck(); return this.loading = false; }))
        .subscribe({

          next: () => {
            this.cd.markForCheck();

            this.loadMappings();
            this.closeModal();
            this.feedback.ok('Mapping updated successfully');
          },

          error: (err: any) => { this.cd.markForCheck(); return this.feedback.fail(err); }

        });

    } else {

      this.loading = true;

      this.courseTaskService
        .postCourseTask(payload)
        .pipe(finalize(() => { this.cd.markForCheck(); return this.loading = false; }))
        .subscribe({

          next: () => {
            this.cd.markForCheck();

            this.loadMappings();
            this.closeModal();
            this.feedback.ok('Mapping added successfully');
          },

          error: (err: any) => { this.cd.markForCheck(); return this.feedback.fail(err); }

        });

    }

  }

  //==========================
  // EDIT
  //==========================

  edit(item: any) {

    if (!this.auth.hasPermission('UPDATE_COURSE_TASK_MAP')) {
      return;
    }

    this.editMode = true;
    this.selectedId = item.id;

    this.courseTaskForm.patchValue({
      courseName: item.courseName,
      taskTitle: item.taskTitle
    });

    this.showModal = true;
  }

  //==========================
  // DELETE
  //==========================

  async delete(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_COURSE_TASK_MAP')) {
      return;
    }

    if (!(await this.confirmDialog.ask('Delete this mapping?'))) return;

    this.courseTaskService.deleteCourseTask(id)
      .subscribe({
        next: (res: any) => {
          this.cd.markForCheck();

          this.loadMappings();
          this.feedback.ok('Mapping deleted successfully', res);
        },

        error: (err: any) => { this.cd.markForCheck(); return this.feedback.fail(err); }

      });
  }

  //==========================
  // RESET
  //==========================

  resetForm() {

    this.submitted = false;

    this.editMode = false;

    this.selectedId = null;

    this.courseTaskForm.reset({
      courseName: '',
      taskTitle: ''
    });

  }

  //==========================
  // SEARCH
  //==========================

  search() {

    const value = this.searchText.toLowerCase();

    this.filteredMappings = this.mappings.filter(x =>

      (x.courseName ?? '').toLowerCase().includes(value) ||

      (x.taskTitle ?? '').toLowerCase().includes(value)

    );

  }

}
