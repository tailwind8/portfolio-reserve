import type { NextConfig } from "next";

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
};

export default nextConfig;
