import { TestBed } from '@angular/core/testing';

import { DepartmentService } from './department-service';
import { testProviders } from '../../../../testing/test-providers';

describe('DepartmentService', () => {
  let service: DepartmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(DepartmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
