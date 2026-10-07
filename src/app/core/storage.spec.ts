import { readStorage, removeStorage, writeStorage } from './storage';

describe('safe storage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads, writes and removes in local and session storage', () => {
    writeStorage('k', 'v');
    writeStorage('k', 's', 'session');
    expect(readStorage('k')).toBe('v');
    expect(readStorage('k', 'session')).toBe('s');
    removeStorage('k');
    removeStorage('k', 'session');
    expect(readStorage('k')).toBeNull();
    expect(readStorage('k', 'session')).toBeNull();
  });

  it('never throws when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(readStorage('k')).toBeNull();
    expect(() => writeStorage('k', 'v')).not.toThrow();
    expect(() => removeStorage('k')).not.toThrow();
  });
});
