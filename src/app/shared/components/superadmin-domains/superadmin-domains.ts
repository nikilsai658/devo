import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { Feedback } from '../../../shared/feedback/feedback';

@Component({
  selector: 'app-superadmin-domains',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './superadmin-domains.html',
  styleUrl: './superadmin-domains.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SuperadminDomains implements OnInit {

  feedback = new Feedback();

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  domains: any[] = [];

  loading = false;

  search = '';

  // This is COLLEGE ID
  collegeId!: number;
  collegeName = '';

  get filteredDomains(): any[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.domains;
    return this.domains.filter(d =>
      (d.domainName || '').toLowerCase().includes(term)
    );
  }

  get totalStudents(): number {
    return this.domains.reduce((sum, d) => sum + (Number(d.totalStudents) || 0), 0);
  }

  // Share of the college's students enrolled in this domain (0-100)
  studentShare(domain: any): number {
    const total = this.totalStudents;
    return total ? Math.round(((Number(domain.totalStudents) || 0) / total) * 100) : 0;
  }

  initials(name?: string): string {
    const words = (name || 'D').trim().split(/\s+/);
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  backToColleges(): void {
    this.router.navigate(['/main/superadmin-colleges']);
  }

  constructor(
    private api: Superadmin,
    private router: Router,
    private cd: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: object
  ) {}

  ngOnInit(): void {
      // Data needs the browser session (and router state); the server renders the empty page.
      if (!this.isBrowser) {
        return;
      }

      // Get collegeId from router state
    this.collegeId = history.state?.collegeId;
    this.collegeName = history.state?.collegeName ?? '';

    // Opened without choosing a college first (bookmark, new tab).
    if (!this.collegeId) {
      this.router.navigate(['/main/superadmin-colleges']);
      return;
    }

    this.loadCollegeDomains();
  }

  loadCollegeDomains(): void {

    if (!this.collegeId) {
      return;
    }

    this.loading = true;

    this.api.getsuperadmincollege_domain(this.collegeId).subscribe({

      next: (res: any) => {


        if (res?.isFailure) {
          this.domains = [];
          this.loading = false;
          this.cd.markForCheck();
          return;
        }

        this.domains = res?.data ?? [];


        this.loading = false;

        // Required because OnPush
        this.cd.markForCheck();
      },

      error: (error) => {
        this.feedback.fail(error, 'Unable to load domains.');


        this.domains = [];
        this.loading = false;

        this.cd.markForCheck();
      }
    });
  }

  viewDomain(domain: any): void {


    this.router.navigate(
      ['/main/superadmin-domain-students'],
      {
        state: {
          domainId: domain.domainId,
          domainName: domain.domainName,
          collegeId:this.collegeId,
          collegeName: this.collegeName
        }
      }
    );
  }
}