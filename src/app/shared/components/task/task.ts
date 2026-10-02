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
  ReactiveFormsModule
} from '@angular/forms';

import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { Auth } from '../../../core/auth/auth';
import { TaskService } from '../../../features/services/task/task-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dailog/confirm';
@Component({
  selector: 'app-task',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './task.html',
  styleUrls: ['./task.css']
})
export class Task implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  tasks: any[] = [];

  taskForm!: FormGroup;

  loading = false;

  isEditMode = false;

  selectedTaskId = 0;

  showModal = false;

  constructor(
    private api: TaskService,
    private fb: FormBuilder,
    private cookie: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    // Create Form
    this.taskForm = this.fb.group({

      title: ['', [AppValidators.required, AppValidators.minLength(3), AppValidators.maxLength(150)]],
      question: ['', [AppValidators.required, AppValidators.minLength(5), AppValidators.maxLength(2000)]],
      isActive: [true]

    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.cookie.get('token');

    if (!token) {

      this.router.navigate(['/auth/login']);

      return;

    }

    // Permission Based View
    if (this.auth.hasPermission('VIEW_TASK')) {

      this.loadTasks();

    }

  }

  //=====================================
  // Load Tasks
  //=====================================

  loadTasks(): void {

    this.loading = true;

    this.api.getTask().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.loading = false;

        if (Array.isArray(res)) {

          this.tasks = res;

        }

        else if (Array.isArray(res.data)) {

          this.tasks = res.data;

        }

        else if (Array.isArray(res.result)) {

          this.tasks = res.result;

        }

        else {

          this.tasks = [];

        }

        this.cd.detectChanges();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.loading = false;

        console.error(err);

        this.tasks = [];

      }

    });

  }

  //=====================================
  // Modal Controls
  //=====================================

  openAddModal(): void {

    if (!this.auth.hasPermission('CREATE_TASK')) {

      this.feedback.fail('You do not have permission to create tasks.');

      return;

    }

    this.isEditMode = false;

    this.selectedTaskId = 0;

    this.taskForm.reset({
      title: '',
      question: '',
      isActive: true
    });

    this.showModal = true;

  }

  closeModal(): void {

    this.resetForm();

  }

  //=====================================
  // Create Task
  //=====================================

  createTask(): void {

    if (!this.auth.hasPermission('CREATE_TASK')) {

      this.feedback.fail('You do not have permission to create tasks.');

      return;

    }

    if (this.taskForm.invalid) {

      this.taskForm.markAllAsTouched();

      return;

    }

    this.api.postTask(this.taskForm.value).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Task added successfully');

        this.resetForm();

        this.loadTasks();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=====================================
  // Edit Task
  //=====================================

  editTask(task: any): void {

    if (!this.auth.hasPermission('UPDATE_TASK')) {

      this.feedback.fail('You do not have permission to edit.');

      return;

    }

    this.isEditMode = true;

    this.selectedTaskId = task.id ?? task.taskId;

    this.taskForm.patchValue({

      title: task.title,

      question: task.question,

      isActive: task.isActive ?? true

    });

    this.showModal = true;

  }

  //=====================================
  // Update Task
  //=====================================

  updateTask(): void {

    if (!this.auth.hasPermission('UPDATE_TASK')) {

      this.feedback.fail('You do not have permission to update.');

      return;

    }

    if (this.taskForm.invalid) {

      this.taskForm.markAllAsTouched();

      return;

    }

    this.api.UpdateTask(

      this.selectedTaskId,

      this.taskForm.value

    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Task updated successfully');

        this.resetForm();

        this.loadTasks();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=====================================
  // Delete Task
  //=====================================

  async deleteTask(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_TASK')) {

      this.feedback.fail('You do not have permission to delete.');

      return;

    }

    if (!(await this.confirmDialog.ask('Are you sure you want to delete this task?'))) {

      return;

    }

    this.api.deleteTask(id).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.feedback.ok('Task deleted successfully', res);

        this.loadTasks();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=====================================
  // Reset Form
  //=====================================

  resetForm(): void {

    this.taskForm.reset({
      title: '',
      question: '',
      isActive: true
    });

    this.isEditMode = false;

    this.selectedTaskId = 0;

    this.showModal = false;

  }

}
