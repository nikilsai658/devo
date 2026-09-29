import { ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Student } from '../../../features/services/student/student';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb/breadcrumb';

@Component({
  selector: 'app-student-assignments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, Breadcrumb],
  templateUrl: './student-assignments.html',
  styleUrl: './student-assignments.css'
})
export class StudentAssignments implements OnInit {

  domainId!: number;
  courseId!: number;
  domainName = '';
  courseName = '';

  get breadcrumb(): BreadcrumbItem[] {
    return [
      { label: 'My Domains', link: '/main/student-domain' },
      { label: this.domainName || 'My Courses', link: '/main/student-courses',
        state: { domainId: this.domainId, domainName: this.domainName } },
      { label: this.courseName || 'Assignments' }
    ];
  }
  assignments:any[]=[];
  tasks:any[]=[];
  loading = true;

  // Tasks are only shown when the course has no assignments.
  get showTasks(): boolean {
    return this.assignments.length === 0 && this.tasks.length > 0;
  }

  // Assignment wording is only used once assignments have actually loaded.
  get showAssignments(): boolean {
    return !this.loading && this.assignments.length > 0;
  }

  constructor(private route: ActivatedRoute,private api:Student,private cd:ChangeDetectorRef, private router:Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.domainId = history.state.domainId;
      this.courseId = history.state.courseId;
      this.domainName = history.state.domainName ?? '';
      this.courseName = history.state.courseName ?? '';
      this.loadAssignments();
    }
  }
  loadAssignments():void{
   this.api.getstudentcourseById(this.domainId, this.courseId).subscribe({
    next:(res:any)=>{
      this.cd.markForCheck();

      console.log(res.data)
        this.assignments=Array.isArray(res?.data)?res.data:[];
        if (this.assignments.length === 0) {
          this.loadTasks();
          return;
        }
        this.loading=false;
        this.cd.detectChanges();
    },error:(err:any)=>{
       this.cd.markForCheck();

       this.assignments = [];
       console.log(err);
       this.loadTasks();
    }
   })
  }

  openTask(task: any): void {
    // The list item's id field name isn't fixed, so try the likely ones.
    const taskId = task?.id ?? task?.studentTaskId ?? task?.taskId;
    if (taskId == null) {
      console.error('Task has no id field, item received:', task);
      return;
    }
    this.router.navigate(['/main/student-task'], {
      state: { taskId, domainId: this.domainId, courseId: this.courseId, domainName: this.domainName, courseName: this.courseName }
    });
  }

  // Only reached when the course has no assignments; tasks are shown instead.
  loadTasks():void{
    this.api.getstudenttasks(this.domainId, this.courseId).subscribe({
      next:(res:any)=>{
        this.cd.markForCheck();

        this.tasks=Array.isArray(res?.data)?res.data:[];
        this.loading=false;
        this.cd.detectChanges();
      },error:()=>{
        this.cd.markForCheck();

        this.tasks=[];
        this.loading=false;
        this.cd.detectChanges();
      }
    })
  }
  startAssignment(id: number): void {
  const assignmentIds = this.assignments.map(a => a.assignmentId);

  // Marks entry as coming from a real "Start" click, so assignmentGuard
  // allows the student-assignment route and the lock/fullscreen can engage.
  sessionStorage.setItem('activeAssignmentId', id.toString());

  document.documentElement.requestFullscreen?.().catch(() => {
  this.cd.markForCheck();
});

  this.router.navigate(
    ['/main/student-assignment'],
    {
      state: {
        Id: id,
        assignmentIds: assignmentIds,
        domainId: this.domainId,
        domainName: this.domainName,
        courseId: this.courseId,
        courseName: this.courseName
      }
    }
  );
}


















































  
}