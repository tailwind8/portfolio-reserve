import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-blue-50 to-white py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl lg:text-6xl">
                店舗専用の予約管理システムで
                <br />
                <span className="text-blue-500">業務効率化を実現</span>
              </h1>
              <p className="mb-10 text-lg text-gray-600 md:text-xl">
                24時間自動予約受付で電話対応を削減。顧客情報を一元管理してリピート率向上。
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link href="/">
                  <Button size="lg" className="min-w-[200px]">
                    今すぐ予約する
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="outline" className="min-w-[200px]">
                    無料で始める
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
                主な機能
              </h2>
              <p className="text-lg text-gray-600">
                予約管理に必要な機能をすべて搭載
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <Card hover>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-6 w-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">24時間予約受付</h3>
                <p className="text-gray-600">
                  お客様はいつでもオンラインで予約可能。空き状況をリアルタイムで確認できます。
                </p>
              </Card>

              <Card hover>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">顧客管理</h3>
                <p className="text-gray-600">
                  来店履歴や好みを記録。パーソナライズされたサービスでリピート率アップ。
                </p>
              </Card>

              <Card hover>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <svg className="h-6 w-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">自動メール送信</h3>
                <p className="text-gray-600">
                  予約確認やリマインダーを自動送信。ノーショウを削減します。
                </p>
              </Card>

              <Card hover>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <svg className="h-6 w-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">スタッフ管理</h3>
                <p className="text-gray-600">
                  シフト管理や指名予約に対応。スタッフごとの稼働状況を可視化。
                </p>
              </Card>

              <Card hover>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-pink-100">
                  <svg className="h-6 w-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">分析レポート</h3>
                <p className="text-gray-600">
                  予約状況や売上をグラフで可視化。データに基づいた経営判断が可能。
                </p>
              </Card>

              <Card hover>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                  <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">スマホ完全対応</h3>
                <p className="text-gray-600">
                  PC、タブレット、スマホすべてのデバイスで快適に利用できます。
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-blue-500 to-blue-600 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
              今すぐ予約管理を始めませんか？
            </h2>
            <p className="mb-8 text-lg text-blue-100">
              初期費用0円、月額5,000円から始められます
            </p>
            <Link href="/register">
              <Button size="lg" variant="outline" className="min-w-[200px] bg-white text-blue-600 hover:bg-gray-100">
                無料で始める
              </Button>
            </Link>
          </div>
        </section>

        {/* Demo Notice */}
        <section className="bg-yellow-50 py-8 border-y border-yellow-200">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-medium text-yellow-800">
                これはデモサイトです。実際の案件では貴社の要件に合わせてカスタマイズします。
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
