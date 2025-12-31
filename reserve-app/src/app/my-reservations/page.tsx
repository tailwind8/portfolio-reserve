'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import ReservationList from '@/components/ReservationList';
import { useReservations } from '@/hooks/useReservations';

type TabType = 'upcoming' | 'past';

export default function MyReservationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const { reservations, isLoading, error, refetch } = useReservations();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingReservations = reservations.filter((r) => {
    const reservedDate = new Date(r.reservedDate);
    return reservedDate >= today && r.status !== 'CANCELLED';
  });

  const pastReservations = reservations.filter((r) => {
    const reservedDate = new Date(r.reservedDate);
    return reservedDate < today || ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(r.status);
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* ページヘッダー */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">マイページ</h1>
            <p className="text-gray-600">予約の確認・変更・キャンセルができます</p>
          </div>

          {/* タブ切り替え */}
          <Card className="mb-6" padding="none">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'upcoming'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                今後の予約
                {upcomingReservations.length > 0 && (
                  <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-600">
                    {upcomingReservations.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('past')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                  activeTab === 'past'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                過去の予約
              </button>
            </div>
          </Card>

          {/* エラー表示 */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="font-medium text-red-800">エラーが発生しました</p>
                  <p className="text-sm text-red-700">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={refetch}
                  >
                    再読み込み
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* ローディング */}
          {isLoading ? (
            <Card>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">読み込み中...</p>
              </div>
            </Card>
          ) : (
            <>
              {/* 今後の予約 */}
              {activeTab === 'upcoming' && (
                <ReservationList
                  reservations={upcomingReservations}
                  type="upcoming"
                  onUpdate={refetch}
                />
              )}

              {/* 過去の予約 */}
              {activeTab === 'past' && (
                <ReservationList
                  reservations={pastReservations}
                  type="past"
                  onUpdate={refetch}
                />
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
