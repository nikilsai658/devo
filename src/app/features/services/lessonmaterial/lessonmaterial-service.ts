import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

// Links a material to a lesson. Unlike the other two, this one uses IDs
// (the API calls the material id "learningMaterialId").
@Injectable({
  providedIn: 'root',
})
export class LessonMaterialService {
  constructor(private api: Api) {}

  getLinks() {
    return this.api.GET('LessonMaterialMap');
  }
  // This controller (unlike the other link controllers) reads a form, not JSON: a JSON body is
  // ignored and both ids arrive as 0 ("Lesson not found").
  link(lessonId: number, learningMaterialId: number) {
    const form = new FormData();
    form.append('LessonId', String(lessonId));
    form.append('LearningMaterialId', String(learningMaterialId));
    return this.api.POST('LessonMaterialMap', form);
  }
  unlink(id: number) {
    return this.api.DELETE(`LessonMaterialMap/${id}`);
  }
}
