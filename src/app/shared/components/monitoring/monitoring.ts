import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Auth } from '../../../core/auth/auth';
import { MonitoringService } from '../../../features/services/monitoring/monitoring-service';
import { Feedback } from '../../feedback/feedback';

// Grafana links last one hour, so a page left open asks for a new one a little before that.
const REFRESH_EVERY_MS = 50 * 60 * 1000;

function httpsUrlOrEmpty(value: unknown): string {
  try {
    const url = new URL(String(value ?? ''));
    return url.protocol === 'https:' ? url.href : '';
  } catch {
    return '';
  }
}

@Component({
  selector: 'app-monitoring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monitoring.html',
  styleUrl: './monitoring.css',
})
export class Monitoring implements OnInit {

  private destroyRef = inject(DestroyRef);

  readonly ranges = [
    { value: 'now-1h', label: 'Last hour' },
    { value: 'now-6h', label: 'Last 6 hours' },
    { value: 'now-24h', label: 'Last 24 hours' },
    { value: 'now-7d', label: 'Last 7 days' },
    { value: 'now-30d', label: 'Last 30 days' }
  ];

  dashboards: { key: string; title: string; description: string }[] = [];
  dashboard = 'overview';
  college = '';
  from = 'now-6h';

  embedUrl = '';
  frameUrl: SafeResourceUrl | null = null;
  expiresAt: string | null = null;
  error = '';
  loading = false;

  uptimeTargets: { name: string; url: string }[] = [];
  showUptime = false;

  feedback = new Feedback();

  constructor(
    private api: MonitoringService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.auth.hasPermission('VIEW_MONITORING')) {
      return;
    }

    this.api.getDashboards().subscribe({
      next: (res: any) => {
        this.dashboards = (Array.isArray(res?.data) ? res.data : []).map((d: any) => ({
          key: d.key ?? d.Key,
          title: d.title ?? d.Title,
          description: d.description ?? d.Description
        }));
        this.cd.markForCheck();
      },
      // Optional: the default dashboard still loads; loadEmbed reports its own errors.
      error: () => {}
    });

    this.loadEmbed();

    const timer = setInterval(() => this.loadEmbed(), REFRESH_EVERY_MS);
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  // The college filter must look like a college code, otherwise the API rejects it.
  loadEmbed(): void {
    this.loading = true;
    this.error = '';

    this.api.getEmbed({
      dashboard: this.dashboard,
      college: this.college.trim(),
      from: this.from,
      theme: 'dark'
    }).subscribe({
      next: (res: any) => {
        const data = res?.data ?? {};
        // Only an https link is trusted as an iframe source (never javascript:, data:, ...).
        this.embedUrl = httpsUrlOrEmpty(data.url ?? data.Url);
        this.expiresAt = data.expiresAt ?? data.ExpiresAt ?? null;
        this.frameUrl = this.embedUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(this.embedUrl) : null;
        this.loading = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.frameUrl = null;
        this.embedUrl = '';
        this.loading = false;
        this.error = err?.error?.message ?? 'Monitoring is not available right now.';
        this.cd.markForCheck();
      }
    });
  }

  toggleUptime(): void {
    this.showUptime = !this.showUptime;
    if (this.showUptime && this.uptimeTargets.length === 0) {
      this.api.getUptimeTargets().subscribe({
        next: (res: any) => {
          this.uptimeTargets = (Array.isArray(res?.data) ? res.data : []).map((t: any) => ({
            name: t.name ?? t.Name,
            url: t.url ?? t.Url
          }));
          this.cd.markForCheck();
        },
        error: (err) => {
          this.feedback.fail(err, 'Failed to load the uptime addresses');
          this.cd.markForCheck();
        }
      });
    }
  }

  async copyUptime(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.uptimeTargets.map(t => t.url).join('\n'));
      this.feedback.ok('Addresses copied');
    } catch {
      this.feedback.fail(null, 'Could not copy. Select the text and copy it by hand.');
    }
  }
}
