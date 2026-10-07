import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';

import { DEFAULT_API_BASE, setApiBase } from '../api/api-base';
import { testProviders } from '../../../testing/test-providers';

const COLLEGE = 'https://tit.example.test/api';

describe('tokenInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    setApiBase(COLLEGE);
    TestBed.configureTestingModule({ providers: testProviders() });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    backend.verify();
    localStorage.clear();
  });

  it('sends the token to the selected college API', () => {
    localStorage.setItem('token', 'abc');
    http.get(`${COLLEGE}/User`).subscribe();
    const req = backend.expectOne(`${COLLEGE}/User`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc');
    req.flush({});
  });

  it('never sends the token to the default instance of another college', () => {
    localStorage.setItem('token', 'abc');
    http.get(`${DEFAULT_API_BASE}/College`).subscribe();
    const req = backend.expectOne(`${DEFAULT_API_BASE}/College`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('never sends the token to third-party hosts', () => {
    localStorage.setItem('token', 'abc');
    http.get('https://grafana.example.test/api/x').subscribe();
    const req = backend.expectOne('https://grafana.example.test/api/x');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('sends no header when signed out', () => {
    http.get(`${COLLEGE}/College`).subscribe();
    const req = backend.expectOne(`${COLLEGE}/College`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});
