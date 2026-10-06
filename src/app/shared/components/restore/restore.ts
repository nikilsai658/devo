import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Auth } from '../../../core/auth/auth';
import { RestoreService } from '../../../features/services/restore/restore-service';
import { Feedback } from '../../feedback/feedback';
import { ConfirmService } from '../confirm-dailog/confirm';

@Component({
  selector: 'app-restore',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  templateUrl: './restore.html',
  styleUrl: './restore.css',
})
export class Restore implements OnInit {

  private confirmDialog = inject(ConfirmService);

  kinds: string[] = [];
  kind = '';
  items: any[] = [];

  page = 1;
  pageSize = 25;
  totalCount = 0;
  totalPages = 0;
  loading = false;

  feedback = new Feedback();

  constructor(
    private api: RestoreService,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.auth.hasPermission('RESTORE_ENTITIES')) {
      return;
    }

    this.api.getKinds().subscribe({
      next: (res: any) => {
        this.kinds = Array.isArray(res?.data) ? res.data : [];
        if (this.kinds.length) {
          this.select(this.kinds[0]);
        }
        this.cd.markForCheck();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to load the record types');
        this.cd.markForCheck();
      }
    });
  }

  // "learning-section" -> "Learning section"
  label(kind: string): string {
    const text = kind.replace(/-/g, ' ');
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  select(kind: string): void {
    this.kind = kind;
    this.page = 1;
    this.load();
  }

  load(): void {
    if (!this.kind) {
      return;
    }

    this.loading = true;

    this.api.getDeleted(this.kind, this.page, this.pageSize).subscribe({
      next: (res: any) => {
        this.items = Array.isArray(res?.data) ? res.data : [];
        const info = res?.pagination;
        this.totalCount = info?.totalCount ?? this.items.length;
        this.totalPages = info?.totalPages ?? 1;
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.items = [];
        this.loading = false;
        this.feedback.fail(err, 'Failed to load deleted records');
        this.cd.markForCheck();
      }
    });
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.page) {
      return;
    }
    this.page = page;
    this.load();
  }

  async restore(item: any): Promise<void> {
    const ok = await this.confirmDialog.ask(
      `Restore "${item.label}"? It becomes visible again right away.`,
      { title: 'Restore record', confirmText: 'Restore', danger: false }
    );

    if (!ok) {
      return;
    }

    this.api.restore(this.kind, item.id).subscribe({
      next: (res: any) => {
        this.feedback.ok('Record restored', res);
        this.load();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to restore the record');
        this.cd.markForCheck();
      }
    });
  }
}
