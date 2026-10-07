import { TestBed } from '@angular/core/testing';

import { CollegedepartService } from './collegedepart-service';
import { testProviders } from '../../../../testing/test-providers';

describe('CollegedepartService', () => {
  let service: CollegedepartService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(CollegedepartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
