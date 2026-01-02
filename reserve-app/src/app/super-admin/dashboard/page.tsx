'use client';

import Link from 'next/link';

/**
 * スーパー管理者ダッシュボード（プレースホルダー）
 * Phase 3で本格実装予定
 */
export default function SuperAdminDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-purple-500 text-white shadow">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
              <span className="text-xl font-bold text-purple-500">S</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">スーパー管理者ダッシュボード</h1>
              <p className="text-sm text-purple-100">開発者用管理画面</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="rounded-full bg-purple-600 px-3 py-1 text-sm font-medium">
              SUPER_ADMIN
            </span>
            <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            ようこそ、スーパー管理者さん
          </h2>
          <p className="text-gray-600">
            このダッシュボードは Phase 3 で本格実装される予定です。
          </p>
        </div>

        {/* Status Card */}
        <div className="mb-8 rounded-lg bg-green-50 border border-green-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-green-900">
                ✅ Phase 2 完了: スーパー管理者認証
              </h3>
              <p className="text-sm text-green-700">
                スーパー管理者として正常にログインできています。
              </p>
            </div>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature Flags Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              機能フラグ管理
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              オプション機能の有効化/無効化を管理します。
            </p>
            <Link
              href="/super-admin/feature-flags"
              className="inline-block rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white hover:bg-purple-600"
            >
              Phase 3で実装予定
            </Link>
          </div>

          {/* Tenant Management Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              テナント管理
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              複数店舗（テナント）の設定を一元管理します。
            </p>
            <button
              disabled
              className="rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
            >
              Phase 4で実装予定
            </button>
          </div>

          {/* Analytics Card */}
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              全体分析レポート
            </h3>
            <p className="mb-4 text-sm text-gray-600">
              全テナントの予約・売上統計を確認します。
            </p>
            <button
              disabled
              className="rounded-lg bg-gray-300 px-4 py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
            >
              Phase 4で実装予定
            </button>
          </div>
        </div>

        {/* Implementation Timeline */}
        <div className="mt-8 rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-bold text-gray-900">
            実装スケジュール
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <span className="text-sm font-bold text-green-600">✓</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Phase 1: データベース設計
                </p>
                <p className="text-sm text-gray-600">完了</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <span className="text-sm font-bold text-green-600">✓</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Phase 2: スーパー管理者認証
                </p>
                <p className="text-sm text-gray-600">完了（現在のフェーズ）</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
                <span className="text-sm font-bold text-yellow-600">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Phase 3: 機能フラグ管理画面
                </p>
                <p className="text-sm text-gray-600">3-4日見積</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-bold text-gray-600">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">Phase 4: API実装</p>
                <p className="text-sm text-gray-600">2-3日見積</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                <span className="text-sm font-bold text-gray-600">5</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Phase 5: フロントエンド制御
                </p>
                <p className="text-sm text-gray-600">2-3日見積</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
