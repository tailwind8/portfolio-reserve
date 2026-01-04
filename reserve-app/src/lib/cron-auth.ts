import { timingSafeEqual } from 'crypto';

export function getExpectedCronBearerToken(): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  return `Bearer ${secret}`;
}

export function isCronAuthConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET);
}

/**
 * タイミング攻撃を防ぐため、定数時間比較を使用してCRONリクエストを認証
 */
export function isAuthorizedCronRequest(authorizationHeader: string | null): boolean {
  const expected = getExpectedCronBearerToken();
  if (!expected || !authorizationHeader) return false;

  // 長さが異なる場合でもタイミング攻撃を防ぐため、
  // まず長さを揃えてから比較する
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(authorizationHeader);

  // 長さが異なる場合は、expectedと同じ長さのダミーと比較して
  // 一定時間で処理を完了させる
  if (expectedBuffer.length !== actualBuffer.length) {
    timingSafeEqual(expectedBuffer, expectedBuffer);
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}

