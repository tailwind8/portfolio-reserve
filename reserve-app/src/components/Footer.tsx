import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">予約システム</h3>
            <p className="text-sm text-gray-600">
              店舗専用の予約管理システムで業務効率化を実現
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">サービス</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/menus" className="hover:text-blue-500 transition-colors">
                  メニュー
                </Link>
              </li>
              <li>
                <Link href="/booking" className="hover:text-blue-500 transition-colors">
                  予約
                </Link>
              </li>
              <li>
                <Link href="/mypage" className="hover:text-blue-500 transition-colors">
                  マイページ
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">管理者</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/admin/login" className="hover:text-blue-500 transition-colors">
                  管理者ログイン
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="hover:text-blue-500 transition-colors">
                  ダッシュボード
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900">お問い合わせ</h4>
            <p className="text-sm text-gray-600">
              サポート: support@example.com
              <br />
              営業時間: 10:00 - 18:00
            </p>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>&copy; 2025 予約システム. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
