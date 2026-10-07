import { DEFAULT_API_BASE, getApiBase, isApiRequest, setApiBase } from './api-base';

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

  describe('isApiRequest', () => {
    it('matches only the selected college instance', () => {
      setApiBase('https://tit.example.test/api');
      expect(isApiRequest('https://tit.example.test/api/User')).toBe(true);
      expect(isApiRequest('https://tit.example.test/api')).toBe(true);
      expect(isApiRequest(DEFAULT_API_BASE + '/College')).toBe(false);
    });

    it('does not match a look-alike host or path', () => {
      setApiBase('https://tit.example.test/api');
      expect(isApiRequest('https://tit.example.test/apix/User')).toBe(false);
      expect(isApiRequest('https://tit.example.test.evil.test/api/User')).toBe(false);
      expect(isApiRequest('https://grafana.example.test/d/1')).toBe(false);
    });
  });
});
