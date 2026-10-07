import { DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { IDLE_TIMEOUT_MS, IdleTimeout } from './idle-timeout';
import { ToastService } from '../../shared/toast/toast';
import { signIn, testProviders } from '../../../testing/test-providers';

describe('IdleTimeout', () => {
  let idle: IdleTimeout;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: testProviders() });
    idle = TestBed.inject(IdleTimeout);
  });

  afterEach(() => localStorage.clear());

  it('keeps an active session', () => {
    signIn();
    localStorage.setItem('lastActivity', String(Date.now()));
    expect(idle.check()).toBe(false);
    expect(localStorage.getItem('token')).toBe('access-token');
  });

  it('signs out after the idle limit and says why', () => {
    signIn();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    const toast = vi.spyOn(TestBed.inject(ToastService), 'error');
    const now = Date.now();
    localStorage.setItem('lastActivity', String(now - IDLE_TIMEOUT_MS - 1));

    expect(idle.check(now)).toBe(true);
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/auth/login']);
    expect(toast).toHaveBeenCalled();
  });

  it('does nothing when nobody is signed in', () => {
    localStorage.setItem('lastActivity', '1');
    expect(idle.check()).toBe(false);
  });

  it('ends a session left idle past the limit when the app starts', () => {
    signIn();
    localStorage.setItem('lastActivity', '1');
    idle.start(TestBed.inject(DestroyRef));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('starts a fresh activity clock for a current session', () => {
    signIn();
    idle.start(TestBed.inject(DestroyRef));
    const last = Number(localStorage.getItem('lastActivity'));
    expect(Date.now() - last).toBeLessThan(5000);
    expect(localStorage.getItem('token')).toBe('access-token');
  });
});
