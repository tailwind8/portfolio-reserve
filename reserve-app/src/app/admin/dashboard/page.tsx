'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface Reservation {
  id: string;
  time: string;
  customer: string;
  menu: string;
  staff: string;
  status: string;
}

interface WeeklyStat {
  date: string;
  day: string;
  count: number;
}

interface DashboardStats {
  todayReservations: number;
  monthlyReservations: number;
  monthlyRevenue: number;
  repeatRate: number;
  todayReservationsList: Reservation[];
  weeklyStats: WeeklyStat[];
}

export default function AdminDashboard() {
  // 機能フラグを取得
  const { flags: featureFlags } = useFeatureFlags();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stats');
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error?.message || result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Dashboard stats error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex h-96 items-center justify-center">
            <div data-testid="loading-message" className="text-gray-500">読み込み中...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div data-testid="error-message" className="rounded-lg bg-red-50 p-4 text-red-800">
            {error || 'データの取得に失敗しました'}
          </div>
        </main>
      </div>
    );
  }

  const statsCards = [
    { label: '本日の予約', value: `${stats.todayReservations}件`, change: '+3', trend: 'up', color: 'blue', testId: 'stat-today-reservations' },
    { label: '今月の予約', value: `${stats.monthlyReservations}件`, change: '+15%', trend: 'up', color: 'green', testId: 'stat-monthly-reservations' },
    { label: '今月の売上', value: `¥${stats.monthlyRevenue.toLocaleString()}`, change: '+8%', trend: 'up', color: 'orange', testId: 'stat-monthly-revenue' },
    { label: 'リピート率', value: `${stats.repeatRate}%`, change: '+2%', trend: 'up', color: 'purple', testId: 'stat-repeat-rate' },
  ];

  const statusBadge = (status: string) => {
    const styles = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    const labels = {
      confirmed: '確定',
      pending: '保留',
      cancelled: 'キャンセル',
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600">2025年1月15日（水）</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat, index) => (
            <Card key={index} data-testid={stat.testId} className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p data-testid="stat-label" className="mb-1 text-sm font-medium text-gray-600">{stat.label}</p>
                  <p data-testid="stat-value" className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <svg className="mr-1 h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span data-testid="stat-change" className="font-medium text-green-600">{stat.change}</span>
                    <span className="ml-1 text-gray-500">前週比</span>
                  </div>
                </div>
                <div className={`absolute right-0 top-0 h-full w-2 bg-${stat.color}-500`}></div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Today's Reservations */}
          <div className="lg:col-span-2">
            <Card data-testid="today-reservations-section">
              <div className="mb-6 flex items-center justify-between">
                <h2 data-testid="today-reservations-title" className="text-xl font-semibold text-gray-900">本日の予約</h2>
                <Button data-testid="view-all-reservations" variant="outline" size="sm">
                  すべて表示
                </Button>
              </div>

              <div className="space-y-3">
                {stats.todayReservationsList.length > 0 ? (
                  stats.todayReservationsList.map((reservation) => (
                    <div
                      key={reservation.id}
                      data-testid="reservation-item"
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div data-testid="reservation-time" className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
                          {reservation.time}
                        </div>
                        <div>
                          <p data-testid="reservation-customer" className="font-medium text-gray-900">{reservation.customer}</p>
                          <p className="text-sm text-gray-600">
                            <span data-testid="reservation-menu">{reservation.menu}</span> / <span data-testid="reservation-staff">{reservation.staff}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span data-testid="reservation-status">{statusBadge(reservation.status)}</span>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                    <p data-testid="no-reservations-message" className="text-gray-500">本日の予約はありません</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Weekly Chart */}
            <Card data-testid="weekly-stats-section" className="mt-6">
              <h2 data-testid="weekly-stats-title" className="mb-6 text-xl font-semibold text-gray-900">週間予約状況</h2>
              <div className="flex items-end justify-between gap-4" style={{ height: '200px' }}>
                {stats.weeklyStats.map((dayStat, index) => {
                  const maxCount = Math.max(...stats.weeklyStats.map(s => s.count));
                  const height = maxCount > 0 ? (dayStat.count / maxCount) * 100 : 0;
                  return (
                    <div key={index} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        data-testid="weekly-bar"
                        className="w-full rounded-t-lg bg-blue-500 transition-all hover:bg-blue-600"
                        style={{ height: `${height}%`, minHeight: dayStat.count > 0 ? '10px' : '0' }}
                        title={`${dayStat.count}件`}
                      ></div>
                      <span data-testid="weekly-day-label" className="text-sm font-medium text-gray-600">{dayStat.day}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card data-testid="quick-actions-section">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">クイックアクション</h3>
              <div className="space-y-3">
                <Button data-testid="add-reservation-button" fullWidth variant="primary" size="md">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新規予約を追加
                </Button>
                <Button data-testid="add-customer-button" fullWidth variant="outline" size="md">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  顧客を追加
                </Button>
              </div>
            </Card>

            {/* Staff Status */}
            <Card data-testid="staff-status-section">
              <h3 data-testid="staff-status-title" className="mb-4 text-lg font-semibold text-gray-900">スタッフ出勤状況</h3>
              <div className="space-y-3">
                {[
                  { name: '田中 太郎', status: '勤務中', available: true },
                  { name: '佐藤 花子', status: '勤務中', available: true },
                  { name: '鈴木 一郎', status: '休憩中', available: false },
                ].map((staff) => (
                  <div key={staff.name} data-testid="staff-item" className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p data-testid="staff-name" className="text-sm font-medium text-gray-900">{staff.name}</p>
                        <p data-testid="staff-status-text" className="text-xs text-gray-500">{staff.status}</p>
                      </div>
                    </div>
                    <div data-testid="staff-indicator" className={`h-2 w-2 rounded-full ${staff.available ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card data-testid="recent-activity-section">
              <h3 data-testid="recent-activity-title" className="mb-4 text-lg font-semibold text-gray-900">最近の活動</h3>
              <div className="space-y-3">
                {[
                  { action: '新規予約', time: '5分前', icon: '📅' },
                  { action: '予約変更', time: '15分前', icon: '✏️' },
                  { action: '新規顧客登録', time: '1時間前', icon: '👤' },
                ].map((activity, index) => (
                  <div key={index} data-testid="activity-item" className="flex items-start gap-3 text-sm">
                    <span data-testid="activity-icon" className="text-lg">{activity.icon}</span>
                    <div className="flex-1">
                      <p data-testid="activity-action" className="font-medium text-gray-900">{activity.action}</p>
                      <p data-testid="activity-time" className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 分析レポートセクション（機能フラグで制御） */}
        {featureFlags?.enableAnalyticsReport && (
          <div className="mt-8" data-testid="analytics-report-section">
            <Card>
              <h2 className="mb-6 text-xl font-semibold text-gray-900">分析レポート</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-600">月間売上推移</h3>
                  <p className="text-2xl font-bold text-gray-900">¥{stats.monthlyRevenue.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-green-600">前月比 +12%</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-600">新規顧客数</h3>
                  <p className="text-2xl font-bold text-gray-900">24人</p>
                  <p className="mt-1 text-xs text-green-600">前月比 +8%</p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <h3 className="mb-2 text-sm font-medium text-gray-600">平均客単価</h3>
                  <p className="text-2xl font-bold text-gray-900">¥8,500</p>
                  <p className="mt-1 text-xs text-green-600">前月比 +5%</p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
