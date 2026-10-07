import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';
import { RunCodeRequest, SubmitCodeRequest } from '../../../shared/models/api-response.model';

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
    const body: RunCodeRequest = { sourceCode, languageId, stdin };
    return this.api.POST('Student/run', body);
  }
  // `proctoring` carries the tab-switch / fullscreen-exit counts of the attempt. The API must
  // store them (SubmitCodeDto: TabSwitchCount, FullscreenExitCount) for faculty to see them;
  // until it does, ASP.NET ignores the extra fields.
  submitCode(assignmentId:number, sourceCode:string, languageId:number, stdin:string|null,
             proctoring: { tabSwitchCount: number; fullscreenExitCount: number } = { tabSwitchCount: 0, fullscreenExitCount: 0 }){
    const body: SubmitCodeRequest = { assignmentId, sourceCode, languageId, stdin, ...proctoring };
    return this.api.POST('Student/submit', body);
  }
  getstudenttasks(domainId:number,courseId:number){
    return this.api.GET(`Student/domain/${domainId}/course/${courseId}/tasks`);
  }
  gettaskbyId(taskId:number){
    return this.api.GET(`Student/task/${taskId}`);
  }
  // Emits upload progress events, then the response.
  uploadtaskWithProgress(taskId:number,file:File){
   const formData = new FormData();
   formData.append('file', file);
   return this.api.POSTWithProgress(`Student/task/${taskId}/upload`, formData);
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

