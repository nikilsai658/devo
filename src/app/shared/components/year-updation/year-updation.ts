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
  ReactiveFormsModule
} from '@angular/forms';

import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { finalize } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { YearService } from '../../../features/services/year/year-service';
import { CollegeService } from '../../../features/services/college/college-service';
import { DepartmentService } from '../../../features/services/department/department-service';
import { BranchService } from '../../../features/services/branch/branch-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';
import { getAccessToken } from '../../../core/auth/token-storage';

@Component({
  selector: 'app-year-updation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './year-updation.html',
  styleUrls: ['./year-updation.css']
})
export class YearUpdation implements OnInit {

  promoteFeedback = new Feedback();
  uploadFeedback = new Feedback();

  promoteForm!: FormGroup;

  colleges: any[] = [];
  departments: any[] = [];
  branches: any[] = [];

  submitted = false;
  loading = false;

  selectedFile: File | null = null;
  uploadLoading = false;

  singlePromoteForm!: FormGroup;
  singlePromoteLoading = false;

  constructor(
    private yearService: YearService,
    private collegeService: CollegeService,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private fb: FormBuilder,
    private cookie: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.buildForm();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = getAccessToken();

    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadColleges();
    this.loadDepartments();
    this.loadBranches();

  }

  //==============================
  // Build Form
  //==============================

  buildForm(): void {

    this.promoteForm = this.fb.group({

      fromYearId: ['', [AppValidators.required, AppValidators.integer, AppValidators.min(1)]],

      toYearId: ['', [AppValidators.required, AppValidators.integer, AppValidators.min(1)]],

      collegeName: [''],

      collegeCode: [''],

      departmentId: [null],

      branchId: [null]

    }, { validators: AppValidators.differentFrom('fromYearId', 'toYearId') });

    this.singlePromoteForm = this.fb.group({

      collegeName: [''],

      collegeCode: [''],

      studentEmail: ['', [AppValidators.required, AppValidators.email, AppValidators.maxLength(100)]],

      domainName: ['', AppValidators.required],

      toYearId: ['', [AppValidators.required, AppValidators.integer, AppValidators.min(1)]]

    });

  }

  //==============================
  // Load Colleges
  //==============================

  loadColleges(): void {

    this.collegeService.getcollege().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        if (Array.isArray(res)) {
          this.colleges = res;
        }
        else if (Array.isArray(res.data)) {
          this.colleges = res.data;
        }
        else if (Array.isArray(res.result)) {
          this.colleges = res.result;
        }
        else {
          this.colleges = [];
        }

        this.cd.detectChanges();

      },

