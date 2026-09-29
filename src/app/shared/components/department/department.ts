import { ChangeDetectorRef, Component, Inject, PLATFORM_ID, ChangeDetectionStrategy  } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartmentService } from '../../../features/services/department/department-service';
import { Router } from '@angular/router';
import { Auth } from '../../../core/auth/auth';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { CookieService } from 'ngx-cookie-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-department',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone:true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './department.html',
  styleUrl: './department.css',
})
export class Department {
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
      name: ['', Validators.required],
      code: ['', Validators.required]
    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Check login
    const token = this.cookie.get('token');

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

  deleteDepartment(id: number): void {

    if (!confirm('Are you sure you want to delete this department?')) {
      return;
    }

    this.api.deleteDepartment(id).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Department deleted successfully');

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