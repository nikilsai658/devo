import { TestBed } from '@angular/core/testing';

import { User, UserStore } from './user';

describe('UserStore', () => {
  beforeEach(() => localStorage.clear());

  it('loads the stored profile without tokens from older sessions', () => {
    localStorage.setItem('user', JSON.stringify({ userId: 'u', name: 'A', accessToken: 'secret' }));
    const store = TestBed.inject(UserStore);
    expect(store.user()).toEqual({ userId: 'u', name: 'A' } as unknown as User);
    expect(localStorage.getItem('user')).not.toContain('secret');
  });

  it('starts empty instead of crashing on corrupt storage', () => {
    localStorage.setItem('user', '{broken');
    expect(TestBed.inject(UserStore).user()).toBeNull();
  });

  it('patchUser updates the profile and storage', () => {
    const store = TestBed.inject(UserStore);
    store.setUser({ userId: 'u', isFirstLogin: true } as User);
    store.patchUser({ isFirstLogin: false });
    expect(store.user()?.isFirstLogin).toBe(false);
    expect(JSON.parse(localStorage.getItem('user')!).isFirstLogin).toBe(false);
  });

  it('clearUser removes it', () => {
    const store = TestBed.inject(UserStore);
    store.setUser({ userId: 'u' } as User);
    store.clearUser();
    expect(store.user()).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
