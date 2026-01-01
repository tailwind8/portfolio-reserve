import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'メンテナンス中 - 予約システム',
  description: '現在メンテナンス中です。しばらくお待ちください。',
  robots: 'noindex, nofollow',
};

/**
 * メンテナンスページ
 * システム非公開時に表示されるページ
 */
export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* アイコンとタイトル */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-4">
            <svg
              data-testid="maintenance-icon"
              className="w-12 h-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1
            data-testid="maintenance-title"
            className="text-3xl font-bold text-gray-800 mb-4"
          >
            メンテナンス中
          </h1>
        </div>

        {/* メインメッセージカード */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <p
            data-testid="maintenance-message"
            className="text-gray-600 text-center mb-4"
          >
            現在システムメンテナンス中です。
            <br />
            ご不便をおかけしますが、しばらくお待ちください。
          </p>
          <div className="border-t border-gray-200 pt-4 mt-4">
            <p className="text-sm text-gray-500 text-center">
              お急ぎの方はお電話にてお問い合わせください。
            </p>
          </div>
        </div>

        {/* 管理者リンク */}
        <div className="text-center">
          <a
            data-testid="admin-link"
            href="/admin/settings"
            className="text-sm text-blue-600 hover:text-blue-700 underline"
          >
            管理者の方はこちら
          </a>
        </div>
      </div>
    </div>
  );
}
