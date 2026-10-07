import { TestBed } from '@angular/core/testing';

import { RoleService } from './role-service';
import { testProviders } from '../../../../testing/test-providers';

describe('RoleService', () => {
  let service: RoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(RoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
