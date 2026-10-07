import { TestBed } from '@angular/core/testing';

import { Superadmin } from './superadmin';
import { testProviders } from '../../../../testing/test-providers';

describe('Superadmin', () => {
  let service: Superadmin;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(Superadmin);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
