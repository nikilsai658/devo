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

import { finalize } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { CollegedepartService } from '../../../features/services/collegedepartment/collegedepart-service';
import { CollegeService } from '../../../features/services/college/college-service';
import { DepartmentService } from '../../../features/services/department/department-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dialog/confirm';
import { toList } from '../../models/api-response.model';
@Component({
  selector: 'app-collegedepartment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './collegedepartment.html',
  styleUrls: ['./collegedepartment.css']
})
export class CollegeDepartmentComponent implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  collegeDepartmentForm!: FormGroup;

  mappings: any[] = [];
  filteredMappings: any[] = [];

  colleges: any[] = [];
  departments: any[] = [];

  submitted = false;
  loading = false;
  editMode = false;
  showModal = false;

  selectedId: number | null = null;

  searchText = '';


  constructor(
    private fb: FormBuilder,
    public auth: Auth,
    private collegeDepartmentService: CollegedepartService,
    private collegeService: CollegeService,
    private departmentService: DepartmentService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.buildForm();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadColleges();
    this.loadDepartments();
    this.loadMappings();
  }

  buildForm() {

    this.collegeDepartmentForm = this.fb.group({

      collegeName: ['', [AppValidators.required]],

      departmentName: ['', [AppValidators.required]]

    });

  }
   //=====================================
  // Load Colleges
  //=====================================

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

      },

      error: (err) => {
        this.feedback.fail(err, 'Unable to load colleges.');
        this.cd.markForCheck();



        this.colleges = [];

      }

    });

  }
  //=====================================
  // Load Departments
  //=====================================
loadDepartments(): void {


  this.departmentService.getDepartments().subscribe({

    next: (res: any) => {
      this.cd.markForCheck();



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
        this.departments = [];
      }


    },

    error: (err) => {
      this.feedback.fail(err, 'Unable to load departments.');
      this.cd.markForCheck();

      this.departments = [];
    }

  });

}

  //==========================
  // LOAD MAPPINGS
  //==========================

  loadMappings() {

    this.loading = true;

    this.collegeDepartmentService
      .getCollegedepartments()
      .pipe(finalize(() => { this.cd.markForCheck(); return this.loading = false; }))
      .subscribe({

        next: (res: any) => {
          this.cd.markForCheck();


          this.mappings = toList(res);

          this.filteredMappings = [...this.mappings];

        },

        error: (err) => {
          this.feedback.fail(err, 'Unable to load college-department mappings.');
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
  // SAVE
  //==========================

  save() {

    this.submitted = true;

    if (this.collegeDepartmentForm.invalid) {

      this.collegeDepartmentForm.markAllAsTouched();

      return;

    }

    const payload = this.collegeDepartmentForm.value;
    
    this.loading = true;

    if (this.editMode) {
       if (this.selectedId === null) {
       return;
       }
      this.collegeDepartmentService
        .updateCollegedepartment(this.selectedId, payload)
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

      this.collegeDepartmentService
        .createCollegedepartment(payload)
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

  if (!this.auth.hasPermission('UPDATE_COLLEGE_DEPARTMENT')) {
    return;
  }

  this.editMode = true;
  this.selectedId = item.id;

  this.collegeDepartmentForm.patchValue({
    collegeName: item.collegeName,
    departmentName: item.departmentName
  });

  this.showModal = true;
}

  //==========================
  // DELETE
  //==========================
async delete(id: number): Promise<void> {

  if (!this.auth.hasPermission('DELETE_COLLEGE_DEPARTMENT')) {
    return;
  }

  if (!(await this.confirmDialog.ask('Delete this mapping?'))) return;

  this.collegeDepartmentService.deleteCollegedepartment(id)
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

    // Reset to '' (not null) so the "Select …" placeholder options show.
    this.collegeDepartmentForm.reset({ collegeName: '', departmentName: '' });

  }

  //==========================
  // SEARCH
  //==========================

  search() {

    const value = this.searchText.toLowerCase();

    this.filteredMappings = this.mappings.filter(x =>

      x.collegeName.toLowerCase().includes(value) ||

      x.departmentName.toLowerCase().includes(value)

    );

  }

}