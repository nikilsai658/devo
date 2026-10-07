import { TestBed } from '@angular/core/testing';

import { TicketService } from './ticket-service';
import { testProviders } from '../../../../testing/test-providers';

describe('TicketService', () => {
  let service: TicketService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    service = TestBed.inject(TicketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
