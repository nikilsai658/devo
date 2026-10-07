import { Routes } from '@angular/router';
import { collegeGuard } from '../../core/guards/college-guard';

export const AUTH_ROUTES: Routes = [
  {
    path: '', redirectTo: 'college', pathMatch: 'full'
  },
  {
    path: 'college', loadComponent: () => import('./college/college').then(m => m.College)
  },
  {
    path: 'login', loadComponent: () => import('./login/login').then(m => m.Login), canActivate: [collegeGuard]
  },
  {
    path: 'forgot-password', loadComponent: () => import('./forgot-password/forgot-password').then(m => m.ForgotPassword), canActivate: [collegeGuard]
  },
  {
    path: 'reset-password', loadComponent: () => import('./reset-password/reset-password').then(m => m.ResetPassword), canActivate: [collegeGuard]
  }
];
