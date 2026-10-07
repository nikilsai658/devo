import { TestBed } from '@angular/core/testing';

import { CourseTaskService } from './course-task-service';
import { testProviders } from '../../../../testing/test-providers';

describe('CourseTaskService', () => {
  let service: CourseTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(CourseTaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
