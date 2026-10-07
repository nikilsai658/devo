import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class Superadmin {
  constructor(private api:Api){}
  getsuperadmincolleges(){
    return this.api.GET('SuperAdmin/colleges');
  }
  getsuperadmincollege_domain(collegeId:number){
    return this.api.GET(`SuperAdmin/college/${collegeId}/domains`)
  }
  getsuperadmincollege_domain_students(collegeId:number,domainId:number){
    return this.api.GET(`SuperAdmin/college/${collegeId}/domain/${domainId}/students`)
  }
  getsuperadmincollege_domain_student_assignments(collegeId:number,domainId:number,studentId:any){
    return this.api.GET(`SuperAdmin/college/${collegeId}/domain/${domainId}/student/${studentId}/assignments`)
  }
  getsuperadmincollege_domain_student_assignment_code(collegeId:number,domainId:number,studentId:any,assignmentId:any){
    return this.api.GET(`SuperAdmin/college/${collegeId}/domain/${domainId}/student/${studentId}/assignment/${assignmentId}/code`)
  }
  getsuperadmincollege_domain_student_tasks(collegeId:number,domainId:number,studentId:any){
    return this.api.GET(`SuperAdmin/college/${collegeId}/domain/${domainId}/student/${studentId}/tasks`)
  }
  downloadsuperadmincollege_domain_student_task(collegeId:number,domainId:number,studentId:any,taskId:any){
    return this.api.GETBlob(`SuperAdmin/college/${collegeId}/domain/${domainId}/student/${studentId}/task/${taskId}/download`)
  }
  collegelicense(collegeId:number,data:any){
    return this.api.POST(`SuperAdmin/college/${collegeId}/license`,data);
  }
  collegelock(collegeId:number,data:any){
    return this.api.POST(`SuperAdmin/college/${collegeId}/lock`,data);
  }
  collegeunlock(collegeId:number,data:any){
    return this.api.POST(`SuperAdmin/college/${collegeId}/unlock`,data);
  }
  studentlock(studentId:any,data:any){
    return this.api.POST(`SuperAdmin/student/${studentId}/lock`,data);
  }
  studentunlock(studentId:any,data:any){
    return this.api.POST(`SuperAdmin/student/${studentId}/unlock`,data);
  }
  lockedStudents(){
    return this.api.GET(`SuperAdmin/students/locked`);
  }
  collegelocked(){
    return this.api.GET(`SuperAdmin/colleges/locked`);
  } 
}
