import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class FacultyCourseService {
  constructor(private api: Api) {}

  // The signed-in user's own assigned courses.
  getMyCourses() {
    return this.api.GET('FacultyCourse/my');
  }
  getUserCourses(userId: string) {
    return this.api.GET(`FacultyCourse/${userId}`);
  }
  // Replaces the user's whole assigned-course list.
  setUserCourses(userId: string, courseIds: number[]) {
    return this.api.PUT(`FacultyCourse/${userId}`, { courseIds });
  }
}
