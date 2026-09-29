import {
  Component,
  OnInit,
  ChangeDetectorRef,
  Inject,
  PLATFORM_ID, ChangeDetectionStrategy
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import { RouterLink } from '@angular/router';

import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';

import { finalize } from 'rxjs';

import { Auth } from '../../../core/auth/auth';

import { RoleService } from '../../../features/services/role/role-service';
import { PermissionService } from '../../../features/services/permission/permission-service';
import { RolepermissionService } from '../../../features/services/rolepermission/rolepermission-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-rolepermission',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './rolepermission.html',
  styleUrls: ['./rolepermission.css']
})
export class RolePermissionComponent implements OnInit {

  feedback = new Feedback();

  rolePermissionForm!: FormGroup;

  mappings: any[] = [];
  filteredMappings: any[] = [];

  roles: any[] = [];
  permissions: any[] = [];

  submitted = false;
  loading = false;
  showModal = false;

  searchText = '';
  selectedRole = '';

  //=====================================
  // PAGINATION
  //=====================================

  currentPage = 1;
  pageSize = 10;

  constructor(
    private fb: FormBuilder,
    public auth: Auth,
    private rolePermissionService:  RolepermissionService,
    private roleService: RoleService,
    private permissionService: PermissionService,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {

    this.buildForm();

    this.loadRoles();

    this.loadPermissions();

    this.loadMappings();

  }

  buildForm(): void {

    this.rolePermissionForm = this.fb.group({

      roleName: ['', Validators.required],

      permissionCode: ['', Validators.required],

      canDelegate: [true]

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

  //=====================================
  // LOAD ROLES
  //=====================================

  loadRoles(): void {

    this.roleService.getRoles().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.roles = Array.isArray(res)
          ? res
          : Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.result)
              ? res.result
              : [];

        this.cd.detectChanges();

      },

      error: () => {
        this.cd.markForCheck();


        this.roles = [];

      }

    });

  }

  //=====================================
  // LOAD PERMISSIONS
  //=====================================

  loadPermissions(): void {

    this.permissionService.getPermissions().subscribe({

      next: (res: any) => {
        this.cd.markForCheck();


        this.permissions = Array.isArray(res)
          ? res
          : Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.result)
              ? res.result
              : [];

        this.cd.detectChanges();

      },

      error: () => {
        this.cd.markForCheck();


        this.permissions = [];

      }

    });

  }

  //=====================================
  // LOAD MAPPINGS
  //=====================================

  loadMappings(): void {

    this.loading = true;

    this.rolePermissionService
      .getRolepermissions()
      .pipe(finalize(() => { this.cd.markForCheck(); return this.loading = false; }))
      .subscribe({

        next: (res: any) => {
          this.cd.markForCheck();


          const data = res?.data ?? res ?? {};

          const adminMappings = Array.isArray(data.adminRolePermissions)
            ? data.adminRolePermissions.map((m: any) => ({ ...m, scope: 'Admin' }))
            : [];

          const collegeMappings = Array.isArray(data.collegeRolePermissions)
            ? data.collegeRolePermissions.map((m: any) => ({ ...m, scope: 'College' }))
            : [];

          const combined = adminMappings.length || collegeMappings.length
            ? [...adminMappings, ...collegeMappings]
            : Array.isArray(data)
              ? data
              : Array.isArray(data.result)
                ? data.result
                : [];

          this.mappings = combined.map((m: any) => ({
            ...m,
            permissionCode: m.permissionCode
              ?? this.permissions.find(p => p.id === m.permissionId)?.code
              ?? m.permissionId
          }));

          this.applyFilters();

          this.currentPage = 1;

          this.cd.detectChanges();

        },

        error: () => {
          this.cd.markForCheck();


          this.mappings = [];

          this.filteredMappings = [];

        }

      });

  }

  //=====================================
  // SAVE
  //=====================================

  save(): void {

    this.submitted = true;

    if (!this.auth.hasPermission('CREATE_ROLE_PERMISSION')) return;

    if (this.rolePermissionForm.invalid) {

      this.rolePermissionForm.markAllAsTouched();

      return;

    }

    const payload = this.rolePermissionForm.value;

    this.loading = true;

    this.rolePermissionService
      .createRolepermission(payload)
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

  //=====================================
  // DELETE
  //=====================================

  delete(id: number): void {

    if (!this.auth.hasPermission('DELETE_ROLE_PERMISSION')) return;

    if (!confirm('Delete this mapping?')) return;

    this.rolePermissionService
      .deleteRolepermission(id)
      .subscribe({

        next: () => {
          this.cd.markForCheck();


          this.loadMappings();
          this.feedback.ok('Mapping deleted successfully');

        },

        error: (err: any) => { this.cd.markForCheck(); return this.feedback.fail(err); }

      });

  }

  //=====================================
  // RESET
  //=====================================

  resetForm(): void {

    this.submitted = false;

    this.rolePermissionForm.reset({

      roleName: '',

      permissionCode: '',

      canDelegate: true

    });

  }

  //=====================================
  // SEARCH
  //=====================================

  search(): void {

    this.applyFilters();

  }

  filterByRole(): void {

    this.applyFilters();

  }

  applyFilters(): void {

    const value = this.searchText.toLowerCase();

    this.filteredMappings = this.mappings.filter(x =>

      (!this.selectedRole || x.roleName === this.selectedRole) &&

      (
        !value ||
        (x.roleName ?? '').toLowerCase().includes(value) ||
        String(x.permissionCode ?? '').toLowerCase().includes(value)
      )

    );

    this.currentPage = 1;

  }

  get uniqueRoleNames(): string[] {

    return Array.from(
      new Set(this.mappings.map(x => x.roleName).filter(Boolean))
    );

  }

  //=====================================
  // PAGINATION
  //=====================================

  get totalPages(): number {

    return Math.ceil(
      this.filteredMappings.length / this.pageSize
    ) || 1;

  }

  get pageNumbers(): number[] {

    return Array.from(
      { length: this.totalPages },
      (_, i) => i + 1
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

  get pagedMappings(): any[] {

    const start = (this.currentPage - 1) * this.pageSize;

    return this.filteredMappings.slice(
      start,
      start + this.pageSize
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
