import { TestBed } from '@angular/core/testing';

import { DomainServices } from './domain-services';
import { testProviders } from '../../../../testing/test-providers';

describe('DomainServices', () => {
  let service: DomainServices;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(DomainServices);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
