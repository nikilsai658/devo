import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, ElementRef, ViewChild, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { Header } from '../../shared/components/header/header';
import { Footer } from '../../shared/components/footer/footer';
import { Auth } from '../../core/auth/auth';
import { DepartmentService } from '../services/department/department-service';
import { Branch } from "../../shared/components/branch/branch";
import { College } from '../../shared/components/college/college';
import { Role } from "../../shared/components/role/role";
import { Permission } from "../../shared/components/permissions/permissions";
import { Course } from "../../shared/components/course/course";
import { Year } from "../../shared/components/year/year";
import { DomainComponent } from "../../shared/components/domain/domain";
import { AssignmentComponent } from "../../shared/components/assignment/assignment";
import { CollegeDepartmentComponent } from '../../shared/components/collegedepartment/collegedepartment';
import { DepartmentBranchComponent } from "../../shared/components/departmentbranch/departmentbranch";
import { DomainCourseMapComponent } from '../../shared/components/domaincourse/domaincourse';
import { CourseAssignmentMapComponent } from '../../shared/components/courseassignment/courseassignment';
import { StudentDomainMapComponent } from '../../shared/components/studentdomaincourse/studentdomaincourse';
import { RolePermissionComponent } from '../../shared/components/rolepermission/rolepermission';
import { UserComponent } from '../../shared/components/user/user';
import { Department } from "../../shared/components/department/department";
import { StudentAssignment } from "../../shared/components/studentassignment/studentassignment";
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    Header,
    Footer,
    CommonModule,
    ReactiveFormsModule,
    Branch,
    College,
    Role,
    Permission,
    Course,
    Year,
    DomainComponent,
    AssignmentComponent,
    CollegeDepartmentComponent,
    DepartmentBranchComponent,
    DomainCourseMapComponent,
    CourseAssignmentMapComponent,
    StudentDomainMapComponent,
    RolePermissionComponent,
    UserComponent,
    Department,
    RouterOutlet,
    StudentAssignment
],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class Admin implements OnInit {

  departments: any[] = [];

  departmentForm!: FormGroup;

  isEditMode = false;
  selectedDepartmentId = 0;

 sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }
  constructor(
    private api: DepartmentService,
    private fb: FormBuilder,
    private cookie: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object,
    private destroyRef: DestroyRef
  ) {
    // Pages scroll inside the fixed .content frame, not the window, so the
    // router's scrollPositionRestoration can't reset it. Do it on every navigation.
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.contentRef?.nativeElement.scrollTo({ top: 0, left: 0 });
      });
  }

  @ViewChild('content') contentRef?: ElementRef<HTMLElement>;

  ngOnInit(): void {

    this.departmentForm = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      collegeId: ['', Validators.required]
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
      console.error(err);
      this.departments = [];
    }

  });

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

        console.log(res);

        alert('Department Created Successfully');

        this.departmentForm.reset();

        this.loadDepartments();

      },

      error: (err) => {

        console.error(err);

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

        alert('Department Updated Successfully');

        this.departmentForm.reset();

        this.isEditMode = false;

        this.selectedDepartmentId = 0;

        this.loadDepartments();

      },

      error: (err) => {

        console.error(err);

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

        alert('Department Deleted Successfully');

        this.loadDepartments();

      },

      error: (err) => {

        console.error(err);

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

  }

}