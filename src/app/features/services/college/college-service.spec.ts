import { TestBed } from '@angular/core/testing';

import { CollegeService } from './college-service';
import { testProviders } from '../../../../testing/test-providers';

describe('CollegeService', () => {
  let service: CollegeService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(CollegeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
