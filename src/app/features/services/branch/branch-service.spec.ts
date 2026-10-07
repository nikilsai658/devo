import { TestBed } from '@angular/core/testing';

import { BranchService } from './branch-service';
import { testProviders } from '../../../../testing/test-providers';

describe('BranchService', () => {
  let service: BranchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(BranchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
