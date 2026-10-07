import { TestBed } from '@angular/core/testing';

import { AssignmentLockService, AssignmentViolation } from './assignment-lock-service';

function key(k: string, mods: KeyboardEventInit = {}): KeyboardEvent {
  const e = new KeyboardEvent('keydown', { key: k, cancelable: true, bubbles: true, ...mods });
  document.dispatchEvent(e);
  return e;
}

describe('AssignmentLockService', () => {
  let lock: AssignmentLockService;

  beforeEach(() => {
    lock = TestBed.inject(AssignmentLockService);
    lock.startLock();
  });

  afterEach(() => lock.stopLock());

  it('blocks pasting by any route (keyboard shortcut, Shift+Insert, menu all fire "paste")', () => {
    const editor = document.createElement('textarea');
    document.body.appendChild(editor);
    const reachedEditor = vi.fn();
    editor.addEventListener('paste', reachedEditor);

    const paste = new Event('paste', { cancelable: true, bubbles: true });
    editor.dispatchEvent(paste);

    expect(paste.defaultPrevented).toBe(true);
    expect(reachedEditor).not.toHaveBeenCalled();
    editor.remove();
  });

  it('blocks dropping dragged text in', () => {
    const drop = new Event('drop', { cancelable: true, bubbles: true });
    document.body.dispatchEvent(drop);
    expect(drop.defaultPrevented).toBe(true);
  });

  it('allows copy, cut and select-all for editing', () => {
    expect(key('c', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key('x', { ctrlKey: true }).defaultPrevented).toBe(false);
    expect(key('a', { ctrlKey: true }).defaultPrevented).toBe(false);
    const copy = new Event('copy', { cancelable: true, bubbles: true });
    document.dispatchEvent(copy);
    expect(copy.defaultPrevented).toBe(false);
  });

  it('still blocks print, save and the developer tools shortcuts', () => {
    expect(key('p', { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(key('s', { ctrlKey: true }).defaultPrevented).toBe(true);
    expect(key('F12').defaultPrevented).toBe(true);
    expect(key('i', { ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(true);
  });

  it('counts tab switches', () => {
    const seen: AssignmentViolation[] = [];
    lock.violations$.subscribe(v => seen.push(v));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    expect(lock.tabSwitchCount).toBe(1);
    expect(seen[0].type).toBe('tab-switch');
  });

  it('releases everything when stopped', () => {
    lock.stopLock();
    const paste = new Event('paste', { cancelable: true, bubbles: true });
    document.dispatchEvent(paste);
    expect(paste.defaultPrevented).toBe(false);
    expect(key('p', { ctrlKey: true }).defaultPrevented).toBe(false);
  });
});
