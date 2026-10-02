import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { PasswordModule } from 'primeng/password';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthServices } from '../services/auth/auth-services';
import { Logo } from '../../shared/logo/logo';
import { AppValidators, FieldError } from '../../shared/validation';
@Component({
  selector: 'app-changepassword',
  standalone:true,
  imports: [CommonModule,ReactiveFormsModule,FloatLabelModule,ButtonModule,PasswordModule,Logo,FieldError],
  templateUrl: './changepassword.html',
  styleUrl: './changepassword.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Changepassword {
  Form !:FormGroup;
  errorMessage = '';
  loading = false;
  constructor(private router:Router,private api:AuthServices, private fb:FormBuilder,private cookie:CookieService,private cd:ChangeDetectorRef){
    this.Form=this.fb.group({
      oldPassword:['',AppValidators.required],
      newPassword:['',[AppValidators.required, AppValidators.strongPassword]],
      confirmPassword:['',AppValidators.required]
    }, {
      validators: [
        AppValidators.differentFrom('oldPassword', 'newPassword'),
        AppValidators.matchFields('newPassword', 'confirmPassword')
      ]
    })
  }

  onSubmit(){
      this.errorMessage = '';

      if(this.Form.valid){
        this.loading = true;
        this.cd.markForCheck();

        this.api.changepassword(this.Form.value).subscribe({
          next:(res)=>{
            this.loading = false;
            alert('sucessfully changed password');
            this.router.navigate(['/profile']);
          },
          error: (err) => {
            console.log('Error:', err);
            this.loading = false;
            this.errorMessage = this.extractErrorMessage(err);
            this.cd.markForCheck();
          }
        }
        )
      }else{
        this.Form.markAllAsTouched();
        this.errorMessage = 'Please correct the highlighted fields and try again.';
        this.cd.markForCheck();
      }
  }

  private extractErrorMessage(err: any): string {
    const body = err?.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    return (
      body?.message ||
      body?.title ||
      body?.error ||
      body?.errorMessage ||
      'Unable to change password. Please try again.'
    );
  }
}
