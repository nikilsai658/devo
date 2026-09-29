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
import { BranchService } from '../../../features/services/branch/branch-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-branch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './branch.html',
  styleUrls: ['./branch.css']
})
export class Branch implements OnInit {

  branches: any[] = [];

  departments: any[] = [];

  branchForm!: FormGroup;

  isEditMode = false;

  selectedBranchId = 0;

  showModal = false;

  feedback = new Feedback();

  searchText = '';

  // Branches matching the search box (by name or code, case-insensitive).
  get filteredBranches(): any[] {

    const term = this.searchText.trim().toLowerCase();

    if (!term) {
      return this.branches;
    }

    return this.branches.filter(branch =>
      String(branch.name ?? '').toLowerCase().includes(term) ||
      String(branch.code ?? '').toLowerCase().includes(term)
    );

  }

  constructor(
    private api: BranchService,
    private fb: FormBuilder,
    private cookie: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.branchForm = this.fb.group({

      name: ['', Validators.required],

      code: ['', Validators.required],

    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.cookie.get('token');

    if (!token) {

      this.router.navigate(['/auth/login']);

      return;

    }

    if (this.auth.hasPermission('VIEW_BRANCH')) {

      this.loadBranches();

    }

  }

  //=====================================
  // Load Branches
  //=====================================

  loadBranches(): void {

    this.api.getBranches().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        console.log('Branch Response', res);

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

  //=====================================
  // Modal Controls
  //=====================================

  openAddModal(): void {

    this.isEditMode = false;

    this.selectedBranchId = 0;

    this.branchForm.reset();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.resetForm();

  }

  //=====================================
  // Create Branch
  //=====================================

  createBranch(): void {

    if (this.branchForm.invalid) {

      this.branchForm.markAllAsTouched();

      return;

    }

    this.api.createBranch(this.branchForm.value).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.branchForm.reset();

        this.showModal = false;

        this.feedback.ok('Branch added successfully');

        this.loadBranches();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to add branch');

      }

    });

  }

  //=====================================
  // Edit Branch
  //=====================================

  editBranch(branch: any): void {

    this.isEditMode = true;

    this.selectedBranchId = branch.id;

    this.branchForm.patchValue({

      name: branch.name,

      code: branch.code,

      departmentId: branch.departmentId

    });

    this.showModal = true;

  }

  //=====================================
  // Update Branch
  //=====================================

  updateBranch(): void {

    if (this.branchForm.invalid) {

      this.branchForm.markAllAsTouched();

      return;

    }

    this.api.updateBranch(

      this.selectedBranchId,

      this.branchForm.value

    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.branchForm.reset();

        this.isEditMode = false;

        this.selectedBranchId = 0;

        this.showModal = false;

        this.feedback.ok('Branch updated successfully');

        this.loadBranches();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to update branch');

      }

    });

  }

  //=====================================
  // Delete Branch
  //=====================================

  deleteBranch(id: number): void {

    if (!confirm('Are you sure you want to delete this branch?')) {

      return;

    }

    this.api.deleteBranch(id).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Branch deleted successfully');

        this.loadBranches();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Failed to delete branch');

      }

    });

  }

  //=====================================
  // Reset Form
  //=====================================

  resetForm(): void {

    this.branchForm.reset();

    this.isEditMode = false;

    this.selectedBranchId = 0;

    this.showModal = false;

  }

}