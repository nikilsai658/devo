import { TestBed } from '@angular/core/testing';

import { RolepermissionService } from './rolepermission-service';
import { testProviders } from '../../../../testing/test-providers';

describe('RolepermissionService', () => {
  let service: RolepermissionService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(RolepermissionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
