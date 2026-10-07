import { environment } from '../../../environments/environment';

// Set per build configuration in src/environments (local API for `ng serve`, the deployed one otherwise).
export const DEFAULT_API_BASE = environment.defaultApiBase;

const KEY = 'apibase';

// Each college runs in its own container with its own host. When the user picks a college, the
// address the registry gives for it is remembered here and every later call goes to it. The default
// is used only for pre-login lookups (college list, host lookup) and by sessions that started before
// this existed; a college without an active deployment cannot be selected (see the college page).
export function getApiBase(): string {
  try {
    const stored = localStorage.getItem(KEY);
    return stored && /^https:\/\/[a-z0-9.-]+\/api$/i.test(stored) ? stored : DEFAULT_API_BASE;
  } catch {
    return DEFAULT_API_BASE;
  }
}

// True for requests to the selected college's instance — the only host that may receive the token.
// The default instance is used for anonymous pre-login lookups and gets no token: a session belongs
// to one college and must not be presented to another college's server.
export function isApiRequest(url: string): boolean {
  const base = getApiBase();
  return url === base || url.startsWith(base + '/') || url.startsWith(base + '?');
}

export function setApiBase(base: string | null): void {
  try {
    if (base && /^https:\/\/[a-z0-9.-]+\/api$/i.test(base)) localStorage.setItem(KEY, base);
    else localStorage.removeItem(KEY);
  } catch {}
}
