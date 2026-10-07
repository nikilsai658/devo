import { TestBed } from '@angular/core/testing';

import { TaskService } from './task-service';
import { testProviders } from '../../../../testing/test-providers';

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(TaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
