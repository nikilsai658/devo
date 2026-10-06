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
import { YearService } from '../../../features/services/year/year-service';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dailog/confirm';
import { getAccessToken } from '../../../core/auth/token-storage';
@Component({
  selector: 'app-year',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './year.html',
  styleUrls: ['./year.css']
})
export class Year implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  years: any[] = [];

  yearForm!: FormGroup;

  isEditMode = false;

  selectedYearId = 0;

  showModal = false;

  constructor(
    private api: YearService,
    private fb: FormBuilder,
    private cookie: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {

    this.yearForm = this.fb.group({

      yearNumber: ['', [AppValidators.required, AppValidators.integer, AppValidators.min(1), AppValidators.max(10)]],

      semester: ['', [AppValidators.required]]

    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = getAccessToken();

    if (!token) {

      this.router.navigate(['/auth/login']);

      return;

    }

    if (this.auth.hasPermission('VIEW_YEAR')) {

      this.loadYears();

    }

  }

  //==============================
  // Load Years
  //==============================

  loadYears(): void {

    this.api.getYears().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        if (Array.isArray(res)) {

          this.years = res;

        }

        else if (Array.isArray(res.data)) {

          this.years = res.data;

        }

        else if (Array.isArray(res.result)) {

          this.years = res.result;

        }

        else {

          this.years = [];

        }

        this.cd.detectChanges();

      },

      error: (err) => {
        this.cd.markForCheck();


        console.error(err);

        this.years = [];

      }

    });

  }

  //==============================
  // Modal Controls
  //==============================

  openAddModal(): void {

    if (!this.auth.hasPermission('CREATE_YEAR')) {

      this.feedback.fail('You do not have permission to perform this action.');

      return;

    }

    this.isEditMode = false;

    this.selectedYearId = 0;

    this.yearForm.reset();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.resetForm();

  }

  //==============================
  // Create Year
  //==============================

  createYear(): void {

    if (!this.auth.hasPermission('CREATE_YEAR')) {

      this.feedback.fail('You do not have permission to perform this action.');

      return;

    }

    if (this.yearForm.invalid) {

      this.yearForm.markAllAsTouched();

      return;

    }

    this.api.createYear(this.yearForm.value).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Year added successfully');

        this.resetForm();

        this.loadYears();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //==============================
  // Edit
  //==============================

  editYear(year: any): void {

    if (!this.auth.hasPermission('UPDATE_YEAR')) {

      this.feedback.fail('You do not have permission to perform this action.');

      return;

    }

    this.isEditMode = true;

    this.selectedYearId = year.id;

    this.yearForm.patchValue({

      yearNumber: year.yearNumber,

      semester: year.semester

    });

    this.showModal = true;

  }

  //==============================
  // Update
  //==============================

  updateYear(): void {

    if (!this.auth.hasPermission('UPDATE_YEAR')) {

      this.feedback.fail('You do not have permission to perform this action.');

      return;

    }

    if (this.yearForm.invalid) {

      this.yearForm.markAllAsTouched();

      return;

    }

    this.api.updateYear(

      this.selectedYearId,

      this.yearForm.value

    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Year updated successfully');

        this.resetForm();

        this.loadYears();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //==============================
  // Delete
  //==============================

  async deleteYear(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_YEAR')) {

      this.feedback.fail('You do not have permission to perform this action.');

      return;

    }

    if (!(await this.confirmDialog.ask('Delete this Year?'))) {

      return;

    }

    this.api.deleteYear(id).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.feedback.ok('Year deleted successfully', res);

        this.loadYears();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //==============================
  // Reset
  //==============================

  resetForm(): void {

    this.yearForm.reset({

      yearNumber: 1,

      semester: 1

    });

    this.isEditMode = false;

    this.selectedYearId = 0;

    this.showModal = false;

  }

}