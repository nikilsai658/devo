// Tokens live in localStorage, not cookies: browsers silently drop cookies
// over ~4KB, and the JWT embeds every permission code, so roles with many
// permissions (e.g. SuperAdmin) produce tokens far larger than that.
// They are stored ONLY under these two keys — never inside the 'user' profile.

const ACCESS_KEY = 'token';
const REFRESH_KEY = 'refresh';
const USER_KEY = 'user';

function read(key: string): string {

  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    // Server-side render or blocked storage.
    return '';
  }

}

function write(key: string, value: string): void {

  try {
    localStorage.setItem(key, value);
  } catch {}

}

export function getAccessToken(): string {
  return read(ACCESS_KEY);
}

export function getRefreshToken(): string {
  return read(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string): void {

  write(ACCESS_KEY, accessToken);

  if (refreshToken) {
    write(REFRESH_KEY, refreshToken);
  }

}

export function clearTokens(): void {

  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {}

}

// Signs the browser out: tokens, the stored profile/permissions and the
// in-progress assignment marker.
export function clearSession(): void {

  clearTokens();

  try {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem('activeAssignmentId');
  } catch {}

}

// The stored profile (id, name, role, permissions, ...), or null when missing
// or unreadable. Sessions saved before tokens were split out of the profile
// still carry accessToken/refreshToken: those are dropped and the profile rewritten.
export function readStoredUser(): Record<string, any> | null {

  const raw = read(USER_KEY);

  if (!raw) {
    return null;
  }

  try {

    const user = JSON.parse(raw);

    if (!user || typeof user !== 'object' || Array.isArray(user)) {
      return null;
    }

    if ('accessToken' in user || 'refreshToken' in user) {
      delete user.accessToken;
      delete user.refreshToken;
      write(USER_KEY, JSON.stringify(user));
    }

    return user;

  } catch {
    return null;
  }

}
