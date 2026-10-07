import { clearSession, clearTokens, getAccessToken, getRefreshToken, readStoredUser, setTokens } from './token-storage';

describe('token storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores and reads the access and refresh tokens', () => {
    setTokens('a', 'r');
    expect(getAccessToken()).toBe('a');
    expect(getRefreshToken()).toBe('r');
  });

  it('keeps the old refresh token when a refresh returns none', () => {
    setTokens('a', 'r');
    setTokens('a2');
    expect(getAccessToken()).toBe('a2');
    expect(getRefreshToken()).toBe('r');
  });

  it('clearTokens removes only the tokens', () => {
    setTokens('a', 'r');
    localStorage.setItem('user', '{"name":"x"}');
    clearTokens();
    expect(getAccessToken()).toBe('');
    expect(localStorage.getItem('user')).not.toBeNull();
  });

  it('clearSession removes tokens, profile and the active assignment marker', () => {
    setTokens('a', 'r');
    localStorage.setItem('user', '{"name":"x"}');
    sessionStorage.setItem('activeAssignmentId', '7');
    clearSession();
    expect(getAccessToken()).toBe('');
    expect(getRefreshToken()).toBe('');
    expect(localStorage.getItem('user')).toBeNull();
    expect(sessionStorage.getItem('activeAssignmentId')).toBeNull();
  });

  it('readStoredUser drops tokens left in an old profile and rewrites it', () => {
    localStorage.setItem('user', JSON.stringify({ userId: 'u', accessToken: 'secret', refreshToken: 'secret2' }));
    expect(readStoredUser()).toEqual({ userId: 'u' });
    expect(localStorage.getItem('user')).not.toContain('secret');
  });

  it('readStoredUser returns null for missing, corrupt or non-object data', () => {
    expect(readStoredUser()).toBeNull();
    localStorage.setItem('user', '{not json');
    expect(readStoredUser()).toBeNull();
    localStorage.setItem('user', '[1,2]');
    expect(readStoredUser()).toBeNull();
  });
});
