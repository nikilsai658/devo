import { TestBed } from '@angular/core/testing';

import { CourseService } from './course-service';
import { testProviders } from '../../../../testing/test-providers';

describe('CourseService', () => {
  let service: CourseService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(CourseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
