import { TestBed } from '@angular/core/testing';

import { StudentdomaincoursemapService } from './studentdomaincoursemap-ser';
import { testProviders } from '../../../../testing/test-providers';

describe('StudentdomaincoursemapService', () => {
  let service: StudentdomaincoursemapService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(StudentdomaincoursemapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
