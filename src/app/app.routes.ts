import { Routes } from '@angular/router';
import { Admin } from './features/admin/admin';
import { authGuard } from './core/auth/auth-guard';
import { onboardingGuard, onboardingStepGuard } from './core/guards/onboarding-guard';
import { assignmentGuard } from './core/guards/assignment-guard';
import { defaultChildRedirect, permissionGuard } from './core/guards/permission-guard';
// Order matters: the first route the user has permission for becomes their
// landing page after login (see defaultChildRedirect).
const mainChildren: Routes = [
      // Kept first: only superadmin holds this permission, and without it
      // superadmin would land on whichever college/student page came earlier.
      {
        path:'superadmin-colleges', loadComponent: () => import('./shared/components/superadmin/superadmin').then(m => m.SuperAdmin), data: { permission: 'VIEW_SUPERADMIN_COLLEGES' }
      },
      {
        // Old misspelled address, kept so bookmarks still work.
        path:'superamin-colleges', redirectTo: 'superadmin-colleges'
      },
      {
        path: 'student-domain', loadComponent: () => import('./shared/components/student-domain/student-domain').then(m => m.StudentDomain), data: { permission: 'VIEW_STUDENT_DOMAIN' }
      },

      {
        path: 'student-courses',loadComponent: () => import('./shared/components/student-courses/student-courses').then(m => m.StudentCourses),data: { permission: 'VIEW_STUDENT_COURSES' }
      },

      {
        path: 'student-assignments', loadComponent: () => import('./shared/components/student-assignments/student-assignments').then(m => m.StudentAssignments), data: { permission: 'VIEW_STUDENT_COURSES' }
      },

      {
        path: 'student-content', loadComponent: () => import('./shared/components/student-content/student-content').then(m => m.StudentContent), data: { permission: 'VIEW_STUDENT_COURSE_CONTENT' }
      },

      {
        path: 'student-task', loadComponent: () => import('./shared/components/student-task/student-task').then(m => m.StudentTask), data: { permission: 'VIEW_STUDENT_COURSES' }
      },

      {
        path: 'student-assignment', canActivate: [assignmentGuard], loadComponent: () => import('./shared/components/student-assignment/student-assignment').then(m => m.StudentAssignment), data: { permission: 'VIEW_STUDENT_COURSES' }
      },
      {
        path:'college-management',loadComponent: () => import('./shared/components/college/college').then(m => m.College), data: { permission: 'UPDATE_COLLEGE' }
      },
      {
        path:'department-management',loadComponent: () => import('./shared/components/department/department').then(m => m.Department), data: { permission: 'VIEW_DEPARTMENT' }
      },
      {
        path:'branch-management',loadComponent: () => import('./shared/components/branch/branch').then(m => m.Branch), data: { permission: 'VIEW_BRANCH' }
      },
      {
        path:'domain',loadComponent: () => import('./shared/components/domain/domain').then(m => m.DomainComponent), data: { permission: 'VIEW_DOMAIN' }
      },
      {
        path:'course',loadComponent: () => import('./shared/components/course/course').then(m => m.Course), data: { permission: 'VIEW_COURSE' }
      },
      {
        path:'assignment',loadComponent: () => import('./shared/components/assignment/assignment').then(m => m.AssignmentComponent), data: { permission: 'VIEW_ASSIGNMENT' }
      },
      {
        path:'task',loadComponent: () => import('./shared/components/task/task').then(m => m.Task), data: { permission: 'VIEW_TASK' }
      },
      {
        path:'year',loadComponent: () => import('./shared/components/year/year').then(m => m.Year), data: { permission: 'VIEW_YEAR' }
      },
      {
        path:'year-updation',loadComponent: () => import('./shared/components/year-updation/year-updation').then(m => m.YearUpdation), data: { permission: 'UPDATE_YEAR' }
      },
      {
        path:'user',loadComponent: () => import('./shared/components/user/user').then(m => m.UserComponent), data: { permission: 'VIEW_USER' }
      },
      {
        path:'role',loadComponent: () => import('./shared/components/role/role').then(m => m.Role), data: { permission: 'VIEW_ROLE' }
      },
      {
        path:'permission',loadComponent: () => import('./shared/components/permissions/permissions').then(m => m.Permission), data: { permission: 'VIEW_PERMISSION' }
      },
      {
        path:'profile',loadComponent: () => import('./shared/components/student-profile/student-profile').then(m => m.StudentProfile)
      },
      {
       path:'leadership',loadComponent: () => import('./shared/components/leadership/leadership').then(m => m.Leadership), data: { permission: 'LEADERBOARD_DOMAIN' }
      },
      {
        path:'ticket',loadComponent: () => import('./shared/components/ticket/ticket').then(m => m.TicketComponent), data: { permission: 'CREATE_TICKET' }
      },
      {
      path:'mytickets',loadComponent: () => import('./shared/components/mytickets/mytickets').then(m => m.MyTicketComponent),data:{permission:'VIEW_MY_TICKETS'}
      },
      {
        path:'replyticket/:id',loadComponent: () => import('./shared/components/replyticket/replyticket').then(m => m.ReplyTicketComponent),data:{permission:'REPLY_TICKET'}
      },
      {
        path:'alltickets',loadComponent: () => import('./shared/components/alltickets/alltickets').then(m => m.AllTicketsComponent), data: { permission: 'VIEW_ALL_TICKETS' }
      },
      {
        path: 'support-ticket-details/:id',loadComponent: () => import('./shared/components/support-ticket-details/support-ticket-details').then(m => m.SupportTicketDetailsComponent),data: { permission: 'VIEW_ALL_TICKETS' }
      },
      {
        path:'college-department-mapping',loadComponent: () => import('./shared/components/collegedepartment/collegedepartment').then(m => m.CollegeDepartmentComponent), data: { permission: 'VIEW_COLLEGE_DEPARTMENT' }
      },
      {
        path:'department-branch-mapping',loadComponent: () => import('./shared/components/departmentbranch/departmentbranch').then(m => m.DepartmentBranchComponent), data: { permission: 'VIEW_DEPARTMENT_BRANCH' }
      },
      {
        path:'course-task-mapping',loadComponent: () => import('./shared/components/course-task/course-task').then(m => m.CourseTask), data: { permission: 'VIEW_COURSE_TASK_MAP' }
      },
      {
        path:'domain-course-mapping',loadComponent: () => import('./shared/components/domaincourse/domaincourse').then(m => m.DomainCourseMapComponent), data: { permission: 'VIEW_DOMAIN_COURSE_MAP' }
      },
      {
        path:'course-assignment-mapping',loadComponent: () => import('./shared/components/courseassignment/courseassignment').then(m => m.CourseAssignmentMapComponent), data: { permission: 'VIEW_COURSE_ASSIGNMENT_MAP' }
      },
      {
        path:'student-domain-course-mapping',loadComponent: () => import('./shared/components/studentdomaincourse/studentdomaincourse').then(m => m.StudentDomainMapComponent), data: { permission: 'VIEW_STUDENT_DOMAIN_COURSE_MAP' }
      },
      {
        path:'role-permission-mapping',loadComponent: () => import('./shared/components/rolepermission/rolepermission').then(m => m.RolePermissionComponent), data: { permission: 'VIEW_ROLE_PERMISSION' }
      },
      {
        path:'student-assignment-scores',loadComponent: () => import('./shared/components/studentassignment/studentassignment').then(m => m.StudentAssignment), data: { permission: 'UPDATE_STUDENT_ASSIGNMENT' }
      },
      {
        path:'superadmin-domains', loadComponent: () => import('./shared/components/superadmin-domains/superadmin-domains').then(m => m.SuperadminDomains),data:{permission:'VIEW_SUPERADMIN_COLLEGE_DOMAINS'}
      },
      {
        path:'superadmin-domain-students', loadComponent: () => import('./shared/components/superadmin-domain-students/superadmin-domain-students').then(m => m.SuperadminDomainStudents),data:{permission:'VIEW_SUPERADMIN_DOMAIN_STUDENTS'}
      },
      {
        path:'superadmin-student-assignments',loadComponent: () => import('./shared/components/superadmin-student-assignments/superadmin-student-assignments').then(m => m.SuperadminStudentAssignments),data:{permission:'VIEW_SUPERADMIN_STUDENT_ASSIGNMENTS'}
      },
      {
        path:'superadmin-student-assignment-code',loadComponent: () => import('./shared/components/superadmin-student-assignment-code/superadmin-student-assignment-code').then(m => m.SuperadminStudentAssignmentCode),data:{permission:'VIEW_SUPERADMIN_STUDENT_ASSIGNMENTS'}
      },
      {
        path:'superadmin-student-tasks',loadComponent: () => import('./shared/components/superadmin-student-tasks/superadmin-student-tasks').then(m => m.SuperadminStudentTasks),data:{permission:'VIEW_SUPERADMIN_STUDENT_ASSIGNMENTS'}
      },
      {
        path:'audit-log',loadComponent: () => import('./shared/components/audit-log/audit-log').then(m => m.AuditLog), data: { permission: 'VIEW_AUDIT_LOG' }
      },
      {
        path:'admin-users',loadComponent: () => import('./shared/components/admin-users/admin-users').then(m => m.AdminUsers), data: { permission: 'VIEW_ADMIN_USERS' }
      },
      {
        path:'deployments',loadComponent: () => import('./shared/components/deployments/deployments').then(m => m.Deployments), data: { permission: 'VIEW_DEPLOYMENTS' }
      },
      {
        path:'monitoring',loadComponent: () => import('./shared/components/monitoring/monitoring').then(m => m.Monitoring), data: { permission: 'VIEW_MONITORING' }
      },
      {
        path:'restore',loadComponent: () => import('./shared/components/restore/restore').then(m => m.Restore), data: { permission: 'RESTORE_ENTITIES' }
      },
      {
        path:'faculty-courses',loadComponent: () => import('./shared/components/faculty-courses/faculty-courses').then(m => m.FacultyCourses), data: { permission: 'VIEW_FACULTY_COURSES' }
      },
      {
        // No permission: shown to anyone with assigned courses (the API returns only the caller's own).
        path:'my-courses',loadComponent: () => import('./shared/components/my-courses/my-courses').then(m => m.MyCourses)
      },
      {
        path:'course-content',loadComponent: () => import('./shared/components/course-content/course-content').then(m => m.CourseContent), data: { permission: 'VIEW_COURSE_LEARNING_SECTION_MAP' }
      },
      {
        path:'materials',loadComponent: () => import('./shared/components/materials/materials').then(m => m.Materials), data: { permission: 'VIEW_MATERIAL' }
      },
      {
        path:'task-submissions',loadComponent: () => import('./shared/components/task-submissions/task-submissions').then(m => m.TaskSubmissions), data: { permission: 'VIEW_STUDENT_TASK_SUBMISSION' }
      },
      {
        path:'change_password',loadComponent: () => import('./shared/components/change-password/change-password').then(m => m.ChangePassword)
      }
];

export const routes: Routes = [

  {
    path: '',redirectTo: 'home',pathMatch: 'full'
  },

  {
    path: 'home',loadComponent: () => import('./features/home/home').then(m => m.Home)
  },

  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'main',component: Admin,canActivate: [authGuard, onboardingGuard],canActivateChild: [authGuard, permissionGuard],children: [

      {
        path: '',redirectTo: defaultChildRedirect(mainChildren), pathMatch: 'full'
      },
      ...mainChildren
    ]
  },

  {
    path: 'changepassword', loadComponent: () => import('./features/changepassword/changepassword').then(m => m.Changepassword), canActivate: [authGuard, onboardingStepGuard('/changepassword')]
  },

  {
    path: 'profile', loadComponent: () => import('./features/profile-page/profile-page').then(m => m.ProfilePage), canActivate: [authGuard, onboardingStepGuard('/profile')]
  },
  {
    path: 'page-not-found', loadComponent: () => import('./shared/components/page-not-found/page-not-found').then(m => m.NotFoundComponent)
  },
  {
    path: '**',
    redirectTo: 'page-not-found'
  }
];
 