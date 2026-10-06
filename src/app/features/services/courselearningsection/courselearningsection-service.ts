import { Injectable } from '@angular/core';
import { Api } from '../../../core/api/api';

// Links a learning section to a course. The API identifies both by NAME.
@Injectable({
  providedIn: 'root',
})
export class CourseLearningSectionService {
  constructor(private api: Api) {}

  getLinks(filter: { courseName?: string; learningSectionName?: string; isActive?: boolean } = {}) {
    return this.api.POST('CourseLearningSectionMap/filter', filter);
  }
  link(courseName: string, learningSectionName: string) {
    return this.api.POST('CourseLearningSectionMap', { courseName, learningSectionName });
  }
  unlink(id: number) {
    return this.api.DELETE(`CourseLearningSectionMap/${id}`);
  }
}
