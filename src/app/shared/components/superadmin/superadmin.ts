import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Feedback } from '../../../shared/feedback/feedback';
@Component({
  selector: 'app-superadmin',
  imports: [CommonModule],
  templateUrl: './superadmin.html',
  styleUrl: './superadmin.css',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class SuperAdmin implements OnInit{

  feedback = new Feedback();

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
 
colleges:any[]=[];
loading=false;
search='';

get filteredColleges():any[]{
  const term=this.search.trim().toLowerCase();
  if(!term) return this.colleges;
  return this.colleges.filter(c=>
    (c.name || c.collegeName || '').toLowerCase().includes(term)
  );
}

initials(name?:string):string{
  const words=(name || 'C').trim().split(/\s+/);
  return words.slice(0,2).map(w=>w.charAt(0).toUpperCase()).join('');
}
constructor(private api:Superadmin,
  private cd:ChangeDetectorRef,
  private router:Router,
  @Inject(PLATFORM_ID) private platformId:Object
){}
 ngOnInit(): void {
   // Data needs the browser session (and router state); the server renders the empty page.
   if (!this.isBrowser) {
     return;
   }

   this.loadsuperadmincolleges();
 }
 loadsuperadmincolleges():void{
  this.loading=true;
  this.api.getsuperadmincolleges().subscribe({
    next:(res:any)=>{
      this.colleges= res?.data ??[];
      this.loading=false;
      this.cd.markForCheck()
    },
    error:(err)=>{
      this.feedback.fail(err, 'Unable to load colleges.');
      this.colleges=[];
      this.loading=false;
      this.cd.markForCheck();
    }
  });
 }
 View(collegeId:number,collegeName?:string):void{
  this.router.navigate(['/main/superadmin-domains'],
    {state:{collegeId,collegeName}}
  )
 }
}
