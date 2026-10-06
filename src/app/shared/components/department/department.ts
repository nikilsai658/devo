import { ChangeDetectorRef, Component, Inject, PLATFORM_ID, ChangeDetectionStrategy  , inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DepartmentService } from '../../../features/services/department/department-service';
import { Router } from '@angular/router';
import { Auth } from '../../../core/auth/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dailog/confirm';
import { getAccessToken } from '../../../core/auth/token-storage';
@Component({
  selector: 'app-department',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:true,
  imports: [FieldError, CommonModule,ReactiveFormsModule],
  templateUrl: './department.html',
  styleUrl: './department.css',
})
export class Department {

  private confirmDialog = inject(ConfirmService);

    departments: any[] = [];

  departmentForm!: FormGroup;

  isEditMode = false;
  selectedDepartmentId = 0;
  showModal = false;

  feedback = new Feedback();

 sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  constructor(
    private api: DepartmentService,
    private fb: FormBuilder,
    private cookie:CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.departmentForm = this.fb.group({
      name: ['', [AppValidators.required, AppValidators.title, AppValidators.minLength(2), AppValidators.maxLength(100)]],
      code: ['', [AppValidators.required, AppValidators.code, AppValidators.minLength(2), AppValidators.maxLength(20)]]
    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Check login
    const token = getAccessToken();

    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Load departments
    if (this.auth.hasPermission('VIEW_DEPARTMENT')) {
      this.loadDepartments();
    }
  }

  //=====================================
  // Load Departments
  //=====================================
loadDepartments(): void {

  console.log('loadDepartments called');

  this.api.getDepartments().subscribe({

    next: (res: any) => {
      this.cd.markForCheck();


      console.log('Department Response:', res);

      // Case 1: API returns an array
      if (Array.isArray(res)) {
        this.departments = res;
      }

      // Case 2: API returns { data: [...] }
      else if (Array.isArray(res.data)) {
        this.departments = res.data;
      }

      // Case 3: API returns { result: [...] }
      else if (Array.isArray(res.result)) {
        this.departments = res.result;
      }

      else {
        console.error('Department API is not returning an array.', res);
        this.departments = [];
      }

      console.log('Departments Array:', this.departments);

      this.cd.detectChanges();

    },

    error: (err) => {
      this.cd.markForCheck();

      console.error(err);
      this.departments = [];
    }

  });

}

  //=====================================
  // Modal Controls
  //=====================================

  openAddModal(): void {

    this.isEditMode = false;

    this.selectedDepartmentId = 0;

    this.departmentForm.reset();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.isEditMode = false;

    this.selectedDepartmentId = 0;

    this.departmentForm.reset();

  }

  //=====================================
  // Create Department
  //=====================================

  createDepartment(): void {

    if (this.departmentForm.invalid) {

      this.departmentForm.markAllAsTouched();

      return;

    }

    this.api.createDepartment(this.departmentForm.value).subscribe({

      next: (res) => {
        this.cd.markForCheck();


        console.log(res);

        this.departmentForm.reset();

        this.showModal = false;

        this.feedback.ok('Department added successfully');

        this.loadDepartments();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to add department');

      }

    });

  }

  //=====================================
  // Edit
  //=====================================

  editDepartment(department: any): void {

    this.isEditMode = true;

    this.selectedDepartmentId = department.id;

    this.departmentForm.patchValue({

      name: department.name,
      code: department.code,
      collegeId: department.collegeId

    });

    this.showModal = true;

  }

  //=====================================
  // Update
  //=====================================

  updateDepartment(): void {

    if (this.departmentForm.invalid) {

      this.departmentForm.markAllAsTouched();

      return;

    }


    this.api.updateDepartment(
      this.selectedDepartmentId,
      this.departmentForm.value,

    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.departmentForm.reset();

        this.isEditMode = false;

        this.selectedDepartmentId = 0;

        this.showModal = false;

        this.feedback.ok('Department updated successfully');

        this.loadDepartments();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to update department');

      }

    });

  }

  //=====================================
  // Delete
  //=====================================

  async deleteDepartment(id: number): Promise<void> {

    if (!(await this.confirmDialog.ask('Are you sure you want to delete this department?'))) {
      return;
    }

    this.api.deleteDepartment(id).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.feedback.ok('Department deleted successfully', res);

        this.loadDepartments();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to delete department');

      }

    });

  }

  //=====================================
  // Reset
  //=====================================

  resetForm(): void {

    this.departmentForm.reset();

    this.isEditMode = false;

    this.selectedDepartmentId = 0;

    this.showModal = false;

  }
}