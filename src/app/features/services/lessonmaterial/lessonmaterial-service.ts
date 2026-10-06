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
  link(lessonId: number, learningMaterialId: number) {
    return this.api.POST('LessonMaterialMap', { lessonId, learningMaterialId });
  }
  unlink(id: number) {
    return this.api.DELETE(`LessonMaterialMap/${id}`);
  }
}
