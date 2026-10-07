import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class Studentassignment {
  constructor(private api: Api) {}

  getstudentassignment() {
    return this.api.GET('StudentAssignment');
  }

  getstudentassignmentById(id: any) {
    return this.api.GET(`StudentAssignment/${id}`);
  }

  updatestudentassignment(id: number, data: any) {
    return this.api.PUT(`StudentAssignment/${id}`, data);
  }

  deletestudentassignment(id: number) {
    return this.api.DELETE(`StudentAssignment/${id}`);
  }
}