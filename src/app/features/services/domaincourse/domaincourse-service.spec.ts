import { TestBed } from '@angular/core/testing';

import { DomaincourseService } from './domaincourse-service';
import { testProviders } from '../../../../testing/test-providers';

describe('DomaincourseService', () => {
  let service: DomaincourseService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(DomaincourseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