      error: (err) => {
        this.cd.markForCheck();

        console.error(err);
        this.colleges = [];
      }

    });

  }

  //==============================
  // Load Departments
  //==============================

  loadDepartments(): void {

    this.departmentService.getDepartments().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        if (Array.isArray(res)) {
          this.departments = res;
        }
        else if (Array.isArray(res.data)) {
          this.departments = res.data;
        }
        else if (Array.isArray(res.result)) {
          this.departments = res.result;
        }
        else {
          this.departments = [];
        }

        this.cd.detectChanges();

      },

      error: (err) => {
        this.cd.markForCheck();

        console.error(err);
        this.departments = [];
      }

    });

  }

  //==============================
  // Load Branches
  //==============================

  loadBranches(): void {

    this.branchService.getBranches().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        if (Array.isArray(res)) {
          this.branches = res;
        }
        else if (Array.isArray(res.data)) {
          this.branches = res.data;
        }
        else if (Array.isArray(res.result)) {
          this.branches = res.result;
        }
        else {
          this.branches = [];
        }

        this.cd.detectChanges();

      },

      error: (err) => {
        this.cd.markForCheck();

        console.error(err);
        this.branches = [];
      }

    });

  }

  //==============================
  // College Change -> Auto-fill Code
  //==============================

  onCollegeChange(form: FormGroup = this.promoteForm): void {

    const selectedName = form.get('collegeName')?.value;

    const college = this.colleges.find(c => c.name === selectedName);

    form.patchValue({
      collegeCode: college ? college.code : ''
    });

  }

  //==============================
  // Promote Year
  //==============================

  promoteYear(): void {

    if (!this.auth.hasPermission('UPDATE_YEAR')) {
      this.promoteFeedback.fail('You do not have permission to promote years.');
      return;
    }

    this.submitted = true;

    if (this.promoteForm.invalid) {
      this.promoteForm.markAllAsTouched();
      return;
    }

    const raw = this.promoteForm.value;

    const payload = {
      fromYearId: Number(raw.fromYearId),
      toYearId: Number(raw.toYearId),
      collegeName: raw.collegeName || '',
      collegeCode: raw.collegeCode || '',
      departmentId: raw.departmentId ? Number(raw.departmentId) : null,
      branchId: raw.branchId ? Number(raw.branchId) : null
    };

    this.loading = true;

    this.yearService.YearUpdate(payload)
      .pipe(finalize(() => { this.cd.markForCheck(); return this.loading = false; }))
      .subscribe({

        next: () => {
          this.cd.markForCheck();

          this.resetForm();
          this.promoteFeedback.ok('Students promoted successfully');
        },

        error: (err) => {
          this.cd.markForCheck();

          this.promoteFeedback.fail(err, 'Failed to promote students');
        }

      });

  }

  //==============================
  // File Select -> Promote With Domains
  //==============================

  onFileSelected(event: Event): void {

    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    }

  }

  uploadPromoteFile(): void {

    if (!this.auth.hasPermission('UPDATE_YEAR')) {
      this.uploadFeedback.fail('You do not have permission to promote years.');
      return;
    }

    if (!this.selectedFile) {
      this.uploadFeedback.fail('Please select a file');
      return;
    }

    this.uploadLoading = true;

    this.yearService.YearUpdatewithDomain(this.selectedFile)
      .pipe(finalize(() => { this.cd.markForCheck(); return this.uploadLoading = false; }))
      .subscribe({

        next: () => {
          this.cd.markForCheck();

          this.uploadFeedback.ok('Students promoted successfully');
          this.selectedFile = null;
        },

        error: (err) => {
          this.cd.markForCheck();

          this.uploadFeedback.fail(err, 'Failed to promote students from file');
        }

      });

  }

  //==============================
  // Promote Single Student With Domain
  //==============================

  /*promoteSingleWithDomain(): void {

    if (!this.auth.hasPermission('UPDATE_YEAR')) {
      alert('You do not have permission to promote years.');
      return;
    }

    if (this.singlePromoteForm.invalid) {
      this.singlePromoteForm.markAllAsTouched();
      return;
    }

    const raw = this.singlePromoteForm.value;

    const payload = {
      collegeName: raw.collegeName || '',
      collegeCode: raw.collegeCode || '',
      studentEmail: raw.studentEmail,
      domainName: raw.domainName,
      toYearId: Number(raw.toYearId)
    };

    this.singlePromoteLoading = true;

    this.yearService.YearUpdatesingleDomain(payload)
      .pipe(finalize(() => this.singlePromoteLoading = false))
      .subscribe({

        next: () => {
          alert('Student Promoted Successfully');
          this.resetSinglePromoteForm();
        },

        error: (err) => {
          console.error(err);
        }

      });

  }*/

  resetSinglePromoteForm(): void {

    this.singlePromoteForm.reset({
      collegeName: '',
      collegeCode: '',
      studentEmail: '',
      domainName: '',
      toYearId: ''
    });

  }

  //==============================
  // Reset
  //==============================

  resetForm(): void {

    this.submitted = false;

    this.promoteForm.reset({
      fromYearId: '',
      toYearId: '',
      collegeName: '',
      collegeCode: '',
      departmentId: null,
      branchId: null
    });

  }

}
