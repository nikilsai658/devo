import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Login } from './login/login';
import { ForgotPassword } from './forgot-password/forgot-password';
import { College } from './college/college';
import { ResetPassword } from './reset-password/reset-password';
import { collegeGuard } from '../../core/guards/college-guard';

const routes: Routes = [
  {
    path:'',redirectTo:'college',pathMatch:'full'
  },
   {
    path:'college',component:College
  },
  {
    path:'login',component:Login,canActivate:[collegeGuard]
  },
  {
    path:'forgot-password',component:ForgotPassword,canActivate:[collegeGuard]
  },

  {
   path:'reset-password', component:ResetPassword,canActivate:[collegeGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
