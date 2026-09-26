import { Component, OnInit, effect } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Auth } from '../../../core/auth/auth';
import { UserStore } from '../../../core/store/user';
import { AuthServices } from '../../../features/services/auth/auth-services';
import { ThemeStore } from '../../../core/store/theme';
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink,RouterLinkActive,CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css'],
})
export class Header implements OnInit {
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
      this.userStore.clearUser();
    this.cookie.delete('token','/');
    this.cookie.delete('refresh','/');
    this.router.navigate(['/auth/login']);
      },
      error:(err:any)=>{
      console.log(err);
      }
    })
    
  }

  ngOnInit(): void {}
  sidebarOpen = false;

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  managementOpen = false;

  toggleManagement() {
    this.managementOpen = !this.managementOpen;
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
    ].some(permission => this.auth.hasPermission(permission));
  }

  mappingOpen = false;

  toggleMapping() {
    this.mappingOpen = !this.mappingOpen;
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
