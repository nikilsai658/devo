import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
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
import { AppValidators, FieldError } from '../../../shared/validation';
import { readStorage } from '../../../core/storage';
import { extractErrorMessage, extractSuccessMessage } from '../../../shared/feedback/feedback';
@Component({
  selector: 'app-forgot-password',
  standalone:true,
  imports: [Logo,FloatLabelModule,FormsModule,InputTextModule,ButtonModule,PasswordModule,CommonModule,ReactiveFormsModule,RouterLink,FieldError],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css', '../auth-responsive.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPassword implements OnInit {

   private readonly destroyRef = inject(DestroyRef);

   Form !:FormGroup
   collegecode: string | null = null;
   message = '';
   loading = false;
   messageType: 'success' | 'error' = 'error';
    constructor(private auth:AuthServices,private fb:FormBuilder,private router:Router,private cd: ChangeDetectorRef,@Inject(PLATFORM_ID) private platformId: Object){
      this.Form=this.fb.group({
        email:['', [AppValidators.required, AppValidators.email]],
        collegeCode:['', Validators.required]
      })
    }
    ngOnInit(): void {
      if (isPlatformBrowser(this.platformId)) {
        this.collegecode = readStorage('collegecode');

        if (this.collegecode) {
          this.Form.patchValue({ collegeCode: this.collegecode });
        }
      }
    }
   OnSubmit():void{
    this.message = '';

    if (this.loading) {
      return;
    }

    if(this.Form.valid){
      this.loading = true;
      this.cd.markForCheck();

      this.auth.forgotpassword(this.Form.value).subscribe({
        next:(res:any)=>{
           this.loading = false;
           this.messageType = 'success';
           this.message = extractSuccessMessage(res) ?? 'If the email is registered, a reset link has been sent.';
           this.cd.markForCheck();

           // Long enough to read the message; cancelled if the user leaves first.
           const timer = setTimeout(() => {
             this.router.navigate(['/auth/login']);
           }, 3000);
           this.destroyRef.onDestroy(() => clearTimeout(timer));
        },error:(err:any)=>{
         this.loading = false;
         this.messageType = 'error';
         this.message = extractErrorMessage(err, 'Something went wrong. Please try again.');
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
