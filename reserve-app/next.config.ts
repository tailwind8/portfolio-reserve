import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// ビルド時の環境変数チェック
// SKIP_AUTH_IN_TESTがproduction環境で有効になっていないか警告
const checkProductionSecurity = () => {
  const nodeEnv = process.env.NODE_ENV;
  const skipAuthInTest = process.env.SKIP_AUTH_IN_TEST;

  // production環境でSKIP_AUTH_IN_TEST=trueが設定されている場合は警告
  if (nodeEnv === 'production' && skipAuthInTest === 'true') {
    console.warn('\n');
    console.warn('⚠️  WARNING: SKIP_AUTH_IN_TEST is enabled in production!');
    console.warn('⚠️  This is a security risk and should NEVER be used in production.');
    console.warn('⚠️  Authentication bypass is only for E2E testing.');
    console.warn('\n');

    // 本番環境での事故を防ぐため、ビルドを失敗させることも検討できます
    // throw new Error('SKIP_AUTH_IN_TEST must not be enabled in production');
  }
};

// ビルド開始時にチェックを実行
checkProductionSecurity();

const nextConfig: NextConfig = {
  /**
   * セキュリティヘッダー設定
   *
   * OWASP推奨のセキュリティヘッダーを全てのレスポンスに追加します。
   *
   * 参考:
   * - https://nextjs.org/docs/app/api-reference/next-config-js/headers
   * - https://owasp.org/www-project-secure-headers/
   */
  async headers() {
    return [
      {
        // 全てのパスに対してセキュリティヘッダーを適用
        source: '/:path*',
        headers: [
          {
            // クリックジャッキング攻撃を防止
            // このサイトを iframe で埋め込むことを禁止
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            // MIMEタイプスニッフィングを防止
            // ブラウザがContent-Typeを推測することを禁止
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            // リファラー情報を制限
            // クロスオリジンの場合はオリジンのみ送信
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // 不要なブラウザ機能を無効化
            // カメラ・マイク・位置情報を無効化
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            // HTTPS接続を強制（本番環境のみ有効）
            // 1年間（31536000秒）HTTPS接続を記憶
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            // XSS攻撃を防止するためのContent Security Policy
            // 開発環境での動作を考慮し、unsafe-inline, unsafe-evalを許可
            // 本番環境では厳格化を推奨
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },

  /**
   * リダイレクト設定
   *
   * 旧URLから新URLへの永続的なリダイレクトを設定します。
   * /booking は / に統合されたため、既存のブックマーク対策として301リダイレクトを設定。
   *
   * 参考:
   * - https://nextjs.org/docs/app/api-reference/next-config-js/redirects
   */
  async redirects() {
    return [
      {
        source: '/booking',
        destination: '/',
        permanent: true, // 301リダイレクト
      },
    ];
  },
};

/**
 * Sentry設定オプション
 *
 * ソースマップのアップロードやビルド時の設定を行います。
 *
 * 参考:
 * - https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
const sentryWebpackPluginOptions = {
  // Sentryプロジェクト設定（環境変数から取得）
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // ソースマップアップロード用の認証トークン
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // CI環境以外ではSentryのログを抑制
  silent: !process.env.CI,

  // ソースマップを自動的にアップロード
  widenClientFileUpload: true,

  // Sentryリクエストをサーバー経由でルーティング（広告ブロッカー回避）
  tunnelRoute: '/monitoring',

  // 本番ビルドでのログ削除（バンドルサイズ削減）
  hideSourceMaps: true,

  // デバッグログの削除（バンドルサイズ削減）
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
};

// SentryでNext.js設定をラップ
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
