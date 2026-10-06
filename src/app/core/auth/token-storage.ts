// Tokens live in localStorage, not cookies: browsers silently drop cookies
// over ~4KB, and the JWT embeds every permission code, so roles with many
// permissions (e.g. SuperAdmin) produce tokens far larger than that.

const ACCESS_KEY = 'token';
const REFRESH_KEY = 'refresh';

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
