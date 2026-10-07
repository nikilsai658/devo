import { TestBed } from '@angular/core/testing';

import { AssignmentService } from './assignment-service';
import { testProviders } from '../../../../testing/test-providers';

describe('AssignmentService', () => {
  let service: AssignmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(AssignmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
