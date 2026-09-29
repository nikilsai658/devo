import { Component, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import {ButtonModule} from 'primeng/button';
import { Logo } from '../../../shared/logo/logo';
import { FormBuilder, FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { FormGroup } from '@angular/forms';
import { Validators } from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CollegeService } from '../../services/college/college-service';
@Component({
  selector: 'app-college',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Logo,ButtonModule,FormsModule,SelectModule,ReactiveFormsModule],
  templateUrl: './college.html',
  styleUrls: ['./college.css', '../auth-responsive.css'],
})
export class College implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);

  form !:FormGroup;
   colleges: any[] | undefined;
    selectedcollege: any | undefined ;
  constructor(private fb:FormBuilder, private router:Router,private route:ActivatedRoute,private api:CollegeService) {
   this.form=this.fb.group({
    college:['',Validators.required]
   })
  }
    ngOnInit() {
        this.api.getcollege().subscribe({
          next: (res: any) => {
            this.cdr.markForCheck();

            if (Array.isArray(res)) {
              this.colleges = res;
            } else if (Array.isArray(res?.data)) {
              this.colleges = res.data;
            } else if (Array.isArray(res?.result)) {
              this.colleges = res.result;
            } else {
              this.colleges = [];
            }
          },
          error: (err) => {
            this.cdr.markForCheck();

            console.error(err);
            this.colleges = [];
          }
        });
    }
    onSubmit(){
      if(this.form.valid){
        localStorage.setItem('college',this.form.value.college.name);
         localStorage.setItem('collegecode',this.form.value.college.code);
          console.log(this.form.value);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        // Only follow in-app auth paths to avoid open redirects.
        if (returnUrl && returnUrl.startsWith('/auth/')) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.router.navigate(['auth/login']);
        }
      }
    }
}
