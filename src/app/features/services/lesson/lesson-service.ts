import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class LessonService {
  constructor(private api: Api) {}

  getLessons() {
    return this.api.GET('Lesson');
  }
  createLesson(data: any) {
    return this.api.POST('Lesson', data);
  }
  updateLesson(id: number, data: any) {
    return this.api.PUT(`Lesson/${id}`, data);
  }
  deleteLesson(id: number) {
    return this.api.DELETE(`Lesson/${id}`);
  }
}
