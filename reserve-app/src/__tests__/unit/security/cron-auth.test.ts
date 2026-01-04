import { getExpectedCronBearerToken, isAuthorizedCronRequest, isCronAuthConfigured } from '@/lib/cron-auth';

describe('cron auth', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.CRON_SECRET;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('CRON_SECRET未設定の場合は未設定扱いになり、認可も失敗する', () => {
    expect(isCronAuthConfigured()).toBe(false);
    expect(getExpectedCronBearerToken()).toBeNull();
    expect(isAuthorizedCronRequest('Bearer anything')).toBe(false);
  });

  test('Authorizationヘッダーが完全一致する場合のみ認可する', () => {
    process.env.CRON_SECRET = 'my-secret';
    expect(isCronAuthConfigured()).toBe(true);
    expect(getExpectedCronBearerToken()).toBe('Bearer my-secret');

    expect(isAuthorizedCronRequest('Bearer my-secret')).toBe(true);
    expect(isAuthorizedCronRequest('Bearer my-secret ')).toBe(false);
    expect(isAuthorizedCronRequest('bearer my-secret')).toBe(false);
    expect(isAuthorizedCronRequest('Bearer wrong')).toBe(false);
    expect(isAuthorizedCronRequest(null)).toBe(false);
  });
});

