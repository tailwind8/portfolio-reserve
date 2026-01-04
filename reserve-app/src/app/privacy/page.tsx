import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'プライバシーポリシー - 予約システム',
  description: 'プライバシーポリシー',
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">プライバシーポリシー</h1>

      <div className="prose max-w-none">
        <p className="text-gray-700 mb-4">
          準備中：このページは現在作成中です。
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Cookieの使用について</h2>
          <p className="text-gray-700">
            当サイトでは、ユーザー体験の向上とサービス改善のためにCookieを使用しています。
          </p>
        </section>
      </div>
    </main>
  );
}
