import { TestBed } from '@angular/core/testing';

import { Studentassignment } from './studentassignment';
import { testProviders } from '../../../../testing/test-providers';

describe('Studentassignment', () => {
  let service: Studentassignment;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(Studentassignment);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
