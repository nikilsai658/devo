import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Student } from '../../../features/services/student/student';
import { Router } from '@angular/router';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';
import { Feedback } from '../../../shared/feedback/feedback';

@Component({
  selector: 'app-student-domain',
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  templateUrl: './student-domain.html',
  styleUrl: './student-domain.css',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class StudentDomain implements OnInit {

  feedback = new Feedback();

  domain: any[] = [];
  loading = false;

  breadcrumb: BreadcrumbItem[] = [{ label: 'My Domains' }];

  constructor(
    private api: Student,
    private cd: ChangeDetectorRef,
    private router:Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.loadstudentdomain();
  }

  loadstudentdomain(): void {

    this.loading = true;

    this.api.getstudentdomain().subscribe({

      next: (res: any) => {

        this.domain = res?.data ?? [];
        this.loading = false;
        this.cd.markForCheck();

      },

      error: (err) => {
        this.feedback.fail(err, 'Unable to load your domains.');

        this.domain = [];
        this.loading = false;

      }

    });

  }
  view(domainId: number, domainName?: string):void{
    this.router.navigate(['/main/student-courses'], 
      { state: { domainId, domainName } }
    );
  }
}