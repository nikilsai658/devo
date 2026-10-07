import { TestBed } from '@angular/core/testing';

import { PermissionService } from './permission-service';
import { testProviders } from '../../../../testing/test-providers';

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(PermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
