import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Auth } from '../../../core/auth/auth';
import { AuditLogService } from '../../../features/services/auditlog/auditlog-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-audit-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './audit-log.html',
  styleUrl: './audit-log.css',
})
export class AuditLog implements OnInit {

  logs: any[] = [];
  filterForm!: FormGroup;
  feedback = new Feedback();

  page = 1;
  pageSize = 25;
  totalCount = 0;
  totalPages = 0;
  loading = false;
  expanded: number | null = null;

  readonly pageSizes = [10, 25, 50, 100];

  constructor(
    private api: AuditLogService,
    private fb: FormBuilder,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      action: [''],
      actor: [''],
      entityType: [''],
      entityId: [''],
      collegeCode: [''],
      from: [''],
      to: ['']
    });

    if (isPlatformBrowser(this.platformId) && this.auth.hasPermission('VIEW_AUDIT_LOG')) {
      this.load();
    }
  }

  // The college filter only makes sense for the SuperAdmin, who sees every college.
  get isSuperAdmin(): boolean {
    return this.auth.hasPermission('VIEW_SUPERADMIN_COLLEGES');
  }

  load(): void {
    this.loading = true;
    const value = this.filterForm.value;

    this.api.getLogs({
      ...value,
      from: value.from ? new Date(value.from).toISOString() : '',
      to: value.to ? new Date(value.to).toISOString() : '',
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({
      next: (res: any) => {
        this.logs = Array.isArray(res?.data) ? res.data : [];
        const info = res?.pagination;
        this.totalCount = info?.totalCount ?? this.logs.length;
        this.totalPages = info?.totalPages ?? 1;
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.logs = [];
        this.loading = false;
        this.feedback.fail(err, 'Failed to load the audit log');
        this.cd.markForCheck();
      }
    });
  }

  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.filterForm.reset({ action: '', actor: '', entityType: '', entityId: '', collegeCode: '', from: '', to: '' });
    this.applyFilters();
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }
    this.page = page;
    this.load();
  }

  changePageSize(size: string): void {
    this.pageSize = Number(size);
    this.applyFilters();
  }

  // The API stores details as JSON text; show it readable, but never fail on odd content.
  prettyDetails(details?: string | null): string {
    if (!details) {
      return '';
    }
    try {
      return JSON.stringify(JSON.parse(details), null, 2);
    } catch {
      return details;
    }
  }

  toggle(id: number): void {
    this.expanded = this.expanded === id ? null : id;
  }
}
