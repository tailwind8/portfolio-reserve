import { maskEmail } from '@/lib/mask';

describe('maskEmail', () => {
  test('emailをマスクする', () => {
    expect(maskEmail('test@example.com')).toBe('t***@example.com');
  });

  test('不正な形式は伏せる', () => {
    expect(maskEmail('')).toBe('***');
    expect(maskEmail('no-at')).toBe('***');
    expect(maskEmail('@example.com')).toBe('***');
  });
});

