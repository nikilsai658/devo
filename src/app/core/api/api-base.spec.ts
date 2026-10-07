import { DEFAULT_API_BASE, getApiBase, setApiBase } from './api-base';

describe('api base', () => {
  beforeEach(() => localStorage.removeItem('apibase'));

  it('uses the default instance when nothing is remembered', () => {
    expect(getApiBase()).toBe(DEFAULT_API_BASE);
  });

  it('uses the remembered college instance', () => {
    setApiBase('https://tit.example.test/api');
    expect(getApiBase()).toBe('https://tit.example.test/api');
  });

  it('forgets it again when the college has no deployment', () => {
    setApiBase('https://tit.example.test/api');
    setApiBase(null);
    expect(getApiBase()).toBe(DEFAULT_API_BASE);
  });

  it('ignores anything that is not an https api address', () => {
    setApiBase('http://evil.test/api');
    setApiBase('javascript:alert(1)');
    expect(getApiBase()).toBe(DEFAULT_API_BASE);
    localStorage.setItem('apibase', 'https://evil.test/steal?x=');
    expect(getApiBase()).toBe(DEFAULT_API_BASE);
  });
});
