import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Logo } from '../../../shared/logo/logo';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import {ButtonModule} from 'primeng/button';
import {PasswordModule} from 'primeng/password';
import {FormBuilder,Validators} from '@angular/forms';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthServices } from '../../services/auth/auth-services'
import { UserStore } from '../../../core/store/user';
import { setTokens } from '../../../core/auth/token-storage';
import { pendingOnboardingStep } from '../../../core/guards/onboarding-guard';
import { ToastService } from '../../../shared/toast/toast';
import { extractErrorMessage } from '../../../shared/feedback/feedback';
import { readStorage, removeStorage, writeStorage } from '../../../core/storage';

const RECENT_USERS_KEY = 'recentUsers';
const REMEMBER_KEY = 'rememberUsername';

// Only pages inside the app may be returned to after login (no open redirects).
export function safeReturnUrl(url: string | null | undefined): string | null {
  return url && /^\/main(\/[^/\\]|$|\?)/.test(url) && !url.startsWith('//') ? url : null;
}

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
  collegecode: string | null = null;
  errorMessage = '';
  loading = false;
  showSuggestions = false;
  // Usernames are only remembered when the user opts in: lab computers are shared.
  rememberMe = false;
  recentUsers: string[] = [];
   constructor(private fb: FormBuilder, private router:Router,private route:ActivatedRoute,private auth:AuthServices,private userStore:UserStore,private cd: ChangeDetectorRef,private toast: ToastService,@Inject(PLATFORM_ID) private platformId: Object){
    this.Form=this.fb.group({
      userNameOrEmail: ['',Validators.required],
      password: ['',Validators.required],
      collegeCode: ['', Validators.required]
    });

   }
    ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.collegecode = readStorage('collegecode');

      if (this.collegecode) {
        this.Form.patchValue({ collegeCode: this.collegecode });
      }

      this.rememberMe = readStorage(REMEMBER_KEY) === '1';
      this.recentUsers = this.rememberMe ? this.readRecentUsers() : [];

      // Lists saved before remembering became opt-in are dropped.
      if (!this.rememberMe) {
        removeStorage(RECENT_USERS_KEY);
      }
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

          // Tokens go to token storage only; the profile is stored without them.
          const { accessToken, refreshToken, ...profile } = res.data;
          setTokens(accessToken, refreshToken);
          this.userStore.setUser(profile);
          this.toast.success('Login successful');

          // First-login steps come first; otherwise back to the page that asked for a login.
          const returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
          this.router.navigateByUrl(pendingOnboardingStep() ?? returnUrl ?? '/main');
        },error:(err)=>{

          this.loading = false;

          const invalid = 'Invalid username or password. Please try again.';
          this.errorMessage = extractErrorMessage(err, invalid, { 401: invalid });

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

   // Turning it off also forgets every username saved on this device.
   setRememberMe(on: boolean) {
    this.rememberMe = on;
    if (on) {
      writeStorage(REMEMBER_KEY, '1');
    } else {
      removeStorage(REMEMBER_KEY);
      removeStorage(RECENT_USERS_KEY);
      this.recentUsers = [];
    }
    this.cd.markForCheck();
   }

   private rememberUser(user: string) {
    const name = (user || '').trim();

    if (!name || !this.rememberMe) return;

    this.recentUsers = [name, ...this.recentUsers.filter(u => u !== name)].slice(0, 5);
    this.saveRecentUsers();
   }

   private readRecentUsers(): string[] {
    try {
      const list = JSON.parse(readStorage(RECENT_USERS_KEY) || '[]');
      return Array.isArray(list) ? list.filter(u => typeof u === 'string') : [];
    } catch {
      return [];
    }
   }

   private saveRecentUsers() {
    writeStorage(RECENT_USERS_KEY, JSON.stringify(this.recentUsers));
   }
}
