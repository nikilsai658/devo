import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class Student {
  constructor(private api:Api){}
  getstudentdomain(){
    return this.api.GET('Student/domain');
  }
  getstudentcourse(domainId:number){
    return this.api.GET(`Student/domain/${domainId}/courses`);
  }
  getstudentcourseById(domainId:number,courseId:number){
    return this.api.GET(`Student/domain/${domainId}/course/${courseId}/assignments`);
  }
  getstudentassignmentId(assignmentId:number){
    return this.api.GET(`Student/assignment/${assignmentId}`)
  }
  runCode(sourceCode:string, languageId:number, stdin:string|null){
    return this.api.POST('Student/run', { sourceCode, languageId, stdin });
  }
  submitCode(assignmentId:number, sourceCode:string, languageId:number, stdin:string|null){
    return this.api.POST('Student/submit', { assignmentId, sourceCode, languageId, stdin });
  }
  getstudenttasks(domainId:number,courseId:number){
    return this.api.GET(`Student/domain/${domainId}/course/${courseId}/tasks`);
  }
  gettaskbyId(taskId:number){
    return this.api.GET(`Student/task/${taskId}`);
  }
  uploadtask(taskId:number,file:File){
   const formData = new FormData();
   formData.append('file', file);
   return this.api.POST(`Student/task/${taskId}/upload`, formData);
  }
  downloadtask(taskId:number){
    return this.api.GETBlob(`Student/task/${taskId}/download`);
  }
  // Sections, lessons and files of a course the student is enrolled in.
  getcoursecontent(domainId:number,courseId:number){
    return this.api.GET(`Student/domain/${domainId}/course/${courseId}/content`);
  }
  downloadmaterial(domainId:number,courseId:number,materialId:number){
    return this.api.GETBlob(`Student/domain/${domainId}/course/${courseId}/material/${materialId}/download`);
  }
  previewmaterial(domainId:number,courseId:number,materialId:number){
    return this.api.GETBlob(`Student/domain/${domainId}/course/${courseId}/material/${materialId}/preview`);
  }
}

