import { inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '../toast/toast';

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

// The human-readable reason the backend sent with an error, or null. The backend
// is not consistent about its error shape, so this checks every format it is
// known to return:
//   { message } / { Message } / { error } / { detail } / { title }
//   { errors: { Field: ['msg', ...] } }   (ASP.NET model validation)
//   'plain string body'
export function apiErrorMessage(err: any): string | null {

  if (!err) {
    return null;
  }

  if (typeof err === 'string') {
    return err.trim() || null;
  }

  // For a failed request only the response body counts: the HttpErrorResponse's own
  // message is technical ("Http failure response for https://...: 0 Unknown Error").
  const body = err instanceof HttpErrorResponse ? err.error : (err.error ?? err);

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

  return null;

}

// A plain-language explanation of an HTTP status, or null for the others.
export function statusErrorMessage(status: unknown): string | null {

  switch (status) {
    case 0: return 'Unable to reach the server. Please check your connection.';
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested record was not found.';
    case 409: return 'This record already exists.';
    case 500: return 'Internal server error. Please try again later.';
  }

  return null;

}

// The best single message for an error: the backend's reason, else a message for
// the status (`statusMessages` can reword one — e.g. a 401 on the login page means
// wrong credentials, not an expired session), else `fallback`.
export function extractErrorMessage(err: any, fallback = DEFAULT_ERROR, statusMessages: Record<number, string> = {}): string {

  return apiErrorMessage(err) ??
    statusMessages[err?.status] ??
    statusErrorMessage(err?.status) ??
    fallback;

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

  // `context` says what failed ("Unable to load users."). The backend's own reason is shown
  // as-is; without one, the context is kept and the status explanation added to it, so the
  // user learns both what failed and why ("Your reply was not sent. Unable to reach the server.").
  fail(err: any, context = DEFAULT_ERROR): void {
    const reason = apiErrorMessage(err);
    if (reason) {
      this.toast.error(reason);
      return;
    }
    const status = statusErrorMessage(err?.status);
    if (!status) {
      this.toast.error(context);
    } else if (context === DEFAULT_ERROR) {
      this.toast.error(status);
    } else {
      this.toast.error(`${context.replace(/[.\s]*$/, '.')} ${status}`);
    }
  }

}
