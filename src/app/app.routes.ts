import { Routes } from '@angular/router';
import { Dashboard } from '../app/features/dashboard/dashboard';
import { Home } from './features/home/home';
import { Admin } from './features/admin/admin';
import { Changepassword } from './features/changepassword/changepassword';
import { ProfilePage } from './features/profile-page/profile-page';
import { StudentDomain } from './shared/components/student-domain/student-domain';
import { StudentCourses } from './shared/components/student-courses/student-courses';
import { StudentAssignments } from './shared/components/student-assignments/student-assignments';
import { StudentAssignment } from './shared/components/student-assignment/student-assignment';
import { StudentTask } from './shared/components/student-task/student-task';
import { Department } from './shared/components/department/department';
import { Branch } from './shared/components/branch/branch';
import { DomainComponent } from './shared/components/domain/domain';
import { Course } from './shared/components/course/course';
import { Year } from './shared/components/year/year';
import { UserComponent } from './shared/components/user/user';
import { Permission } from './shared/components/permissions/permissions';
import { AssignmentComponent } from './shared/components/assignment/assignment';
import {  StudentProfile } from './shared/components/student-profile/student-profile';
import { College } from './shared/components/college/college';
import { Leadership } from './shared/components/leadership/leadership';
import { Role } from './shared/components/role/role';
import { TicketComponent } from './shared/components/ticket/ticket';
import { MyTicketComponent } from './shared/components/mytickets/mytickets';
import { ReplyTicketComponent } from './shared/components/replyticket/replyticket';
import { AllTicketsComponent } from './shared/components/alltickets/alltickets';
import { SupportTicketDetailsComponent } from './shared/components/support-ticket-details/support-ticket-details';
import { CollegeDepartmentComponent } from './shared/components/collegedepartment/collegedepartment';
import { DepartmentBranchComponent } from './shared/components/departmentbranch/departmentbranch';
import { CourseTask } from './shared/components/course-task/course-task';
import { DomainCourseMapComponent } from './shared/components/domaincourse/domaincourse';
import { CourseAssignmentMapComponent } from './shared/components/courseassignment/courseassignment';
import { RolePermissionComponent } from './shared/components/rolepermission/rolepermission';
import { StudentAssignment as StudentAssignmentscore } from './shared/components/studentassignment/studentassignment';
import { StudentDomainMapComponent } from './shared/components/studentdomaincourse/studentdomaincourse';
import { SuperAdmin } from './shared/components/superadmin/superadmin';
import { SuperadminDomains } from './shared/components/superadmin-domains/superadmin-domains';
import { SuperadminDomainStudents } from './shared/components/superadmin-domain-students/superadmin-domain-students';
import { SuperadminStudentAssignments } from './shared/components/superadmin-student-assignments/superadmin-student-assignments';
import { SuperadminStudentAssignmentCode } from './shared/components/superadmin-student-assignment-code/superadmin-student-assignment-code';
import { SuperadminStudentTasks } from './shared/components/superadmin-student-tasks/superadmin-student-tasks';
import { YearUpdation } from './shared/components/year-updation/year-updation';
import { AuditLog } from './shared/components/audit-log/audit-log';
import { AdminUsers } from './shared/components/admin-users/admin-users';
import { Deployments } from './shared/components/deployments/deployments';
import { Monitoring } from './shared/components/monitoring/monitoring';
import { authGuard } from './core/auth/auth-guard';
import { assignmentGuard } from './core/guards/assignment-guard';
import { defaultChildRedirect, permissionGuard } from './core/guards/permission-guard';
import { NotFoundComponent } from './shared/components/page-not-found/page-not-found';
import { ChangePassword } from './shared/components/change-password/change-password';
import { Task } from './shared/components/task/task';
// Order matters: the first route the user has permission for becomes their
// landing page after login (see defaultChildRedirect).
const mainChildren: Routes = [
      // Kept first: only superadmin holds this permission, and without it
      // superadmin would land on whichever college/student page came earlier.
      {
        path:'superamin-colleges', component:SuperAdmin, data: { permission: 'VIEW_SUPERADMIN_COLLEGES' }
      },
      {
        path: 'student-domain', component: StudentDomain, data: { permission: 'VIEW_STUDENT_DOMAIN' }
      },

      {
        path: 'student-courses',component: StudentCourses,data: { permission: 'VIEW_STUDENT_COURSES' }
      },

      {
        path: 'student-assignments', component: StudentAssignments
      },

      {
        path: 'student-task', component: StudentTask, 
      },

      {
        path: 'student-assignment', canActivate: [authGuard, assignmentGuard],  component: StudentAssignment
      },
      {
        path:'college-management',component:College, data: { permission: 'UPDATE_COLLEGE' }
      },
      {
        path:'department-management',component:Department, data: { permission: 'VIEW_DEPARTMENT' }
      },
      {
        path:'branch-management',component:Branch, data: { permission: 'VIEW_BRANCH' }
      },
      {
        path:'domain',component:DomainComponent, data: { permission: 'VIEW_DOMAIN' }
      },
      {
        path:'course',component:Course, data: { permission: 'VIEW_COURSE' }
      },
      {
        path:'assignment',component:AssignmentComponent, data: { permission: 'VIEW_ASSIGNMENT' }
      },
      {
        path:'task',component:Task, data: { permission: 'VIEW_TASK' }
      },
      {
        path:'year',component:Year, data: { permission: 'VIEW_YEAR' }
      },
      {
        path:'year-updation',component:YearUpdation, data: { permission: 'UPDATE_YEAR' }
      },
      {
        path:'user',component:UserComponent, data: { permission: 'VIEW_COURSE' }
      },
      {
        path:'role',component:Role, data: { permission: 'VIEW_ROLE' }
      },
      {
        path:'permission',component:Permission, data: { permission: 'VIEW_PERMISSION' }
      },
      {
        path:'profile',component:StudentProfile
      },
      {
       path:'leadership',component:Leadership, data: { permission: 'VIEW_STUDENT_DOMAIN' }
      },
      {
        path:'ticket',component:TicketComponent, data: { permission: 'CREATE_TICKET' }
      },
      {
      path:'mytickets',component:MyTicketComponent,data:{permission:'VIEW_MY_TICKETS'}
      },
      {
        path:'replyticket/:id',component:ReplyTicketComponent,data:{permission:'REPLY_TICKET'}
      },
      {
        path:'alltickets',component:AllTicketsComponent, data: { permission: 'VIEW_ALL_TICKETS' }
      },
      {
        path: 'support-ticket-details/:id',component: SupportTicketDetailsComponent,data: { permission: 'VIEW_ALL_TICKETS' }
      },
      {
        path:'college-department-mapping',component:CollegeDepartmentComponent, data: { permission: 'VIEW_COLLEGE_DEPARTMENT' }
      },
      {
        path:'department-branch-mapping',component:DepartmentBranchComponent, data: { permission: 'VIEW_DEPARTMENT_BRANCH' }
      },
      {
        path:'course-task-mapping',component:CourseTask, data: { permission: 'VIEW_COURSE_TASK_MAP' }
      },
      {
        path:'domain-course-mapping',component:DomainCourseMapComponent, data: { permission: 'VIEW_DOMAIN_COURSE_MAP' }
      },
      {
        path:'course-assignment-mapping',component:CourseAssignmentMapComponent, data: { permission: 'VIEW_COURSE_ASSIGNMENT_MAP' }
      },
      {
        path:'student-domain-course-mapping',component:StudentDomainMapComponent, data: { permission: 'VIEW_STUDENT_DOMAIN_COURSE_MAP' }
      },
      {
        path:'role-permission-mapping',component:RolePermissionComponent, data: { permission: 'VIEW_ROLE_PERMISSION' }
      },
      {
        path:'student-assignment-scores',component:StudentAssignmentscore, data: { permission: 'UPDATE_STUDENT_ASSIGNMENT' }
      },
      {
        path:'superadmin-domains', component:SuperadminDomains,data:{permission:'VIEW_SUPERADMIN_COLLEGE_DOMAINS'}
      },
      {
        path:'superadmin-domain-students', component:SuperadminDomainStudents,data:{permission:'VIEW_SUPERADMIN_DOMAIN_STUDENTS'}
      },
      {
        path:'superadmin-student-assignments',component:SuperadminStudentAssignments,data:{permission:'VIEW_SUPERADMIN_STUDENT_ASSIGNMENTS'}
      },
      {
        path:'superadmin-student-assignment-code',component:SuperadminStudentAssignmentCode,data:{permission:'VIEW_SUPERADMIN_STUDENT_ASSIGNMENTS'}
      },
      {
        path:'superadmin-student-tasks',component:SuperadminStudentTasks,data:{permission:'VIEW_SUPERADMIN_STUDENT_ASSIGNMENTS'}
      },
      {
        path:'audit-log',component:AuditLog, data: { permission: 'VIEW_AUDIT_LOG' }
      },
      {
        path:'admin-users',component:AdminUsers, data: { permission: 'VIEW_ADMIN_USERS' }
      },
      {
        path:'deployments',component:Deployments, data: { permission: 'VIEW_DEPLOYMENTS' }
      },
      {
        path:'monitoring',component:Monitoring, data: { permission: 'VIEW_MONITORING' }
      },
      {
        path:'change_password',component:ChangePassword
      }
];

export const routes: Routes = [

  {
    path: '',redirectTo: 'home',pathMatch: 'full'
  },

  {
    path: 'home',component: Home
  },

  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth-module')
        .then(m => m.AuthModule)
  },
  {
    path: 'main',component: Admin,canActivate: [authGuard],canActivateChild: [authGuard, permissionGuard],children: [

      {
        path: '',redirectTo: defaultChildRedirect(mainChildren), pathMatch: 'full'
      },
      ...mainChildren
    ]
  },

  {
    path: 'changepassword', component: Changepassword
  },

  {
    path: 'profile', component: ProfilePage
  },
  {
    path: 'page-not-found', component: NotFoundComponent
  },
  {
    path: '**',
    redirectTo: 'page-not-found'
  }
];
 