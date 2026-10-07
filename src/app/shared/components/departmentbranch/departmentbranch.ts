import { Component, OnInit, ChangeDetectorRef, Inject, PLATFORM_ID, ChangeDetectionStrategy, inject } from '@angular/core';

import { CommonModule, isPlatformBrowser } from '@angular/common';

import { RouterLink } from '@angular/router';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { finalize } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { DepartmentService } from '../../../features/services/department/department-service';
import { BranchService } from '../../../features/services/branch/branch-service';
import { DeptbranchService} from '../../../features/services/departmentbranch/deptbranch-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dialog/confirm';
import { toList } from '../../models/api-response.model';
@Component({
  selector: 'app-departmentbranch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './departmentbranch.html',
  styleUrls: ['./departmentbranch.css']
})
export class DepartmentBranchComponent implements OnInit {

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  departmentBranchForm!: FormGroup;

  mappings: any[] = [];
  filteredMappings: any[] = [];

  departments: any[] = [];
  branches: any[] = [];

  submitted = false;
  loading = false;
  editMode = false;
  showModal = false;

  selectedId: number | null = null;

  searchText = '';

  constructor(
    private fb: FormBuilder,
    public auth: Auth,
    private departmentBranchService: DeptbranchService,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.buildForm();

    // Data needs the browser session (and router state); the server renders the empty page.
    if (!this.isBrowser) {
      return;
    }

    this.loadDepartments();
    this.loadBranches();
    this.loadMappings();

  }

  buildForm(): void {

    this.departmentBranchForm = this.fb.group({

      departmentName: ['', [AppValidators.required]],

      branchName: ['', [AppValidators.required]]

    });

  }

  //==========================
  // MODAL
  //==========================

  openAddModal(): void {
    this.resetForm();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForm();
  }

  //==========================
  // LOAD DEPARTMENTS
  //==========================

  loadDepartments(): void {

    this.departmentService.getDepartments().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.departments = res.data || [];

      },

      error: (err) => {
        this.feedback.fail(err, 'Unable to load departments.');
        this.cd.markForCheck();


        this.departments = [];

      }

    });

  }

  //==========================
  // LOAD BRANCHES
  //==========================

  loadBranches(): void {

    this.branchService.getBranches().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.branches = res.data || [];

      },

      error: (err) => {
        this.feedback.fail(err, 'Unable to load branches.');
        this.cd.markForCheck();


        this.branches = [];

      }

    });

  }

  //==========================
  // LOAD MAPPINGS
  //==========================

  loadMappings(): void {

    this.loading = true;

    this.departmentBranchService
      .getDeptbranches()
      .pipe(finalize(() => { this.cd.markForCheck(); return this.loading = false; }))
      .subscribe({

        next: (res: any) => {
          this.cd.markForCheck();


          this.mappings = toList(res);

          this.filteredMappings = [...this.mappings];

        },

        error: (err) => {
          this.feedback.fail(err, 'Unable to load department-branch mappings.');
          this.cd.markForCheck();


          this.mappings = [];
          this.filteredMappings = [];

        }

      });

  }

  //==========================
  // SAVE
  //==========================

  save(): void {

    this.submitted = true;

    if (this.departmentBranchForm.invalid) {

      this.departmentBranchForm.markAllAsTouched();

      return;

    }

    const payload = this.departmentBranchForm.value;

    this.loading = true;

    if (this.editMode) {

      if (this.selectedId == null) return;

      this.departmentBranchService
        .updateDeptbranch(this.selectedId, payload)
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

      this.departmentBranchService
        .createDeptbranch(payload)
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

  edit(item: any): void {

    if (!this.auth.hasPermission('UPDATE_DEPARTMENT_BRANCH')) return;

    this.editMode = true;

    this.selectedId = item.id;

    this.departmentBranchForm.patchValue({

      departmentName: item.departmentName,

      branchName: item.branchName

    });

    this.showModal = true;

  }

  //==========================
  // DELETE
  //==========================

  async delete(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_DEPARTMENT_BRANCH')) return;

    if (!(await this.confirmDialog.ask('Delete this mapping?'))) return;

    this.departmentBranchService.deleteDeptbranch(id)
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

  resetForm(): void {

    this.submitted = false;

    this.editMode = false;

    this.selectedId = null;

    // Reset to '' (not null) so the "Select …" placeholder options show.
    this.departmentBranchForm.reset({ departmentName: '', branchName: '' });

  }

  //==========================
  // SEARCH
  //==========================

  search(): void {

    const value = this.searchText.toLowerCase();

    this.filteredMappings = this.mappings.filter(x =>

      x.departmentName.toLowerCase().includes(value) ||

      x.branchName.toLowerCase().includes(value)

    );

  }

}