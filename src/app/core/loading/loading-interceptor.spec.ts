import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

import { BACKGROUND_REQUEST } from './loading-interceptor';
import { Loading } from './loading';
import { testProviders } from '../../../testing/test-providers';

describe('loadingInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let loading: Loading;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: testProviders() });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(Loading);
  });

  afterEach(() => backend.verify());

  it('is active while any request is in flight', () => {
    http.get('/a').subscribe();
    http.get('/b').subscribe({ error: () => {} });
    expect(loading.active()).toBe(true);
    backend.expectOne('/a').flush({});
    expect(loading.active()).toBe(true);
    backend.expectOne('/b').flush(null, { status: 500, statusText: 'Error' });
    expect(loading.active()).toBe(false);
  });

  it('stops counting a cancelled request', () => {
    const sub = http.get('/a').subscribe();
    expect(loading.active()).toBe(true);
    sub.unsubscribe();
    expect(loading.active()).toBe(false);
    backend.expectOne('/a');
  });

  it('ignores background requests', () => {
    http.get('/poll', { context: new HttpContext().set(BACKGROUND_REQUEST, true) }).subscribe();
    expect(loading.active()).toBe(false);
    backend.expectOne('/poll').flush({});
  });
});
