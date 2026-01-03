'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReservationCard from '@/components/ReservationCard';
import type { Reservation, ReservationFilterStatus } from '@/types/api';

/**
 * マイページ - ユーザーの予約一覧を表示
 *
 * 機能:
 * - 予約一覧の表示（ステータスフィルター付き）
 * - 予約の変更（モーダル）
 * - 予約のキャンセル（確認ダイアログ）
 */
export default function MyPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ReservationFilterStatus>('ALL');

  // 予約一覧を取得
  useEffect(() => {
    fetchReservations();
  }, []);

  // フィルター適用
  useEffect(() => {
    if (filterStatus === 'ALL') {
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(
        reservations.filter((reservation) => reservation.status === filterStatus)
      );
    }
  }, [filterStatus, reservations]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Supabaseセッションは自動的にCookieで送信される
      const response = await fetch('/api/reservations');

      if (!response.ok) {
        throw new Error('予約一覧の取得に失敗しました');
      }

      const data = await response.json();

      if (data.success) {
        setReservations(data.data);
      } else {
        throw new Error(data.error?.message || '予約一覧の取得に失敗しました');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '予約一覧の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 予約が過去かどうかを判定
  const isReservationPast = (reservation: Reservation): boolean => {
    const reservationDate = new Date(`${reservation.reservedDate}T${reservation.reservedTime}`);
    return reservationDate < new Date();
  };

  // ステータスタブの定義
  const statusTabs: { value: ReservationFilterStatus; label: string }[] = [
    { value: 'ALL', label: 'すべて' },
    { value: 'CONFIRMED', label: '予約確定' },
    { value: 'PENDING', label: '予約待ち' },
    { value: 'CANCELLED', label: 'キャンセル' },
    { value: 'COMPLETED', label: '完了' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="container mx-auto flex-1 px-4 py-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">マイページ</h1>
          <p className="text-gray-600">予約の確認・変更・キャンセルができます</p>
        </div>

        {/* ステータスフィルター */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 border-b border-gray-200">
            {statusTabs.map((tab) => {
              const count =
                tab.value === 'ALL'
                  ? reservations.length
                  : reservations.filter((r) => r.status === tab.value).length;

              return (
                <button
                  key={tab.value}
                  onClick={() => setFilterStatus(tab.value)}
                  className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                    filterStatus === tab.value
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      filterStatus === tab.value
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ローディング状態 */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        )}

        {/* エラー状態 */}
        {error && !loading && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-3 text-red-700">
              <svg
                className="h-6 w-6 flex-shrink-0"
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
                <p className="font-semibold">エラーが発生しました</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchReservations}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              再試行
            </button>
          </div>
        )}

        {/* 予約一覧 */}
        {!loading && !error && (
          <>
            {filteredReservations.length === 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {filterStatus === 'ALL'
                    ? '予約がありません'
                    : `${statusTabs.find((t) => t.value === filterStatus)?.label}の予約がありません`}
                </h3>
                <p className="mb-6 text-gray-600">
                  {filterStatus === 'ALL'
                    ? 'メニュー一覧から予約を作成してください'
                    : '他のステータスで予約を確認できます'}
                </p>
                {filterStatus === 'ALL' && (
                  <a
                    href="/menus"
                    className="inline-flex items-center gap-2 rounded-md bg-blue-500 px-6 py-3 text-sm font-medium text-white hover:bg-blue-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    メニューを見る
                  </a>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredReservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    type={isReservationPast(reservation) ? 'past' : 'upcoming'}
                    onUpdate={fetchReservations}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
