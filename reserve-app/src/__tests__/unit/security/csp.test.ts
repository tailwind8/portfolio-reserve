import { getCspHeaderValue } from '@/lib/csp';

describe('getCspHeaderValue', () => {
  test('本番相当では unsafe-eval を含めない', () => {
    const csp = getCspHeaderValue({ isDev: false });
    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('unsafe-eval');
  });

  test('開発相当では unsafe-eval を許可する', () => {
    const csp = getCspHeaderValue({ isDev: true });
    expect(csp).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });
});

