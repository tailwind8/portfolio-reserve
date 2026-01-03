import * as Sentry from '@sentry/nextjs';

/**
 * Sentryサーバー側初期化
 *
 * サーバーサイドでのエラー監視・パフォーマンス追跡を設定します。
 *
 * 参考:
 * - https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

Sentry.init({
  // Sentry DSN（Data Source Name）
  // 環境変数から取得、未設定の場合は空文字列（Sentryを無効化）
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',

  // 環境の設定（development/production/test）
  environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'development',

  // リリースバージョン（デプロイ時に設定）
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || undefined,

  // トレースサンプルレート（パフォーマンス監視）
  // 開発環境: 100%、本番環境: 10%
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

  // デバッグモード（開発環境のみ有効）
  debug: process.env.NODE_ENV === 'development',

  // 個人情報を含むデータの送信を無効化（GDPR対応）
  sendDefaultPii: false,

  // エラーのフィルタリング
  beforeSend(event, hint) {
    // センシティブ情報を除外
    if (event.request) {
      // リクエストボディからセンシティブ情報を除外
      if (event.request.data) {
        const data = event.request.data as Record<string, unknown>;
        if (data.password) {
          data.password = '[Filtered]';
        }
        if (data.confirmPassword) {
          data.confirmPassword = '[Filtered]';
        }
        // クレジットカード番号のパターンを除外
        const sensitiveFields = ['creditCard', 'cardNumber', 'cvv', 'ssn'];
        sensitiveFields.forEach((field) => {
          if (data[field]) {
            data[field] = '[Filtered]';
          }
        });
      }

      // リクエストヘッダーから認証トークンを除外
      if (event.request.headers) {
        const headers = event.request.headers as Record<string, unknown>;
        if (headers.Authorization) {
          headers.Authorization = '[Filtered]';
        }
        if (headers.Cookie) {
          headers.Cookie = '[Filtered]';
        }
      }
    }

    // 期待されるエラーを除外（バリデーションエラー、404など）
    const error = hint.originalException;
    if (error instanceof Error) {
      // バリデーションエラーを除外
      if (error.message.includes('validation') || error.message.includes('ZodError')) {
        return null;
      }
    }

    return event;
  },

  // トランザクションのフィルタリング
  beforeSendTransaction(event) {
    // ヘルスチェックエンドポイントを除外
    if (event.transaction?.includes('/api/health')) {
      return null;
    }

    // 静的アセットを除外
    if (event.transaction?.startsWith('/_next/static')) {
      return null;
    }

    return event;
  },

  // パンくずリストの最大数
  maxBreadcrumbs: 50,

  // エラーログの有効化（Sentry Logs機能）
  enableLogs: true,
});
