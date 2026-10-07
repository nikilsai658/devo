import { TestBed } from '@angular/core/testing';

import { DeptbranchService } from './deptbranch-service';
import { testProviders } from '../../../../testing/test-providers';

describe('DeptbranchService', () => {
  let service: DeptbranchService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(DeptbranchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
