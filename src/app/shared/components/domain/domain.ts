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
import { DomainServices } from '../../../features/services/domain/domain-services';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dailog/confirm';
@Component({
  selector: 'app-domain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './domain.html',
  styleUrls: ['./domain.css']
})
export class DomainComponent implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  domains: any[] = [];

  domainForm!: FormGroup;

  isEditMode = false;

  selectedId = 0;

  loading = false;

  showModal = false;

  constructor(
    private fb: FormBuilder,
    private api:DomainServices,
    private cookie: CookieService,
    private router: Router,
    public auth: Auth,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.domainForm = this.fb.group({
      name: ['', [AppValidators.required, AppValidators.title, AppValidators.minLength(2), AppValidators.maxLength(100)]],
      description: ['', [AppValidators.required, AppValidators.minLength(10), AppValidators.maxLength(1000)]],
      eligibleFromYear: [1, [AppValidators.required, AppValidators.integer, AppValidators.min(1), AppValidators.max(10)]],
      eligibleToYear: [1, [AppValidators.required, AppValidators.integer, AppValidators.min(1), AppValidators.max(10)]],
      isActive: [true]
    }, { validators: AppValidators.range('eligibleFromYear', 'eligibleToYear') });

    if (!isPlatformBrowser(this.platformId)) return;

    const token = this.cookie.get('token');

    if (!token) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadDomains();
  }

  //=============================
  // GET ALL
  //=============================

  loadDomains(): void {

    this.loading = true;

    this.api.getDomains().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.loading = false;

        this.domains =
          res.data ??
          res.result ??
          res.items ??
          res;

        if (!Array.isArray(this.domains)) {
          this.domains = [];
        }

        this.cd.detectChanges();
      },

      error: (err) => {
        this.cd.markForCheck();


        this.loading = false;

        console.error(err);

      }

    });

  }

  //=============================
  // MODAL CONTROLS
  //=============================

  openAddModal(): void {

    if (!this.auth.hasPermission('CREATE_DOMAIN')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    this.resetForm();

    this.showModal = true;

  }

  closeModal(): void {

    this.showModal = false;

    this.resetForm();

  }

  //=============================
  // CREATE
  //=============================

  createDomain(): void {

    if (!this.auth.hasPermission('CREATE_DOMAIN')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    if (this.domainForm.invalid) {
      this.domainForm.markAllAsTouched();
      return;
    }

    this.api.createDomain(this.domainForm.value).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Domain added successfully');

        this.resetForm();

        this.loadDomains();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=============================
  // EDIT
  //=============================

  editDomain(domain: any): void {

    if (!this.auth.hasPermission('UPDATE_DOMAIN')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    this.isEditMode = true;

    this.selectedId = domain.id;

    this.domainForm.patchValue({

      name: domain.name,
      description: domain.description,
      eligibleFromYear: domain.eligibleFromYear,
      eligibleToYear: domain.eligibleToYear,
      isActive: domain.isActive

    });

    this.showModal = true;

  }

  //=============================
  // UPDATE
  //=============================

  updateDomain(): void {

    if (!this.auth.hasPermission('UPDATE_DOMAIN')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    if (this.domainForm.invalid) {
      this.domainForm.markAllAsTouched();
      return;
    }

    this.api.updateDomain(
      this.selectedId,
      this.domainForm.value
    ).subscribe({

      next: () => {
        this.cd.markForCheck();


        this.feedback.ok('Domain updated successfully');

        this.resetForm();

        this.loadDomains();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=============================
  // DELETE
  //=============================

  async deleteDomain(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_DOMAIN')) {
      this.feedback.fail('You do not have permission to perform this action.');
      return;
    }

    if (!(await this.confirmDialog.ask('Delete this Domain?'))) return;

    this.api.deleteDomain(id).subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.feedback.ok('Domain deleted successfully', res);

        this.loadDomains();

      },

      error: (err) => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

    });

  }

  //=============================
  // RESET
  //=============================

  resetForm(): void {

    this.isEditMode = false;

    this.selectedId = 0;

    this.showModal = false;

    this.domainForm.reset({

      name: '',
      description: '',
      eligibleFromYear: 1,
      eligibleToYear: 1,
      isActive: true

    });

  }

}