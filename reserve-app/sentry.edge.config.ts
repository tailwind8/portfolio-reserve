import * as Sentry from '@sentry/nextjs';

/**
 * Sentryエッジランタイム初期化
 *
 * Edge Runtime（ミドルウェアなど）でのエラー監視を設定します。
 *
 * 参考:
 * - https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

// DSNが設定されている場合のみSentryを初期化
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// DSN未設定の場合はSentryを初期化しない
if (dsn) {
  Sentry.init({
    // Sentry DSN（Data Source Name）
    dsn,

    // 環境の設定
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development',

    // リリースバージョン
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,

    // トレースサンプルレート
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

    // デバッグモード（開発環境のみ、CIでは無効）
    debug: process.env.NODE_ENV === 'development',

    // エッジランタイムでは個人情報を送信しない
    sendDefaultPii: false,
  });
}
