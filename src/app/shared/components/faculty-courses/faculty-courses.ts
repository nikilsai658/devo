import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Auth } from '../../../core/auth/auth';
import { CourseService } from '../../../features/services/course/course-service';
import { FacultyCourseService } from '../../../features/services/facultycourse/facultycourse-service';
import { RoleService } from '../../../features/services/role/role-service';
import { UserService } from '../../../features/services/user/user-service';
import { Feedback } from '../../feedback/feedback';

@Component({
  selector: 'app-faculty-courses',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faculty-courses.html',
  styleUrl: './faculty-courses.css',
})
export class FacultyCourses implements OnInit {

  users: any[] = [];
  courses: any[] = [];
  restrictedRoles = new Set<string>();

  userSearch = '';
  courseSearch = '';
  onlyRestrictedRoles = true;

  selectedUser: any = null;
  selectedCourseIds = new Set<number>();
  loadingCourses = false;
  saving = false;
  dirty = false;

  feedback = new Feedback();

  constructor(
    private userApi: UserService,
    private roleApi: RoleService,
    private courseApi: CourseService,
    private api: FacultyCourseService,
    private cd: ChangeDetectorRef,
    public auth: Auth,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId) || !this.auth.hasPermission('VIEW_FACULTY_COURSES')) {
      return;
    }

    const list = (res: any) => (Array.isArray(res?.data) ? res.data : []);

    forkJoin({
      users: this.userApi.getUsers(),
      roles: this.roleApi.getRoles(),
      courses: this.courseApi.getCourses()
    }).subscribe({
      next: ({ users, roles, courses }) => {
        this.users = list(users);
        this.courses = list(courses);
        this.restrictedRoles = new Set(
          list(roles).filter((r: any) => r.restrictToAssignedCourses).map((r: any) => r.name)
        );
        // With no role marked "own courses only", showing only those would show nobody.
        this.onlyRestrictedRoles = this.restrictedRoles.size > 0;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.feedback.fail(err, 'Failed to load users and courses');
        this.cd.markForCheck();
      }
    });
  }

  get canManage(): boolean {
    return this.auth.hasPermission('MANAGE_FACULTY_COURSES');
  }

  get visibleUsers(): any[] {
    const text = this.userSearch.trim().toLowerCase();
    return this.users.filter(u =>
      (!this.onlyRestrictedRoles || this.restrictedRoles.has(u.roleName)) &&
      (!text || `${u.fullName} ${u.email}`.toLowerCase().includes(text)));
  }

  get visibleCourses(): any[] {
    const text = this.courseSearch.trim().toLowerCase();
    return this.courses.filter(c => !text || `${c.name}`.toLowerCase().includes(text));
  }

  selectUser(user: any): void {
    this.selectedUser = user;
    this.selectedCourseIds = new Set<number>();
    this.dirty = false;
    this.loadingCourses = true;

    this.api.getUserCourses(user.id).subscribe({
      next: (res: any) => {
        const assigned = Array.isArray(res?.data) ? res.data : [];
        this.selectedCourseIds = new Set<number>(assigned.map((a: any) => a.courseId));
        this.loadingCourses = false;
        this.cd.markForCheck();
      },
      error: (err) => {
        this.loadingCourses = false;
        this.feedback.fail(err, 'Failed to load the assigned courses');
        this.cd.markForCheck();
      }
    });
  }

  toggleCourse(id: number): void {
    if (!this.canManage) {
      return;
    }
    if (this.selectedCourseIds.has(id)) {
      this.selectedCourseIds.delete(id);
    } else {
      this.selectedCourseIds.add(id);
    }
    this.dirty = true;
  }

  selectAllVisible(): void {
    this.visibleCourses.forEach(c => this.selectedCourseIds.add(c.id));
    this.dirty = true;
  }

  clearAll(): void {
    this.selectedCourseIds.clear();
    this.dirty = true;
  }

  save(): void {
    if (!this.selectedUser) {
      return;
    }

    this.saving = true;

    this.api.setUserCourses(this.selectedUser.id, [...this.selectedCourseIds]).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.dirty = false;
        this.feedback.ok('Courses saved', res);
        this.cd.markForCheck();
      },
      error: (err) => {
        this.saving = false;
        this.feedback.fail(err, 'Failed to save the courses');
        this.cd.markForCheck();
      }
    });
  }
}
