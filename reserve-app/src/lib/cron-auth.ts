export function getExpectedCronBearerToken(): string | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return null;
  return `Bearer ${secret}`;
}

export function isCronAuthConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET);
}

export function isAuthorizedCronRequest(authorizationHeader: string | null): boolean {
  const expected = getExpectedCronBearerToken();
  if (!expected) return false;
  return authorizationHeader === expected;
}

