import { TestBed } from '@angular/core/testing';

import { YearService } from './year-service';
import { testProviders } from '../../../../testing/test-providers';

describe('YearService', () => {
  let service: YearService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(YearService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
