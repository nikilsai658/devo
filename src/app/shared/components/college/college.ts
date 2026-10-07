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

import { Auth } from '../../../core/auth/auth';
import { CollegeService } from '../../../features/services/college/college-service';
import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, DigitsOnly, FieldError, normalizePhone } from '../../validation';

import { ConfirmService } from '../confirm-dialog/confirm';
@Component({
  selector: 'app-college',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FieldError,
    DigitsOnly
  ],
  templateUrl: './college.html',
  styleUrls: ['./college.css']
})
export class College implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  colleges: any[] = [];

  collegeForm!: FormGroup;

  isEditMode = false;

  selectedCollegeId = 0;

  showModal = false;

  //=====================================
  // College License
  //=====================================

  licenseForm!: FormGroup;

  showLicenseModal = false;

  selectedLicenseCollege: any = null;

  constructor(
    private api: CollegeService,
    private superadmin: Superadmin,
    private fb: FormBuilder,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    // Create Form
    this.collegeForm = this.fb.group({

      name: ['', [AppValidators.required, AppValidators.title, AppValidators.minLength(3), AppValidators.maxLength(150)]],

      code: ['', [AppValidators.required, AppValidators.code, AppValidators.minLength(2), AppValidators.maxLength(20)]],

      email: ['', [AppValidators.required, AppValidators.email, AppValidators.maxLength(100)]],

      phoneNumber: ['', [AppValidators.required, AppValidators.phone]]

    });

    // Create License Form
    this.licenseForm = this.fb.group({

      isLicensed: [true],

      licenseExpiresAt: ['']

    });

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Permission Based View
    if (this.auth.hasPermission('VIEW_COLLEGE')) {

      this.loadColleges();

    }

  }

  //=====================================
  // Load Colleges
  //=====================================

  loadColleges(): void {

    this.api.getcollege().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();



        this.colleges = this.extractArray(res);

        this.colleges.forEach((college: any) => {

          college.isLocked = false;

          const license = this.resolveCollegeLicense(college);

          college.isLicensed = license.isLicensed;

          college.licenseExpiresAt = license.licenseExpiresAt;

        });

        this.loadLockedColleges();

      },

      error: (err) => {
        this.feedback.fail(err, 'Unable to load colleges.');
        this.cd.markForCheck();



        this.colleges = [];

      }

    });

  }

  //=====================================
  // Load Locked Colleges
  //=====================================
  // Source of truth for lock state comes from
  // SuperAdmin/colleges/locked — cross-reference
  // its ids against the loaded colleges so locked
  // colleges show "Unlock" and the rest show "Lock".
  //=====================================

  loadLockedColleges(): void {

    this.superadmin.collegelocked().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        const lockedIds = this.extractIds(res, ['collegeId', 'CollegeId', 'id', 'Id']);

        this.colleges.forEach((college: any) => {

          college.isLocked = lockedIds.has(this.normalizeId(college.id));

        });

      },

      error: (err) => {
        this.feedback.fail(err, 'Unable to load which colleges are locked.');
        this.cd.markForCheck();



      }

    });

  }

  //=====================================
  // Response Helpers
  //=====================================

  extractArray(res: any): any[] {

    if (Array.isArray(res)) {
      return res;
    }

    if (Array.isArray(res?.data)) {
      return res.data;
    }

    if (Array.isArray(res?.result)) {
      return res.result;
    }

    if (Array.isArray(res?.items)) {
      return res.items;
    }

    return [];

  }

  extractIds(res: any, keys: string[]): Set<string> {

    const ids = this.extractArray(res)
      .map((item: any) => {

        if (item && typeof item === 'object') {

          for (const key of keys) {

            if (item[key] !== undefined && item[key] !== null) {
              return item[key];
            }

          }

          return undefined;

        }

        return item;

      })
      .filter((id: any) => id !== undefined && id !== null);

    return new Set(ids.map((id: any) => this.normalizeId(id)));

  }

  // Ids may be numeric (colleges) or GUID strings (students) —
  // compare as trimmed lowercase strings so both shapes match.
  normalizeId(id: any): string {

    return String(id).trim().toLowerCase();

  }

  //=====================================
  // Resolve College License
  //=====================================
  // Backend may return license fields directly on the
  // college or nested under a "license" object — check
  // every known shape so the column reflects the real
  // state on load/refresh.
  //=====================================

  resolveCollegeLicense(college: any): { isLicensed?: boolean; licenseExpiresAt: string | null } {

    const isLicensedRaw =
      college?.isLicensed ??
      college?.IsLicensed ??
      college?.license?.isLicensed ??
      college?.license?.IsLicensed;

    const licenseExpiresAtRaw =
      college?.licenseExpiresAt ??
      college?.LicenseExpiresAt ??
      college?.license?.licenseExpiresAt ??
      college?.license?.LicenseExpiresAt ??
      null;

    return {
      isLicensed: typeof isLicensedRaw === 'boolean' ? isLicensedRaw : undefined,
      licenseExpiresAt: licenseExpiresAtRaw ?? null
    };

  }

  //=====================================
  // License Expiry Label (Table Display)
  //=====================================

  getLicenseExpiryLabel(college: any): string {

    if (college?.isLicensed === false) {
      return 'Not Licensed';
    }

    if (!college?.licenseExpiresAt) {
      return college?.isLicensed === true ? 'No Expiry' : '-';
    }

    const date = new Date(college.licenseExpiresAt);

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString();

  }

  //=====================================
  // Date <-> datetime-local Helpers
  //=====================================

  private toDatetimeLocal(iso: string | null | undefined): string {

    if (!iso) {
      return '';
    }

    const date = new Date(iso);

    if (isNaN(date.getTime())) {
      return '';
    }

    const pad = (n: number) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;

  }

  //=====================================
  // License Modal Controls
  //=====================================

  openLicenseModal(college: any): void {

    if (!this.auth.hasPermission('MANAGE_COLLEGE_LICENSING')) {

      this.feedback.fail('You do not have permission to manage college licensing.');

      return;

    }

    this.selectedLicenseCollege = college;

    this.licenseForm.patchValue({

      isLicensed: college?.isLicensed ?? true,

      licenseExpiresAt: this.toDatetimeLocal(college?.licenseExpiresAt)

    });

    this.showLicenseModal = true;

  }

  closeLicenseModal(): void {

    this.showLicenseModal = false;

    this.selectedLicenseCollege = null;

    this.licenseForm.reset({ isLicensed: true, licenseExpiresAt: '' });

  }

  //=====================================
  // Save College License
  //=====================================

  saveLicense(): void {

    if (!this.auth.hasPermission('MANAGE_COLLEGE_LICENSING')) {

      this.feedback.fail('You do not have permission to manage college licensing.');

      return;

    }

    if (!this.selectedLicenseCollege) {
      return;
    }

    const formValue = this.licenseForm.value;

    const payload = {

      isLicensed: formValue.isLicensed,

      licenseExpiresAt: formValue.licenseExpiresAt
        ? new Date(formValue.licenseExpiresAt).toISOString()
        : null

    };

    this.superadmin.collegelicense(this.selectedLicenseCollege.id, payload).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.selectedLicenseCollege.isLicensed = payload.isLicensed;

        this.selectedLicenseCollege.licenseExpiresAt = payload.licenseExpiresAt;

        this.feedback.ok('License updated successfully');

        this.closeLicenseModal();

      },

      error: (err) => {
        this.cd.markForCheck();


        this.feedback.fail(err, 'Unable to update license.');

      }

    });

  }

  //=====================================
  // Modal Controls
  //=====================================

  openAddModal(): void {

    if (!this.auth.hasPermission('CREATE_COLLEGE')) {

      this.feedback.fail('You do not have permission to create colleges.');

      return;

    }

    this.isEditMode = false;

    this.selectedCollegeId = 0;

    this.collegeForm.reset();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.resetForm();

  }

  //=====================================
  // Create College
  //=====================================

  createCollege(): void {

    if (!this.auth.hasPermission('CREATE_COLLEGE')) {

      this.feedback.fail('You do not have permission to create colleges.');

      return;

    }

    if (this.collegeForm.invalid) {

      this.collegeForm.markAllAsTouched();

      return;

    }

    this.api.createcollege(this.collegeForm.value).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('College added successfully');

        this.resetForm();

        this.loadColleges();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=====================================
  // Edit College
  //=====================================

  editCollege(college: any): void {

    if (!this.auth.hasPermission('UPDATE_COLLEGE')) {

      this.feedback.fail('You do not have permission to edit.');

      return;

    }

    this.isEditMode = true;

    this.selectedCollegeId = college.id;

    this.collegeForm.patchValue({

      name: college.name,

      code: college.code,

      email: college.email,

      phoneNumber: normalizePhone(college.phoneNumber)

    });

    this.showModal = true;

  }

  //=====================================
  // Update College
  //=====================================

  updateCollege(): void {

    if (!this.auth.hasPermission('UPDATE_COLLEGE')) {

      this.feedback.fail('You do not have permission to update.');

      return;

    }

    if (this.collegeForm.invalid) {

      this.collegeForm.markAllAsTouched();

      return;

    }

    this.api.updatecollege(

      this.selectedCollegeId,

      this.collegeForm.value

    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('College updated successfully');

        this.resetForm();

        this.loadColleges();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=====================================
  // Delete College
  //=====================================

  async deleteCollege(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_COLLEGE')) {

      this.feedback.fail('You do not have permission to delete.');

      return;

    }

    if (!(await this.confirmDialog.ask('Are you sure you want to delete this college?'))) {

      return;

    }

    this.api.deletecollege(id).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.feedback.ok('College deleted successfully', res);

        this.loadColleges();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=====================================
  // College License (Lock / Unlock)
  //=====================================

  async lockCollege(college: any): Promise<void> {

    if (!this.auth.hasPermission('UPDATE_COLLEGE')) {

      this.feedback.fail('You do not have permission to lock colleges.');

      return;

    }

    if (!(await this.confirmDialog.ask(`Users of "${college.name}" will lose access until it is unlocked.`, { title: 'Lock this college?', confirmText: 'Lock' }))) {

      return;

    }

    this.superadmin.collegelock(college.id, {}).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        college.isLocked = true;

        this.feedback.ok('College locked successfully', res);

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  async unlockCollege(college: any): Promise<void> {

    if (!this.auth.hasPermission('UPDATE_COLLEGE')) {

      this.feedback.fail('You do not have permission to unlock colleges.');

      return;

    }

    if (!(await this.confirmDialog.ask(`Users of "${college.name}" will be able to sign in again.`, { title: 'Unlock this college?', confirmText: 'Unlock', danger: false }))) {

      return;

    }

    this.superadmin.collegeunlock(college.id, {}).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        college.isLocked = false;

        this.feedback.ok('College unlocked successfully', res);

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

    this.collegeForm.reset();

    this.isEditMode = false;

    this.selectedCollegeId = 0;

    this.showModal = false;

  }

}