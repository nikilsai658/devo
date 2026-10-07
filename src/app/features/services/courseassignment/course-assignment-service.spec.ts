import { TestBed } from '@angular/core/testing';

import { CourseAssignmentService } from './course-assignment-service';
import { testProviders } from '../../../../testing/test-providers';

describe('CourseAssignmentService', () => {
  let service: CourseAssignmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(CourseAssignmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
