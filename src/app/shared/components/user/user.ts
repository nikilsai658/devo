import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
  Inject,
  PLATFORM_ID,
  ChangeDetectionStrategy,
  DestroyRef,
  inject
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { catchError, finalize, map, of, Subject, switchMap } from 'rxjs';

import { Auth } from '../../../core/auth/auth';
import { UserService } from '../../../features/services/user/user-service';
import { CollegeService } from '../../../features/services/college/college-service';
import { DepartmentService } from '../../../features/services/department/department-service';
import { BranchService } from '../../../features/services/branch/branch-service';
import { CollegedepartService } from '../../../features/services/collegedepartment/collegedepart-service';
import { DeptbranchService } from '../../../features/services/departmentbranch/deptbranch-service';
import { RoleService } from '../../../features/services/role/role-service';
import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { Feedback } from '../../feedback/feedback';
import { AppValidators, normalizePhone } from '../../validation';
import { ConfirmService } from '../confirm-dialog/confirm';
import { UserBulkUpload } from '../user-bulk-upload/user-bulk-upload';

@Component({
  selector: 'app-user',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    A11yModule,
    UserBulkUpload
  ],
  templateUrl: './user.html',
  styleUrls: ['./user.css']
})
export class UserComponent implements OnInit, OnDestroy {

  private confirmDialog = inject(ConfirmService);

  Math = Math;
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private collegeService: CollegeService,
    private departmentService: DepartmentService,
    private branchService: BranchService,
    private collegeDepartmentService: CollegedepartService,
    private departmentBranchService: DeptbranchService,
    private roleService: RoleService,
    private superadmin: Superadmin,
    public auth: Auth,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  // ==========================
  // Form
  // ==========================

  userForm!: FormGroup;

  showPassword = false;

  // ==========================
  // Data
  // ==========================
  users: any[] = [];

  colleges: any[] = [];
  departments: any[] = [];
  branches: any[] = [];
  roles: any[] = [];

  // Roles the signed-in user may give to someone (shown in the Add/Edit dialog). Until they load,
  // or if they cannot be loaded, the full list is shown and the API still enforces the rule.
  assignableRoles: any[] = [];
  assignableLoaded = false;

  // Add User only: let the API generate the password and email it, instead of typing one.
  autoPassword = false;

  get dialogRoles(): any[] {
    return this.assignableLoaded ? this.assignableRoles : this.roles;
  }


  // ==========================
  // UI
  // ==========================

  loading = false;
  submitted = false;
  editMode = false;
  showModal = false;

  // Inline messages: page/form actions, and the bulk upload card.
  feedback = new Feedback();

  selectedUserId: number | null = null;

  // Text for the page's screen-reader live region (visually hidden).
  srMessage = '';
  private srTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('userDialog') userDialog?: ElementRef<HTMLElement>;

  // ==========================
  // Filters
  // ==========================

  // Separate from userForm (the Add/Edit dialog).
  filterForm!: FormGroup;

  // Every user returned for the current filters; `users` is this list after
  // the search box and sorting are applied.
  private allUsers: any[] = [];

  // Each request cancels the previous one, so a slow old response can never
  // replace the result of newer filters.
  private readonly reload$ = new Subject<void>();

  private readonly destroyRef = inject(DestroyRef);

  // College -> department and department -> branch links, for narrowing the dropdowns.
  private collegeDepartments: any[] = [];
  private departmentBranches: any[] = [];

  // ==========================
  // Search
  // ==========================

  searchText = '';

  // ==========================
  // Pagination
  // ==========================

  page = 1;
  pageSize = 10;
  totalRecords = 0;

  // ==========================
  // Sorting
  // ==========================

  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // ==========================
  // Lifecycle
  // ==========================

