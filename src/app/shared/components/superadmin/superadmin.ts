import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { Superadmin } from '../../../features/services/superadmin/superadmin';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-superadmin',
  imports: [CommonModule],
  templateUrl: './superadmin.html',
  styleUrl: './superadmin.css',
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class SuperAdmin implements OnInit{
 
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
    error:()=>{
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
