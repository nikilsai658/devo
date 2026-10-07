import { TestBed } from '@angular/core/testing';

import { LeadershipService } from './leadership-service';
import { testProviders } from '../../../../testing/test-providers';

describe('LeadershipService', () => {
  let service: LeadershipService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(LeadershipService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