  ngOnInit(): void {

    this.initializeForm();

    // Data is only fetched in the browser: the server has no session to fetch it with.
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.listenForReloads();

    this.loadColleges();

    this.loadDepartments();

    this.loadBranches();

    this.loadMappings();

    this.loadRoles();

    this.loadAssignableRoles();

    this.loadUsers();

    // The filter bar has its own form, so editing the Add/Edit dialog never
    // changes the filters or reloads the table.
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page = 1;
        this.loadUsers();
      });

  }

  // ==========================
  // Form Controls
  // ==========================

  get f() {
    return this.userForm.controls;
  }

  // ==========================
  // Modal Controls
  // ==========================

  openAddModal(): void {

    this.resetForm();

    this.reloadMissingOptions();

    this.showModal = true;

  }

  // Retry any dropdown list that came back empty (e.g. a failed first
  // load), so the dialog doesn't open with a blank College/Department/Branch.
  private reloadMissingOptions(): void {

    if (!this.colleges.length) {

      this.loadColleges();

    }

    if (!this.departments.length) {

      this.loadDepartments();

    }

    if (!this.branches.length) {

      this.loadBranches();

    }

  }

  closeModal(): void {

    this.showModal = false;

    this.resetForm();

  }

  // Escape closes the dialog. Focus goes back to the button that opened it
  // (cdkTrapFocusAutoCapture restores it).
  onDialogKeydown(event: KeyboardEvent): void {

    if (event.key === 'Escape') {

      event.stopPropagation();

      this.closeModal();

    }

  }

  // ==========================
  // Screen Reader Announcements
  // ==========================

  // Updates the polite live region. Debounced so fast typing in search
  // or quick filter changes read out only the final result.
  announce(message: string): void {

    if (this.srTimer) {

      clearTimeout(this.srTimer);

    }

    this.srTimer = setTimeout(() => {
      this.cdr.markForCheck();


      // Clear first so the same message twice in a row is still read: the empty text must
      // reach the DOM before the new one, hence two synchronous renders.
      this.srMessage = '';

      this.cdr.detectChanges(); // keep-detect-changes

      this.srMessage = message;

      this.cdr.detectChanges(); // keep-detect-changes

    }, 400);

  }

  private announceUserCount(): void {

    this.announce(
      `${this.totalRecords} ${this.totalRecords === 1 ? 'user' : 'users'} found.`
    );

  }

  // Name shown in the table, also used to give row buttons a specific
  // accessible name ("Edit Priya Sharma" rather than a list of "Edit").
  displayName(user: any): string {

    return user?.fullName ||
      ((user?.firstName || '') + ' ' + (user?.lastName || '')).trim() ||
      user?.email ||
      `user ${user?.id}`;

  }

  // Value for aria-sort on a sortable column header.
  ariaSort(column: string): 'ascending' | 'descending' | 'none' {

    if (this.sortColumn !== column) {

      return 'none';

    }

    return this.sortDirection === 'asc' ? 'ascending' : 'descending';

  }

  // After a failed submit, move focus to the first field with an error so
  // keyboard and screen-reader users land on the problem.
  private focusFirstInvalidField(): void {

    setTimeout(() => {
      this.cdr.markForCheck();


      const field = this.userDialog?.nativeElement.querySelector<HTMLElement>(
        'input.ng-invalid, select.ng-invalid'
      );

      field?.focus();

    });

  }

  // ==========================
  // Initialize Form
  // ==========================

  initializeForm(): void {

    this.userForm = this.fb.group({

      fullName: [
        '',
        [
          AppValidators.required,
          AppValidators.personName,
          AppValidators.minLength(3),
          AppValidators.maxLength(100)
        ]
      ],

      email: [
        '',
        [
          AppValidators.required,
          AppValidators.email,
          AppValidators.maxLength(100)
        ]
      ],

      password: [
        '',
        [
          AppValidators.required,
          AppValidators.strongPassword
        ]
      ],

      // IMPORTANT:
      // Backend expects roleName
      roleName: [
        '',
        AppValidators.required
      ],

      collegeName: [null],

      departmentName: [null],

      branchName: [null],

      yearNumber: [null, [AppValidators.integer, AppValidators.min(1), AppValidators.max(4)]],

      semester: [null, [AppValidators.integer, AppValidators.min(1), AppValidators.max(8)]],

      phoneNumber: [null, AppValidators.phone],

      registerNumber: [null, [AppValidators.code, AppValidators.maxLength(20)]],

      isActive: [true]

    });

    this.filterForm = this.fb.group({
      roleName: [''],
      collegeName: [null],
      departmentName: [null],
      branchName: [null],
      yearNumber: [null]
    });

  }

  // ==========================
  // Load Users
  // ==========================

  loadUsers(): void {

    this.reload$.next();

  }

  private listenForReloads(): void {

    this.reload$
      .pipe(
        switchMap(() => {

          this.loading = true;
          this.cdr.markForCheck();

          const filters = this.filterForm.value;

          // No status filter: the list shows active and inactive users, and
          // the Status column shows which is which.
          return this.userService
            .getUsers(
              filters.roleName || '',
              filters.collegeName || '',
              filters.departmentName || '',
              filters.branchName || '',
              filters.yearNumber || undefined
            )
            .pipe(
              map((res: any) => ({ ok: true as const, res })),
              catchError((err: any) => of({ ok: false as const, err }))
            );

        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {

        this.loading = false;

        if (result.ok) {

          this.allUsers = this.extractArray(result.res);

          this.allUsers.forEach((user: any) => {

            user.isLocked = false;

          });

          this.loadLockedStudents();

        }
        else {

          this.allUsers = [];

          this.feedback.fail(result.err, 'Unable to load users.');

        }

        this.applyView();

        this.announceUserCount();

        this.cdr.markForCheck();

      });

  }

  // Search box, then sorting, over the loaded users; keeps the page in range.
  private applyView(): void {

    const search = this.searchText?.trim().toLowerCase() ?? '';

    const fields = ['firstName', 'lastName', 'fullName', 'userName', 'email', 'roleName'];

    const visible = search
      ? this.allUsers.filter((user: any) =>
          fields.some(field => String(user?.[field] ?? '').toLowerCase().includes(search)))
      : [...this.allUsers];

    if (this.sortColumn) {

      const column = this.sortColumn;
      const direction = this.sortDirection === 'asc' ? 1 : -1;

      visible.sort((a: any, b: any) => {
        const valueA = a?.[column] ?? '';
        const valueB = b?.[column] ?? '';
        if (valueA < valueB) return -direction;
        if (valueA > valueB) return direction;
        return 0;
      });

    }

    this.users = visible;

    this.totalRecords = visible.length;

    this.page = Math.min(this.page, this.totalPages);

  }

  // ==========================
  // Dropdown narrowing
  // ==========================

  // College -> department and department -> branch links. Without them (not loaded, no access)
  // the dropdowns simply show every department / branch.
  loadMappings(): void {

    this.collegeDepartmentService.getCollegedepartments().subscribe({
      next: (res: any) => {
        this.collegeDepartments = this.extractArray(res);
        this.cdr.markForCheck();
      },
      // Optional: without the links the dropdowns list every department.
      error: () => {}
    });

    this.departmentBranchService.getDeptbranches().subscribe({
      next: (res: any) => {
        this.departmentBranches = this.extractArray(res);
        this.cdr.markForCheck();
      },
      // Optional: without the links the dropdowns list every branch.
      error: () => {}
    });

  }

  private nameOf(item: any, key: 'departmentName' | 'branchName'): string {

    return item?.name || item?.[key] || '';

  }

  // Departments linked to the college; every department when none is chosen or nothing is linked.
  departmentsFor(collegeName: string | null): any[] {

    if (!collegeName) {
      return this.departments;
    }

    const linked = new Set(
      this.collegeDepartments
        .filter((m: any) => m?.collegeName === collegeName)
        .map((m: any) => m?.departmentName)
    );

    return linked.size
      ? this.departments.filter((d: any) => linked.has(this.nameOf(d, 'departmentName')))
      : this.departments;

  }

  // Branches linked to the department; every branch when none is chosen or nothing is linked.
  branchesFor(departmentName: string | null): any[] {

    if (!departmentName) {
      return this.branches;
    }

    const linked = new Set(
      this.departmentBranches
        .filter((m: any) => m?.departmentName === departmentName)
        .map((m: any) => m?.branchName)
    );

    return linked.size
      ? this.branches.filter((b: any) => linked.has(this.nameOf(b, 'branchName')))
      : this.branches;

  }

  // A new college / department in the filter bar clears the filters below it.
  onFilterCollegeChange(): void {

    this.filterForm.patchValue({ departmentName: null, branchName: null }, { emitEvent: false });

  }

  onFilterDepartmentChange(): void {

    this.filterForm.patchValue({ branchName: null }, { emitEvent: false });

  }

  // ==========================
  // Load Colleges
  // ==========================

  loadColleges(): void {

    this.collegeService
      .getcollege()
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();


          this.colleges =
            Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
                ? res
                : [];

          // Zoneless app: re-render once the options arrive.

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.colleges = [];

          this.feedback.fail(err, 'Unable to load colleges.');

        }

      });

  }

  // ==========================
  // Load Departments
  // ==========================

  loadDepartments(): void {

    this.departmentService
      .getDepartments()
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();


          this.departments =
            Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
                ? res
                : [];

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.departments = [];

          this.feedback.fail(err, 'Unable to load departments.');

        }

      });

  }

  // ==========================
  // Load Branches
  // ==========================

  loadBranches(): void {

    this.branchService
      .getBranches()
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();


          this.branches =
            Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
                ? res
                : [];

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.branches = [];

          this.feedback.fail(err, 'Unable to load branches.');

        }

      });

  }

  // ==========================
  // Load Roles
  // ==========================

  loadRoles(): void {

    this.roleService
      .getRoles()
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();



          if (Array.isArray(res)) {

            this.roles = res;

          }
          else if (Array.isArray(res?.data)) {

            this.roles = res.data;

          }
          else if (Array.isArray(res?.items)) {

            this.roles = res.items;

          }
          else {

            this.roles = [];

          }


        },

        error: (err) => {
          this.feedback.fail(err, 'Unable to load roles.');
          this.cdr.markForCheck();



          this.roles = [];

        }

      });

  }

  loadAssignableRoles(): void {

    this.roleService.getAssignableRoles().subscribe({

      next: (res: any) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        this.assignableRoles = list;
        this.assignableLoaded = true;
        this.cdr.markForCheck();
      },

      // "No assignable roles" comes back as an error too: that is a real, empty answer.
      error: (err) => {
        if (err?.status === 404) {
          this.assignableRoles = [];
          this.assignableLoaded = true;
        }
        this.cdr.markForCheck();
      }

    });

  }

  // Choosing "generate a password" removes the password field from the form's rules.
  toggleAutoPassword(checked: boolean): void {

    this.autoPassword = checked;

    const control = this.userForm.get('password');

    control?.setValue('');
    control?.setValidators(checked
      ? []
      : [AppValidators.required, AppValidators.strongPassword]);
    control?.updateValueAndValidity();

    this.cdr.markForCheck();

  }

  // ==========================
  // Toggle Password Visibility
  // ==========================

  togglePasswordVisibility(): void {

    this.showPassword = !this.showPassword;

  }

  // ==========================
  // Save User
  // ==========================

  saveUser(): void {

    this.submitted = true;

    if (this.userForm.invalid) {

      this.userForm.markAllAsTouched();

      this.focusFirstInvalidField();

      return;

    }

    if (this.editMode) {

      this.updateUser();

    }
    else {

      this.createUser();

    }

  }

  // ==========================
  // Create User
  // ==========================

  createUser(): void {

    if (this.userForm.invalid) {

      this.userForm.markAllAsTouched();

      return;

    }

    this.loading = true;

    const formValue =
      this.userForm.value;

    /*
     * Backend payload
     */

    const payload = {

      fullName:
        formValue.fullName,

      email:
        formValue.email,

      password:
        formValue.password,

      roleName:
        formValue.roleName,

      collegeName:
        formValue.collegeName,

      departmentName:
        formValue.departmentName,

      branchName:
        formValue.branchName,

      yearNumber:
        formValue.yearNumber,

      semester:
        formValue.semester,

      phoneNumber:
        formValue.phoneNumber,

      registerNumber:
        formValue.registerNumber,

      isActive:
        formValue.isActive ?? true

    };


    const request = this.autoPassword
      ? this.userService.createUserAutoPassword(payload)
      : this.userService.createUser(payload);

    request
      .pipe(
        finalize(() => {
          this.cdr.markForCheck();


          this.loading = false;

        })
      )
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();



          this.feedback.ok(
            this.autoPassword
              ? 'User added. The password was emailed to them.'
              : (res?.message || 'User added successfully')
          );

          this.resetForm();

          this.loadUsers();

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.feedback.fail(err, 'Unable to create user.');

        }

      });

  }

  // ==========================
  // Edit User
  // ==========================

  editUser(user: any): void {


    this.selectedUserId =
      user?.id ??
      user?.userId ??
      null;

    this.editMode = true;

    /*
     * Password is optional during edit —
     * drop the required validator so a
     * blank password doesn't block the form,
     * but a new one must still be strong.
     */

    this.userForm.get('password')?.setValidators([AppValidators.strongPassword]);
    this.userForm.get('password')?.updateValueAndValidity();

    /*
     * Get role name safely.
     */

    const roleName =
      user?.roleName ??
      user?.role?.name ??
      user?.role?.roleName ??
      '';

    this.userForm.patchValue({

      fullName:
        user?.fullName ?? '',

      email:
        user?.email ?? '',

      /*
       * Password stays empty
       * during edit.
       */

      password: '',

      roleName:
        roleName,

      collegeName:
        user?.collegeName ?? null,

      departmentName:
        user?.departmentName ?? null,

      branchName:
        user?.branchName ?? null,

      yearNumber:
        user?.yearNumber ?? null,

      semester:
        user?.semester ?? null,

      phoneNumber:
        normalizePhone(user?.phoneNumber) || null,

      registerNumber:
        user?.registerNumber ?? null,

      isActive:
        user?.isActive ?? true

    });


    this.showModal = true;

    this.cdr.markForCheck();

  }

  // ==========================
  // Update User
  // ==========================

  updateUser(): void {

    if (
      this.selectedUserId === null
    ) {


      return;

    }

    const formValue =
      this.userForm.value;

    /*
     * Same structure as create.
     */

    const payload: any = {

      fullName:
        formValue.fullName,

      email:
        formValue.email,

      roleName:
        formValue.roleName,

      collegeName:
        formValue.collegeName,

      departmentName:
        formValue.departmentName,

      branchName:
        formValue.branchName,

      yearNumber:
        formValue.yearNumber,

      semester:
        formValue.semester,

      phoneNumber:
        formValue.phoneNumber,

      registerNumber:
        formValue.registerNumber,

      isActive:
        formValue.isActive ?? true

    };

    /*
     * Only send password when
     * user entered a new password.
     */

    if (
      formValue.password &&
      formValue.password.trim() !== ''
    ) {

      payload.newPassword =
        formValue.password;

    }


    this.loading = true;

    this.userService
      .updateUser(
        this.selectedUserId,
        payload
      )
      .pipe(
        finalize(() => {
          this.cdr.markForCheck();


          this.loading = false;

        })
      )
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();



          this.feedback.ok(
            res?.message ||
            'User updated successfully'
          );

          this.resetForm();

          this.loadUsers();

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.feedback.fail(err, 'Unable to update user.');

        }

      });

  }

  // ==========================
  // Delete User
  // ==========================

  async deleteUser(id: number): Promise<void> {

    if (
      !(await this.confirmDialog.ask(
        'Are you sure you want to delete this user?'
      ))
    ) {

      return;

    }

    this.loading = true;

    this.userService
      .deleteUser(id)
      .pipe(
        finalize(() => {
          this.cdr.markForCheck();


          this.loading = false;

        })
      )
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();


          this.feedback.ok(
            res?.message ||
            'User deleted successfully'
          );

          this.loadUsers();

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.feedback.fail(err, 'Unable to delete user.');

        }

      });

  }

  // ==========================
  // Reset Form
  // ==========================

  resetForm(): void {

    this.userForm.reset({

      fullName: '',

      email: '',

      password: '',

      roleName: '',

      collegeName: null,

      departmentName: null,

      branchName: null,

      yearNumber: null,

      semester: null,

      phoneNumber: null,

      registerNumber: null,

      isActive: true

    });

    /*
     * Back to create mode —
     * password is required again.
     */

    this.autoPassword = false;
    this.userForm.get('password')?.setValidators([AppValidators.required, AppValidators.strongPassword]);
    this.userForm.get('password')?.updateValueAndValidity();

    this.editMode = false;

    this.selectedUserId = null;

    this.submitted = false;

    this.showModal = false;

  }

  // ==========================
  // Cancel Edit
  // ==========================

  cancelEdit(): void {

    this.resetForm();

  }

  // ==========================
  // Search Users
  // ==========================

  // Filters the loaded users (no reload): each keystroke searches the full
  // list, so deleting characters brings matches back.
  searchUsers(): void {

    this.page = 1;

    this.applyView();

    this.announceUserCount();

  }

  // ==========================
  // Sort
  // ==========================

  sort(column: string): void {

    if (
      this.sortColumn === column
    ) {

      this.sortDirection =
        this.sortDirection === 'asc'
          ? 'desc'
          : 'asc';

    }
    else {

      this.sortColumn = column;

      this.sortDirection = 'asc';

    }

    this.applyView();

    this.announce(
      `Sorted by ${column === 'fullName' ? 'name' : column === 'roleName' ? 'role' : column}, ` +
      `${this.sortDirection === 'asc' ? 'ascending' : 'descending'}.`
    );

  }

  // ==========================
  // Pagination
  // ==========================

  get pagedUsers(): any[] {

    const start =
      (this.page - 1) *
      this.pageSize;

    return (this.users ?? []).slice(
      start,
      start + this.pageSize
    );

  }

  get totalPages(): number {

    return Math.max(
      1,
      Math.ceil(
        this.totalRecords /
        this.pageSize
      )
    );

  }

  get visiblePages(): (number | '...')[] {

    const total = this.totalPages;
    const current = this.page;
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

    return this.totalRecords === 0
      ? 0
      : (this.page - 1) * this.pageSize + 1;

  }

  get rangeEnd(): number {

    return Math.min(
      this.page * this.pageSize,
      this.totalRecords
    );

  }

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages) return;

    this.page = page;

    this.announcePage();

  }

  private announcePage(): void {

    this.announce(
      `Page ${this.page} of ${this.totalPages}, ` +
      `showing users ${this.rangeStart} to ${this.rangeEnd} of ${this.totalRecords}.`
    );

  }

  nextPage(): void {

    const users =
      this.users ?? [];

    if (
      this.page *
      this.pageSize <
      users.length
    ) {

      this.page++;

      this.announcePage();

    }

  }

  previousPage(): void {

    if (this.page > 1) {

      this.page--;

      this.announcePage();

    }

  }

  // ==========================
  // College Changed
  // ==========================

  // A new college clears the chosen department/branch; the dropdowns then
  // offer only what is linked to it (see departmentsFor / branchesFor).
  onCollegeChange(): void {

    // null, not '', so the "Select …" / "All …" placeholder shows.
    this.userForm.patchValue({

      departmentName: null,

      branchName: null

    });

    if (!this.departments.length) {

      this.loadDepartments();

    }

  }

  // ==========================
  // Department Changed
  // ==========================

  onDepartmentChange(): void {

    this.userForm.patchValue({

      branchName: null

    });

    if (!this.branches.length) {

      this.loadBranches();

    }

  }

  // ==========================
  // Status Changed
  // ==========================

  changeStatus(user: any): void {

    // isLocked is display state only, not a user field.
    const { isLocked, ...fields } = user;

    const payload = {

      ...fields,

      isActive:
        !user.isActive

    };

    this.userService
      .updateUser(
        user.id,
        payload
      )
      .subscribe({

        next: () => {
          this.cdr.markForCheck();


          user.isActive =
            !user.isActive;

        },

        error: (err) => {
          this.feedback.fail(err, "Unable to change this user's status.");
          this.cdr.markForCheck();
        }

      });

  }

  // ==========================
  // Load Locked Students
  // ==========================
  // Source of truth for lock state comes from
  // SuperAdmin/students/locked — cross-reference
  // its ids against the loaded users so locked
  // students show "Unlock" and the rest show "Lock".
  // ==========================

  loadLockedStudents(): void {

    this.superadmin.lockedStudents().subscribe({

      next: (res: any) => {
        this.cdr.markForCheck();



        const lockedIds = this.extractIds(res, ['studentId', 'StudentId', 'id', 'Id', 'userId', 'UserId']);

        this.allUsers.forEach((user: any) => {

          const userId = user?.id ?? user?.userId ?? user?.studentId;

          user.isLocked = lockedIds.has(this.normalizeId(userId));

        });

      },

      // Lock state needs SuperAdmin access; without it every row just shows "Lock".
      error: (err) => {
        this.cdr.markForCheck();



      }

    });

  }

  // ==========================
  // Response Helpers
  // ==========================

  extractArray(res: any): any[] {

    if (Array.isArray(res)) {
      return res;
    }

    if (Array.isArray(res?.data)) {
      return res.data;
    }

    if (Array.isArray(res?.items)) {
      return res.items;
    }

    if (Array.isArray(res?.result)) {
      return res.result;
    }

    if (Array.isArray(res?.students)) {
      return res.students;
    }

    if (Array.isArray(res?.lockedStudents)) {
      return res.lockedStudents;
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

  // ==========================
  // Lock / Unlock Student
  // ==========================

  async lockUser(user: any): Promise<void> {

    if (
      !(await this.confirmDialog.ask(
        `"${user?.fullName || user?.email}" will lose access until unlocked.`,
        { title: 'Lock this user?', confirmText: 'Lock' }
      ))
    ) {

      return;

    }

    this.superadmin
      .studentlock(user.id, {})
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();


          user.isLocked = true;

          this.feedback.ok('User locked successfully', res);

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.feedback.fail(err, 'Unable to lock user.');

        }

      });

  }

  async unlockUser(user: any): Promise<void> {

    if (
      !(await this.confirmDialog.ask(
        `"${user?.fullName || user?.email}" will be able to sign in again.`,
        { title: 'Unlock this user?', confirmText: 'Unlock', danger: false }
      ))
    ) {

      return;

    }

    this.superadmin
      .studentunlock(user.id, {})
      .subscribe({

        next: (res: any) => {
          this.cdr.markForCheck();


          user.isLocked = false;

          this.feedback.ok('User unlocked successfully', res);

        },

        error: (err) => {
          this.cdr.markForCheck();



          this.feedback.fail(err, 'Unable to unlock user.');

        }

      });

  }

  // ==========================
  // Refresh
  // ==========================

  refresh(): void {

    this.resetForm();

    this.loadUsers();

  }

  // ==========================
  // TrackBy
  // ==========================

  trackById(
    index: number,
    item: any
  ): number {

    return item.id;

  }

  // ==========================
  // Clear Filters
  // ==========================

  clearFilters(): void {

    // One change event: the filterForm subscription goes to page 1 and reloads.
    this.filterForm.reset({

      roleName: '',

      collegeName: null,

      departmentName: null,

      branchName: null,

      yearNumber: null

    });

  }

  ngOnDestroy(): void {

    if (this.srTimer) {

      clearTimeout(this.srTimer);

    }

  }

}