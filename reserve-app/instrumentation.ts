/**
 * Next.js Instrumentation Hook
 *
 * サーバー起動時とエッジランタイム時に実行される関数です。
 * Sentryの初期化など、グローバルな計測処理を設定します。
 *
 * 参考:
 * - https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * - https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

export async function register() {
  // サーバー側でのみSentryを初期化
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  // エッジランタイムでの初期化
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}
