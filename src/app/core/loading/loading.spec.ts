import { TestBed } from '@angular/core/testing';

import { Loading } from './loading';
import { testProviders } from '../../../testing/test-providers';

describe('Loading', () => {
  let service: Loading;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(Loading);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
