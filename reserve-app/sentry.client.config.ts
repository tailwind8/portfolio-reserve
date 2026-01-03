import * as Sentry from '@sentry/nextjs';

/**
 * Sentryクライアント側初期化
 *
 * クライアントサイドでのエラー監視・パフォーマンス追跡を設定します。
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

  // セッションリプレイのサンプルレート
  // 通常のセッション: 10%、エラー発生時: 100%
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // デバッグモード（開発環境のみ有効）
  debug: process.env.NODE_ENV === 'development',

  // 個人情報を含むデータの送信（IPアドレス、リクエストヘッダーなど）
  sendDefaultPii: false,

  // Sentryの統合機能を設定
  integrations: [
    // セッションリプレイ（ユーザーの操作を再生可能にする）
    Sentry.replayIntegration({
      // パスワードなどのセンシティブ情報をマスク
      maskAllText: true,
      blockAllMedia: true,
    }),

    // ブラウザトレーシング（ページロード・ナビゲーションの追跡）
    Sentry.browserTracingIntegration({
      // Next.jsのルーティングを追跡
      enableInp: true,
    }),
  ],

  // エラーのフィルタリング
  beforeSend(event, hint) {
    // センシティブ情報を除外
    if (event.request) {
      // パスワードフィールドを除外
      if (event.request.data) {
        const data = event.request.data as Record<string, unknown>;
        if (data.password) {
          data.password = '[Filtered]';
        }
        if (data.confirmPassword) {
          data.confirmPassword = '[Filtered]';
        }
      }
    }

    // 開発環境では期待されるエラー（バリデーションエラーなど）を除外
    if (process.env.NODE_ENV === 'development') {
      const error = hint.originalException;
      if (error instanceof Error) {
        // バリデーションエラーを除外
        if (error.message.includes('validation')) {
          return null;
        }
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

    return event;
  },

  // パンくずリストの最大数
  maxBreadcrumbs: 50,

  // エラーログの有効化（Sentry Logs機能）
  enableLogs: true,
});
