import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

// Links a lesson to a learning section. The API identifies both by NAME.
@Injectable({
  providedIn: 'root',
})
export class LearningSectionLessonService {
  constructor(private api: Api) {}

  getLinks() {
    return this.api.GET('LearningSectionLessonMap');
  }
  link(learningSectionName: string, lessonName: string) {
    return this.api.POST('LearningSectionLessonMap', { learningSectionName, lessonName });
  }
  unlink(id: number) {
    return this.api.DELETE(`LearningSectionLessonMap/${id}`);
  }
}
