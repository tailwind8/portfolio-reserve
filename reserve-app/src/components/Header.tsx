import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-lg font-bold text-white">R</span>
          </div>
          <span className="text-xl font-bold text-gray-900">予約システム</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-8">
          <Link href="/menus" className="text-sm font-medium text-gray-600 hover:text-blue-500 transition-colors">
            メニュー
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-500 transition-colors">
            予約
          </Link>
          <Link href="/my-reservations" className="text-sm font-medium text-gray-600 hover:text-blue-500 transition-colors">
            マイページ
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-500 transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            新規登録
          </Link>
        </div>
      </div>
    </header>
  );
}
