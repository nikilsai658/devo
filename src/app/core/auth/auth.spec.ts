import { TestBed } from '@angular/core/testing';

import { Auth } from './auth';
import { testProviders } from '../../../testing/test-providers';

describe('Auth', () => {
  let service: Auth;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(Auth);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
