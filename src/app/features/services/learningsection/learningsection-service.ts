import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

@Injectable({
  providedIn: 'root',
})
export class LearningSectionService {
  constructor(private api: Api) {}

  getSections() {
    return this.api.GET('LearningSection');
  }
  createSection(data: any) {
    return this.api.POST('LearningSection', data);
  }
  updateSection(id: number, data: any) {
    return this.api.PUT(`LearningSection/${id}`, data);
  }
  deleteSection(id: number) {
    return this.api.DELETE(`LearningSection/${id}`);
  }
}
