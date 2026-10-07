// localStorage / sessionStorage that never throw: on the server, in private
// modes or with site data blocked they read as empty and writes are skipped.

type Area = 'local' | 'session';

function area(which: Area): Storage | null {
  try {
    return which === 'local' ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}

export function readStorage(key: string, which: Area = 'local'): string | null {
  try {
    return area(which)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string, which: Area = 'local'): void {
  try {
    area(which)?.setItem(key, value);
  } catch {}
}

export function removeStorage(key: string, which: Area = 'local'): void {
  try {
    area(which)?.removeItem(key);
  } catch {}
}
