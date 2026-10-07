import { TestBed } from '@angular/core/testing';

import { AuthServices } from './auth-services';
import { testProviders } from '../../../../testing/test-providers';

describe('AuthServices', () => {
  let service: AuthServices;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(AuthServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
