import { isDevMode } from '@angular/core';

// `ng serve` talks to a local API; production builds talk to the deployed college instance.
export const DEFAULT_API_BASE = isDevMode()
  ? 'http://localhost:5000/api'
  : 'https://college-a.178-104-255-148.sslip.io/api';

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

export function setApiBase(base: string | null): void {
  try {
    if (base && /^https:\/\/[a-z0-9.-]+\/api$/i.test(base)) localStorage.setItem(KEY, base);
    else localStorage.removeItem(KEY);
  } catch {}
}
