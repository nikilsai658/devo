import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class CourseAssignmentService {
  constructor(private api:Api){}
  getcourseassignment(){
   return this.api.GET('CourseAssignmentMap');
  }
  getcourseassignmentById(id:number){
   return this.api.GET(`CourseAssignmentMap/${id}`);
  }
  createcourseassignment(data:any){
    return this.api.POST('CourseAssignmentMap',data);
  }
  updatecourseassignment(id:number,data:any){
    return this.api.PUT(`CourseAssignmentMap/${id}`,data);
  }
  deletecourseassignment(id:any){
    return this.api.DELETE(`CourseAssignmentMap/${id}`);
  }
}
