import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  ChangeDetectorRef, ChangeDetectionStrategy
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

import { Router, RouterLink } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';

import { Auth } from '../../../core/auth/auth';
import { StudentdomaincoursemapService } from '../../../features/services/studentdomaincourse/studentdomaincoursemap-ser';
import { DomainServices } from '../../../features/services/domain/domain-services';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, FieldError } from '../../validation';

import { ConfirmService } from '../confirm-dailog/confirm';
import { getAccessToken } from '../../../core/auth/token-storage';
@Component({
  selector: 'app-studentdomainmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FieldError,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './studentdomaincourse.html',
  styleUrls: ['./studentdomaincourse.css']
})
export class StudentDomainMapComponent implements OnInit {

  private confirmDialog = inject(ConfirmService);


  feedback = new Feedback();

  mappings: any[] = [];
  filteredMappings: any[] = [];

  domains: any[] = [];

  studentDomainForm!: FormGroup;

  loading = false;

  submitted = false;
  showModal = false;

  searchText = '';

  //=====================================
  // PAGINATION
  //=====================================

  currentPage = 1;
  pageSize = 10;

  constructor(
    private fb: FormBuilder,
    private api: StudentdomaincoursemapService,
    private domainService: DomainServices,
    private cookie: CookieService,
    private router: Router,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.buildForm();

    if (!isPlatformBrowser(this.platformId)) return;

    const token = getAccessToken();

    if (!token) {

      this.router.navigate(['/auth/login']);

      return;

    }


    this.loadDomains();

    this.loadMappings();

  }

  buildForm(): void {

    this.studentDomainForm = this.fb.group({

      studentEmail: ['', [AppValidators.required, AppValidators.email, AppValidators.maxLength(100)]],

      domainName: ['', [AppValidators.required]]

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

  //============================
  // Load Domains
  //============================

  loadDomains() {

    this.domainService.getDomains().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.domains = res.data || res.result || res || [];

        this.cd.detectChanges();

      },

      error: err => { this.cd.markForCheck(); return console.log(err); }

    });

  }

  //============================
  // Load Mapping List
  //============================

  loadMappings() {

    this.loading = true;

    this.api.getStudentdomaincoursemap().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.loading = false;

        this.mappings = res.data || res.result || res || [];

        if (!Array.isArray(this.mappings)) {

          this.mappings = [];

        }

        this.filteredMappings = [...this.mappings];

        this.currentPage = 1;

        this.cd.detectChanges();

      },

      error: err => {
        this.cd.markForCheck();


        this.loading = false;

        console.log(err);

      }

    });

  }

  //==========================
  // SAVE
  //==========================

  save(): void {

    this.submitted = true;

    if (!this.auth.hasPermission('CREATE_STUDENT_DOMAIN_COURSE_MAP')) return;

    if (this.studentDomainForm.invalid) {

      this.studentDomainForm.markAllAsTouched();

      return;

    }

    this.api.createStudentdomaincoursemap(this.studentDomainForm.value)

      .subscribe({

        next: () => {
          this.cd.markForCheck();


          this.loadMappings();

          this.closeModal();
          this.feedback.ok('Mapping added successfully');

        },

        error: err => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

      });

  }

  //============================
  // DELETE
  //============================

  async delete(id: number): Promise<void> {

    if (!this.auth.hasPermission('DELETE_STUDENT_DOMAIN_COURSE_MAP')) return;

    if (!(await this.confirmDialog.ask('Delete this mapping?'))) return;

    this.api.deleteStudentdomaincoursemap(id)

      .subscribe({

        next: (res: any) => {
          this.cd.markForCheck();


          this.loadMappings();
          this.feedback.ok('Mapping deleted successfully', res);

        },

        error: err => {
        this.cd.markForCheck();

        this.feedback.fail(err);
      }

      });

  }

  //============================
  // RESET
  //============================

  resetForm() {

    this.submitted = false;

    this.studentDomainForm.reset({

      studentEmail: '',

      domainName: ''

    });

  }

  //==========================
  // SEARCH
  //==========================

  search(): void {

    const value = this.searchText.toLowerCase();

    this.filteredMappings = this.mappings.filter(x =>

      (x.email || '').toLowerCase().includes(value) ||

      (x.domainName || '').toLowerCase().includes(value)

    );

    this.currentPage = 1;

  }

  //=====================================
  // PAGINATION
  //=====================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredMappings.length / this.pageSize
    ) || 1;

  }

  get pagedMappings(): any[] {

    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredMappings.slice(
      start,
      start + this.pageSize
    );

  }

  get visiblePages(): (number | '...')[] {

    const total = this.totalPages;
    const current = this.currentPage;
    const pages: (number | '...')[] = [];

    for (let i = 1; i <= total; i++) {

      const isEdge = i === 1 || i === total;
      const isNearCurrent = i >= current - 1 && i <= current + 1;

      if (isEdge || isNearCurrent) {

        pages.push(i);

      } else if (pages[pages.length - 1] !== '...') {

        pages.push('...');

      }

    }

    return pages;

  }

  get rangeStart(): number {

    return this.filteredMappings.length === 0
      ? 0
      : (this.currentPage - 1) * this.pageSize + 1;

  }

  get rangeEnd(): number {

    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredMappings.length
    );

  }

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages) return;

    this.currentPage = page;

  }

  prevPage(): void {

    this.goToPage(this.currentPage - 1);

  }

  nextPage(): void {

    this.goToPage(this.currentPage + 1);

  }

}
