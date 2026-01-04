'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import type { Menu } from '@/types/api';

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenus() {
      try {
        const response = await fetch('/api/menus');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'メニューの取得に失敗しました');
        }

        setMenus(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    }

    fetchMenus();
  }, []);

  // Group menus by category
  const menusByCategory = menus.reduce((acc, menu) => {
    const category = menu.category || 'その他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(menu);
    return acc;
  }, {} as Record<string, Menu[]>);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">メニュー一覧</h1>
            <p className="text-gray-600">お好みのメニューをお選びください</p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <div className="flex items-center gap-3 text-red-700">
                <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>{error}</p>
              </div>
            </Card>
          )}

          {/* Menu List by Category */}
          {!loading && !error && (
            <>
              {Object.entries(menusByCategory).map(([category, categoryMenus]) => (
                <div key={category} className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-800" data-testid="category-heading">{category}</h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryMenus.map((menu) => (
                      <Card
                        key={menu.id}
                        className="hover:shadow-lg transition-shadow"
                        data-testid="menu-card"
                        data-menu-id={menu.id}
                      >
                        <div className="flex flex-col h-full">
                          <div className="flex-1">
                            <h3 className="mb-2 text-xl font-semibold text-gray-900" data-testid="menu-name">{menu.name}</h3>
                            {menu.description && (
                              <p className="mb-4 text-sm text-gray-600" data-testid="menu-description">{menu.description}</p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between border-t pt-3">
                              <div>
                                <p className="text-xs text-gray-500">料金</p>
                                <p className="text-2xl font-bold text-blue-600" data-testid="menu-price">
                                  ¥{menu.price.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-gray-500">所要時間</p>
                                <p className="text-lg font-semibold text-gray-900" data-testid="menu-duration">{menu.duration}分</p>
                              </div>
                            </div>

                            <Link href={`/?menuId=${menu.id}`}>
                              <Button fullWidth data-testid="menu-book-button">
                                このメニューで予約
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}

              {menus.length === 0 && (
                <Card className="text-center py-12">
                  <p className="text-gray-600">現在、予約可能なメニューはありません。</p>
                </Card>
              )}
            </>
          )}

          {/* Features */}
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 flex-shrink-0">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-900">豊富なメニュー</h4>
                  <p className="text-xs text-gray-600">お客様のニーズに合わせた多彩なメニュー</p>
                </div>
              </div>
            </Card>

            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-900">明朗会計</h4>
                  <p className="text-xs text-gray-600">追加料金なしの分かりやすい料金設定</p>
                </div>
              </div>
            </Card>

            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-900">所要時間表示</h4>
                  <p className="text-xs text-gray-600">予定が立てやすい所要時間の明記</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
