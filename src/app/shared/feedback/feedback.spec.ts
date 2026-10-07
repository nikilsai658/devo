import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

import { extractErrorMessage, extractSuccessMessage, Feedback } from './feedback';
import { ToastService } from '../toast/toast';

const httpError = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

describe('extractErrorMessage', () => {
  it('prefers the message the API sent', () => {
    expect(extractErrorMessage(httpError(400, { message: 'Email already used' }))).toBe('Email already used');
    expect(extractErrorMessage(httpError(400, 'Plain text reason'))).toBe('Plain text reason');
    expect(extractErrorMessage(httpError(400, { errors: { Email: ['Email is invalid'] } }))).toBe('Email is invalid');
  });

  it('falls back to a message for the status', () => {
    expect(extractErrorMessage(httpError(0))).toContain('Unable to reach the server');
    expect(extractErrorMessage(httpError(403))).toContain('permission');
  });

  it('lets a page reword a status (a 401 on login means wrong credentials)', () => {
    const invalid = 'Invalid username or password.';
    expect(extractErrorMessage(httpError(401), invalid, { 401: invalid })).toBe(invalid);
    // ...but a message from the API still wins.
    expect(extractErrorMessage(httpError(401, { message: 'Account locked' }), invalid, { 401: invalid })).toBe('Account locked');
  });

  it('uses the fallback for anything else', () => {
    expect(extractErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(extractErrorMessage(httpError(418), 'Fallback')).toBe('Fallback');
  });
});

describe('Feedback.fail', () => {
  let feedback: Feedback;
  let toast: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    feedback = TestBed.runInInjectionContext(() => new Feedback());
    toast = vi.spyOn(TestBed.inject(ToastService), 'error');
  });

  it('shows the backend reason as-is', () => {
    feedback.fail(httpError(400, { message: 'Ticket is closed' }), 'Your reply was not sent.');
    expect(toast).toHaveBeenCalledWith('Ticket is closed');
  });

  it('keeps what failed and adds why when the backend gave no reason', () => {
    feedback.fail(httpError(0), 'Your reply was not sent. Please try again.');
    expect(toast).toHaveBeenCalledWith('Your reply was not sent. Please try again. Unable to reach the server. Please check your connection.');
    feedback.fail(httpError(500), 'Unable to load users');
    expect(toast).toHaveBeenLastCalledWith('Unable to load users. Internal server error. Please try again later.');
  });

  it('shows just the context for other failures', () => {
    feedback.fail(null, 'Please select a file');
    expect(toast).toHaveBeenCalledWith('Please select a file');
    feedback.fail('You do not have permission to delete.');
    expect(toast).toHaveBeenLastCalledWith('You do not have permission to delete.');
  });
});

describe('extractSuccessMessage', () => {
  it('finds the API success text or returns null', () => {
    expect(extractSuccessMessage({ message: 'Saved' })).toBe('Saved');
    expect(extractSuccessMessage({ data: { message: 'Done' } })).toBe('Done');
    expect(extractSuccessMessage({})).toBeNull();
  });
});
