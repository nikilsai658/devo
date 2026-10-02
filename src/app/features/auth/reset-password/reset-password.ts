import { CommonModule , isPlatformBrowser} from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Logo } from '../../../shared/logo/logo';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ActivatedRoute, Router } from '@angular/router';
import {AuthServices} from '../../services/auth/auth-services';
import { AppValidators, FieldError } from '../../../shared/validation';

@Component({
  selector: 'app-reset-password',
  imports: [ReactiveFormsModule,CommonModule,Logo,InputTextModule,ButtonModule,PasswordModule,FloatLabelModule,FieldError],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css', '../auth-responsive.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPassword implements OnInit {
  Form !: FormGroup;
  collegecode:any;
  message = '';
  loading = false;
  messageType: 'success' | 'error' = 'error';
  constructor(private router:Router,private auth:AuthServices , private fb:FormBuilder, private route:ActivatedRoute,private cd: ChangeDetectorRef,@Inject(PLATFORM_ID) private platformId: Object){
    this.Form=this.fb.group({
      newPassword:['',[AppValidators.required, AppValidators.strongPassword]],
      confirmPassword:['',AppValidators.required],
      CollegeCode:['',Validators.required]
    }, { validators: AppValidators.matchFields('newPassword', 'confirmPassword') })
  }
 
   userId!:string;
  token!:string;
  ngOnInit(): void {
     if (isPlatformBrowser(this.platformId)) {
      this.collegecode = localStorage.getItem('collegecode');

      if (this.collegecode) {
        this.Form.patchValue({ CollegeCode: this.collegecode });
      }
    }
    this.route.queryParams.subscribe(params=>
    {
      this.userId=params['userId'];
      this.token=params['token'];
    }
    )
  }
  onSubmit(){
   this.message = '';

   if(this.Form.valid){
    const body = {
      ...this.Form.value,
      userId: this.userId,
      token: this.token
    };
    this.loading = true;
    this.cd.markForCheck();

    this.auth.resetpassword(body).subscribe({
      next:()=>{
        this.loading = false;
        this.messageType = 'success';
        this.message = 'Password changed successfully';
        this.cd.markForCheck();

        this.router.navigate(['/auth/login']);
      },error:(err :any)=>{
        console.log(err);

        this.loading = false;
        this.messageType = 'error';
        this.message = 'Failed to reset password. Please try again.';
        this.cd.markForCheck();
      }
    })
   }else{
    this.Form.markAllAsTouched();

    this.messageType = 'error';
    this.message = 'Please correct the highlighted fields and try again.';
    this.cd.markForCheck();
   }
  }
}
