import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Logo } from '../../../shared/logo/logo';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {PasswordModule} from 'primeng/password';
import {FormBuilder,Validators} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { AuthServices } from '../../services/auth/auth-services'
import { UserStore } from '../../../core/store/user';
import { setTokens } from '../../../core/auth/token-storage';
@Component({
  selector: 'app-login',
  standalone:true,
  imports: [Logo, FloatLabelModule, FormsModule, InputTextModule, ButtonModule, PasswordModule, ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css', '../auth-responsive.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login implements OnInit{
  Form !:FormGroup;
  collegecode:any;
  errorMessage = '';
  loading = false;
  showSuggestions = false;
  recentUsers: string[] = [];
   constructor(private fb: FormBuilder, private router:Router,private cookie:CookieService,private auth:AuthServices,private userStore:UserStore,private cd: ChangeDetectorRef,@Inject(PLATFORM_ID) private platformId: Object){
    this.Form=this.fb.group({
      userNameOrEmail: ['',Validators.required],
      password: ['',Validators.required],
      collegeCode: ['', Validators.required]
    });
    
   }
    ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.collegecode = localStorage.getItem('collegecode');

      if (this.collegecode) {
        this.Form.patchValue({ collegeCode: this.collegecode });
      }

      this.recentUsers = this.readRecentUsers();
    }
  }
     
   onSubmit(){
    this.errorMessage = '';

    if(this.Form.valid){
      this.loading = true;
      this.cd.markForCheck();

      this.auth.login(this.Form.value).subscribe({
        next:(res :any)=>{
          this.loading = false;
          this.rememberUser(this.Form.value.userNameOrEmail);

          const token=res.data.accessToken;
          const refresh=res.data.refreshToken;
         localStorage.setItem('user', JSON.stringify(res.data));
          this.userStore.setUser(res.data);
          setTokens(token, refresh);
         if(res.data.isFirstLogin=== true ){
          this.router.navigate(['/changepassword']);
         }else if(res.data.isFirstLogin=== false && res.data.profileCompleted=== false){
           this.router.navigate(['/profile']);
         }else{
         this.router.navigate(['/main']);
         }
        },error:(err)=>{
          console.log(err);

          this.loading = false;

          this.errorMessage = this.extractErrorMessage(err);

          this.cd.markForCheck();
        }
      })
    }else if(this.Form.controls['collegeCode'].invalid){
      this.router.navigate(['/auth/college'], { queryParams: { returnUrl: '/auth/login' } });
    }else{
      this.Form.markAllAsTouched();
      this.errorMessage = 'Please enter your username and password.';
      this.cd.markForCheck();
    }
   }

   get filteredUsers(): string[] {
    const typed = (this.Form.value.userNameOrEmail || '').trim().toLowerCase();

    return this.recentUsers.filter(u => u.toLowerCase().includes(typed) && u.toLowerCase() !== typed);
   }

   selectUser(user: string) {
    this.Form.patchValue({ userNameOrEmail: user });
    this.showSuggestions = false;
   }

   removeUser(user: string) {
    this.recentUsers = this.recentUsers.filter(u => u !== user);
    this.saveRecentUsers();
   }

   private rememberUser(user: string) {
    const name = (user || '').trim();

    if (!name) return;

    this.recentUsers = [name, ...this.recentUsers.filter(u => u !== name)].slice(0, 5);
    this.saveRecentUsers();
   }

   private readRecentUsers(): string[] {
    try {
      const list = JSON.parse(localStorage.getItem('recentUsers') || '[]');
      return Array.isArray(list) ? list.filter(u => typeof u === 'string') : [];
    } catch {
      return [];
    }
   }

   private saveRecentUsers() {
    localStorage.setItem('recentUsers', JSON.stringify(this.recentUsers));
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
      'Invalid username or password. Please try again.'
    );

   }
}