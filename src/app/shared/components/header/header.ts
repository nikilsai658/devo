import { Component, OnInit, effect, ChangeDetectionStrategy, inject, ChangeDetectorRef, DestroyRef, ElementRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CookieService } from 'ngx-cookie-service';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/auth/auth';
import { UserStore } from '../../../core/store/user';
import { AuthServices } from '../../../features/services/auth/auth-services';
import { ThemeStore } from '../../../core/store/theme';
import { clearTokens } from '../../../core/auth/token-storage';
import { FacultyCourseService } from '../../../features/services/facultycourse/facultycourse-service';
@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink,RouterLinkActive,CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly facultyApi = inject(FacultyCourseService);

  // The "My Courses" link only appears for people who actually have courses assigned.
  hasAssignedCourses = false;
  private assignedCoursesChecked = false;

  username:string|undefined='';
  collegeLogo = '';
colleges = [
  {
    name: 'Jain University',
    logo: 'assets/images/jain-logo.png'
  },
  {
    name: 'HINDUSTHAN COLLEGE OF ENGINEERING',
    logo: 'assets/images/Hindusthan_college.png'
  },
  {
    name: 'RVS COLLEGE OF ENGINEERING',
    logo: 'assets/images/Rvs_college.png'
  },
  {
    name: 'CMS COLLEGE OF SCIENCE & COMMERCE',
    logo: 'assets/images/CMS_college.png'
  }
];

  constructor(private router:Router,private cookie:CookieService,public auth:Auth,private userStore:UserStore,private api:AuthServices,public themeStore:ThemeStore) {
    effect(() => {
      const user = this.userStore.user();

      if (!user) {
        return;
      }

      this.username = user.name;

      if (!this.assignedCoursesChecked && user.role !== 'SuperAdmin') {
        this.assignedCoursesChecked = true;
        this.facultyApi.getMyCourses().subscribe({
          next: (res: any) => {
            this.hasAssignedCourses = Array.isArray(res?.data) && res.data.length > 0;
            this.cdr.markForCheck();
          },
          error: () => {}
        });
      }

      const selectedCollege = this.colleges.find(college =>
        college.name.trim().toLowerCase() ===
        user.collegeName?.trim().toLowerCase()
      );

      if (selectedCollege) {
        this.collegeLogo = selectedCollege.logo;
      }
    });
  }
  logout(){
    this.api.logoutAll({}).subscribe({
      next:(res:any)=>{
      this.cdr.markForCheck();

      this.userStore.clearUser();
    clearTokens();
    this.router.navigate(['/auth/login']);
      },
      error:(err:any)=>{
      this.cdr.markForCheck();

      console.log(err);
      }
    })
    
  }

  ngOnInit(): void {
    // Close every menu once a navigation completes
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.closeMenus();
        this.cdr.markForCheck();
      });
  }

  /* Mobile nav panel (below 1100px the nav row collapses behind the menu button) */
  mobileNavOpen = false;

  toggleMobileNav() {
    this.mobileNavOpen = !this.mobileNavOpen;
    if (!this.mobileNavOpen) {
      this.openDropdown = null;
    }
  }

  /* Desktop dropdowns / mobile accordions */
  openDropdown: 'management' | 'mapping' | 'platform' | null = null;

  get managementOpen(): boolean {
    return this.openDropdown === 'management';
  }

  get mappingOpen(): boolean {
    return this.openDropdown === 'mapping';
  }

  get platformOpen(): boolean {
    return this.openDropdown === 'platform';
  }

  togglePlatform() {
    this.openDropdown = this.platformOpen ? null : 'platform';
  }

  toggleManagement() {
    this.openDropdown = this.managementOpen ? null : 'management';
  }

  closeMenus() {
    this.mobileNavOpen = false;
    this.openDropdown = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (this.openDropdown && !this.host.nativeElement.contains(event.target as Node)) {
      this.openDropdown = null;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMenus();
  }

  private readonly managementRoutes = [
    '/main/college-management',
    '/main/department-management',
    '/main/branch-management',
    '/main/domain',
    '/main/task',
    '/main/course',
    '/main/user',
    '/main/role',
    '/main/permission',
    '/main/year',
    '/main/year-updation',
    '/main/assignment',
    '/main/restore',
    '/main/faculty-courses',
  ];

  private readonly mappingRoutes = [
    '/main/college-department-mapping',
    '/main/department-branch-mapping',
    '/main/domain-course-mapping',
    '/main/course-task-mapping',
    '/main/course-assignment-mapping',
    '/main/student-domain-course-mapping',
    '/main/role-permission-mapping',
  ];

  private readonly platformRoutes = [
    '/main/admin-users',
    '/main/deployments',
    '/main/monitoring',
    '/main/audit-log',
  ];

  private isUnder(routes: string[]): boolean {
    const url = this.router.url.split(/[?#]/)[0];
    return routes.some(route => url === route || url.startsWith(route + '/'));
  }

  isManagementActive(): boolean {
    return this.isUnder(this.managementRoutes);
  }

  isPlatformActive(): boolean {
    return this.isUnder(this.platformRoutes);
  }

  hasAnyPlatformPermission(): boolean {
    return [
      'VIEW_ADMIN_USERS',
      'VIEW_DEPLOYMENTS',
      'VIEW_MONITORING',
      'VIEW_AUDIT_LOG',
    ].some(permission => this.auth.hasPermission(permission));
  }

  isMappingActive(): boolean {
    return this.isUnder(this.mappingRoutes);
  }

  hasAnyManagementPermission(): boolean {
    return [
      'UPDATE_COLLEGE',
      'VIEW_DEPARTMENT',
      'VIEW_BRANCH',
      'VIEW_DOMAIN',
      'VIEW_COURSE',
      'VIEW_USER',
      'VIEW_ROLE',
      'VIEW_PERMISSION',
      'VIEW_YEAR',
      'UPDATE_YEAR',
      'VIEW_ASSIGNMENT',
      'RESTORE_ENTITIES',
      'VIEW_FACULTY_COURSES',
    ].some(permission => this.auth.hasPermission(permission));
  }

  toggleMapping() {
    this.openDropdown = this.mappingOpen ? null : 'mapping';
  }

  hasAnyMappingPermission(): boolean {
    return [
      'VIEW_COLLEGE_DEPARTMENT',
      'VIEW_DEPARTMENT_BRANCH',
      'VIEW_DOMAIN_COURSE_MAP',
      'VIEW_COURSE_TASK_MAP',
      'VIEW_COURSE_ASSIGNMENT_MAP',
      'VIEW_STUDENT_DOMAIN_COURSE_MAP',
      'VIEW_ROLE_PERMISSION',
    ].some(permission => this.auth.hasPermission(permission));
  }
}
