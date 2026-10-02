import { inject } from '@angular/core';
import { ToastService } from '../toast/toast';

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

// Pulls the most useful human-readable message out of an HttpErrorResponse
// (or any thrown value). The backend is not consistent about its error
// shape, so this checks every format it is known to return:
//   { message } / { Message } / { error } / { title }
//   { errors: { Field: ['msg', ...] } }   (ASP.NET model validation)
//   'plain string body'
export function extractErrorMessage(err: any, fallback = DEFAULT_ERROR): string {

  if (!err) {
    return fallback;
  }

  if (typeof err === 'string') {
    return err;
  }

  const body = err.error ?? err;

  if (typeof body === 'string' && body.trim()) {
    return body;
  }

  if (body && typeof body === 'object') {

    const direct =
      body.message ??
      body.Message ??
      (typeof body.error === 'string' ? body.error : undefined) ??
      body.detail;

    if (typeof direct === 'string' && direct.trim()) {
      return direct;
    }

    if (body.errors && typeof body.errors === 'object') {
      const first = Object.values(body.errors).flat()[0];
      if (typeof first === 'string' && first.trim()) {
        return first;
      }
    }

    if (typeof body.title === 'string' && body.title.trim()) {
      return body.title;
    }

  }

  switch (err.status) {
    case 0: return 'Unable to reach the server. Please check your connection.';
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested record was not found.';
    case 409: return 'This record already exists.';
    case 500: return 'Internal server error. Please try again later.';
  }

  return fallback;

}

// The backend's success text from a response body, if it sent one:
//   { message } / { Message } / { data: { message } } / 'plain string body'
export function extractSuccessMessage(res: any): string | null {

  if (typeof res === 'string') {
    return res.trim() || null;
  }

  const message =
    res?.message ??
    res?.Message ??
    res?.data?.message ??
    res?.data?.Message;

  return typeof message === 'string' && message.trim() ? message : null;

}

// CRUD result reporting for a page: green popup on success, red popup with
// the backend's reason on failure. Create it in a component field
// initializer (`feedback = new Feedback()`) so inject() has a context.
export class Feedback {

  private readonly toast = inject(ToastService);

  // Pass the response as `res` to show the backend's own message, falling
  // back to `message` when it didn't send one.
  ok(message: string, res?: any): void {
    this.toast.success(extractSuccessMessage(res) ?? message);
  }

  fail(err: any, fallback = DEFAULT_ERROR): void {
    this.toast.error(extractErrorMessage(err, fallback));
  }

}
