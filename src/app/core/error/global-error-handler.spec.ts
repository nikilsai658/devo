import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { GlobalErrorHandler } from './global-error-handler';
import { ToastService } from '../../shared/toast/toast';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let toast: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [GlobalErrorHandler] });
    handler = TestBed.inject(GlobalErrorHandler);
    toast = vi.spyOn(TestBed.inject(ToastService), 'error');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs an uncaught error and tells the user once per burst', () => {
    handler.handleError(new Error('boom'));
    handler.handleError(new Error('boom again'));
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it('leaves failed requests to the page that made them', () => {
    handler.handleError(new HttpErrorResponse({ status: 500 }));
    expect(toast).not.toHaveBeenCalled();
  });
});
