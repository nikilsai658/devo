import { TestBed } from '@angular/core/testing';

import { Student } from './student';
import { testProviders } from '../../../../testing/test-providers';

describe('Student', () => {
  let service: Student;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(Student);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
