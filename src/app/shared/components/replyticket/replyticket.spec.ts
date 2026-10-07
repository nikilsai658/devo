import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

import { ReplyTicketComponent } from './replyticket';
import { setApiBase } from '../../../core/api/api-base';
import { ToastService } from '../../toast/toast';
import { signIn, testProviders } from '../../../../testing/test-providers';

const API = 'https://tit.example.test/api';

describe('ReplyTicketComponent', () => {
  let fixture: ComponentFixture<ReplyTicketComponent>;
  let backend: HttpTestingController;
  let toastError: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    localStorage.clear();
    setApiBase(API);
    signIn(['REPLY_TICKET']);
    await TestBed.configureTestingModule({
      imports: [ReplyTicketComponent],
      providers: [
        ...testProviders(),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: '5' }) } } }
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReplyTicketComponent);
    backend = TestBed.inject(HttpTestingController);
    toastError = vi.spyOn(TestBed.inject(ToastService), 'error');
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    backend.match(() => true).forEach(r => r.flush({ data: [] }));
  });

  it('tells the user when the conversation cannot be loaded', () => {
    backend.expectOne(`${API}/Ticket/5`).flush({ data: { id: 5, status: 'Open' } });
    backend.expectOne(r => r.url === `${API}/Ticket/5/messages`).flush(null, { status: 500, statusText: 'Error' });
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('conversation'));
  });

  it('keeps the text and says so when a reply fails to send', () => {
    backend.expectOne(`${API}/Ticket/5`).flush({ data: { id: 5, status: 'Open' } });
    backend.expectOne(r => r.url === `${API}/Ticket/5/messages`).flush({ data: [] });

    const component = fixture.componentInstance;
    component.message = 'Still broken';
    component.send();
    backend.expectOne(`${API}/Ticket/5`).flush({ data: { id: 5, status: 'Open' } });
    backend.expectOne(`${API}/Ticket/5/reply`).flush(null, { status: 500, statusText: 'Error' });

    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('not sent'));
    expect(component.message).toBe('Still broken');
  });

  it('explains why a reply to a ticket closed meanwhile is not sent', () => {
    backend.expectOne(`${API}/Ticket/5`).flush({ data: { id: 5, status: 'Open' } });
    backend.expectOne(r => r.url === `${API}/Ticket/5/messages`).flush({ data: [] });

    fixture.componentInstance.message = 'Hello?';
    fixture.componentInstance.send();
    backend.expectOne(`${API}/Ticket/5`).flush({ data: { id: 5, status: 'Closed' } });
    backend.expectNone(`${API}/Ticket/5/reply`);
    expect(toastError).toHaveBeenCalledWith(expect.stringContaining('closed'));
  });
});
