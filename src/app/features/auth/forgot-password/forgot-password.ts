import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Logo } from '../../../shared/logo/logo';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {PasswordModule} from 'primeng/password';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { AuthServices } from '../../services/auth/auth-services';
@Component({
  selector: 'app-forgot-password',
  standalone:true,
  imports: [Logo,FloatLabelModule,FormsModule,InputTextModule,ButtonModule,PasswordModule,CommonModule,ReactiveFormsModule,RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css', '../auth-responsive.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPassword implements OnInit {

   Form !:FormGroup
   collegecode:any;
   message = '';
   messageType: 'success' | 'error' = 'error';
    constructor(private auth:AuthServices,private fb:FormBuilder,private router:Router,private cd: ChangeDetectorRef,@Inject(PLATFORM_ID) private platformId: Object){
      this.Form=this.fb.group({
        email:['', Validators.required],
        collegeCode:['', Validators.required]
      })
    }
    ngOnInit(): void {
      if (isPlatformBrowser(this.platformId)) {
        this.collegecode = localStorage.getItem('collegecode');

        if (this.collegecode) {
          this.Form.patchValue({ collegeCode: this.collegecode });
        }
      }
    }
   OnSubmit():void{
    this.message = '';

    if(this.Form.valid){
      this.auth.forgotpassword(this.Form.value).subscribe({
        next:(res:any)=>{
           this.messageType = 'success';
           this.message = this.extractMessage(res) || 'Request completed successfully';
           this.cd.markForCheck();

           setTimeout(() => {
             this.router.navigate(['/auth/login']);
           }, 2000);
        },error:(err:any)=>{
         console.log(err);

         this.messageType = 'error';
         this.message = this.extractMessage(err?.error) || 'Something went wrong. Please try again.';
         this.cd.markForCheck();
        }
      })
    }else{
      this.Form.markAllAsTouched();

      this.messageType = 'error';
      this.message = 'Please fill the form';
      this.cd.markForCheck();
    }
   }

   private extractMessage(body: any): string {

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    return (
      body?.message ||
      body?.title ||
      body?.error ||
      body?.errorMessage ||
      ''
    );

   }
}
