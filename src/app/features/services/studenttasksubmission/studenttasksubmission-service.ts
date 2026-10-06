import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class StudentTaskSubmissionService {
  constructor(private api: Api) {}

  getSubmissions(page: number, pageSize: number) {
    return this.api.GET('StudentTaskSubmission', { page, pageSize });
  }
  getSubmission(id: number) {
    return this.api.GET(`StudentTaskSubmission/${id}`);
  }
  download(id: number) {
    return this.api.GETBlob(`StudentTaskSubmission/${id}/download`);
  }
  deleteSubmission(id: number) {
    return this.api.DELETE(`StudentTaskSubmission/${id}`);
  }
}
