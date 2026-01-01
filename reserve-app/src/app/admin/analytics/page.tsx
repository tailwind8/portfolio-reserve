'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ReservationTrends {
  daily: Array<{ date: string; count: number }>;
  weekly: Array<{ week: string; count: number }>;
  monthly: Array<{ month: string; count: number }>;
}

interface RepeatRate {
  overall: number;
  newCustomers: number;
  repeatCustomers: number;
  monthlyTrends: Array<{ month: string; rate: number }>;
}

interface AnalyticsData {
  reservationTrends: ReservationTrends;
  repeatRate: RepeatRate;
}

type PeriodTab = 'daily' | 'weekly' | 'monthly';

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePeriodTab, setActivePeriodTab] = useState<PeriodTab>('monthly');

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
      console.error('Analytics data error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ローディング状態
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex h-96 items-center justify-center">
            <div data-testid="loading-message" className="text-gray-500">
              読み込み中...
            </div>
          </div>
        </main>
      </div>
    );
  }

  // エラー状態
  if (error || !data) {
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

  // データが空の場合
  const hasData =
    data.reservationTrends.daily.length > 0 ||
    data.reservationTrends.weekly.length > 0 ||
    data.reservationTrends.monthly.length > 0;

  if (!hasData) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <h1 data-testid="analytics-title" className="mb-6 text-3xl font-bold text-gray-900">
            分析レポート
          </h1>
          <div data-testid="no-data-message" className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-500">データがありません</p>
          </div>
        </main>
      </div>
    );
  }

  // アクティブな期間のデータを取得
  const getTrendsData = () => {
    switch (activePeriodTab) {
      case 'daily':
        return data.reservationTrends.daily;
      case 'weekly':
        return data.reservationTrends.weekly;
      case 'monthly':
        return data.reservationTrends.monthly;
      default:
        return data.reservationTrends.monthly;
    }
  };

  const trendsData = getTrendsData();

  // 円グラフ用データ
  const pieData = [
    { name: '新規顧客', value: data.repeatRate.newCustomers, color: '#3B82F6' },
    { name: 'リピーター', value: data.repeatRate.repeatCustomers, color: '#10B981' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* ページタイトル */}
        <h1 data-testid="analytics-title" className="mb-8 text-3xl font-bold text-gray-900">
          分析レポート
        </h1>

        {/* サマリーカード */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <Card data-testid="summary-card">
            <p data-testid="summary-card-label" className="mb-1 text-sm font-medium text-gray-600">
              全体リピート率
            </p>
            <p data-testid="summary-card-value" className="text-2xl font-bold text-gray-900">
              {data.repeatRate.overall}%
            </p>
          </Card>

          <Card data-testid="summary-card">
            <p data-testid="summary-card-label" className="mb-1 text-sm font-medium text-gray-600">
              新規顧客数
            </p>
            <p data-testid="summary-card-value" className="text-2xl font-bold text-gray-900">
              {data.repeatRate.newCustomers}人
            </p>
          </Card>

          <Card data-testid="summary-card">
            <p data-testid="summary-card-label" className="mb-1 text-sm font-medium text-gray-600">
              リピート顧客数
            </p>
            <p data-testid="summary-card-value" className="text-2xl font-bold text-gray-900">
              {data.repeatRate.repeatCustomers}人
            </p>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* 予約推移グラフ */}
          <Card data-testid="reservation-trends-section">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">予約推移</h2>

            {/* 期間タブ */}
            <div className="mb-6 flex gap-4 border-b border-gray-200">
              <button
                data-testid="trends-tab-daily"
                onClick={() => setActivePeriodTab('daily')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activePeriodTab === 'daily'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                日別
              </button>
              <button
                data-testid="trends-tab-weekly"
                onClick={() => setActivePeriodTab('weekly')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activePeriodTab === 'weekly'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                週別
              </button>
              <button
                data-testid="trends-tab-monthly"
                onClick={() => setActivePeriodTab('monthly')}
                className={`pb-2 text-sm font-medium transition-colors ${
                  activePeriodTab === 'monthly'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                月別
              </button>
            </div>

            {/* グラフ */}
            <div data-testid="trends-chart" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={activePeriodTab === 'daily' ? 'date' : activePeriodTab === 'weekly' ? 'week' : 'month'}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* リピート率セクション */}
          <Card data-testid="repeat-rate-section">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">リピート率分析</h2>

            <div className="mb-6 text-center">
              <p className="mb-2 text-sm text-gray-600">全体のリピート率</p>
              <p data-testid="repeat-rate-overall" className="text-4xl font-bold text-blue-600">
                {data.repeatRate.overall}%
              </p>
            </div>

            {/* 新規/リピーター円グラフ */}
            <div data-testid="customer-type-pie-chart" style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}人`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div data-testid="pie-chart-legend" className="mt-2 text-center text-sm text-gray-600">
              新規顧客 vs リピーター
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">新規顧客</p>
                <p data-testid="new-customers-count" className="text-xl font-bold text-blue-600">
                  {data.repeatRate.newCustomers}人
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">リピーター</p>
                <p data-testid="repeat-customers-count" className="text-xl font-bold text-green-600">
                  {data.repeatRate.repeatCustomers}人
                </p>
              </div>
            </div>
          </Card>

          {/* リピート率推移グラフ */}
          <Card data-testid="repeat-rate-trend-section" className="lg:col-span-2">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">リピート率推移（過去6ヶ月）</h2>

            <div data-testid="repeat-rate-trend-chart" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.repeatRate.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="リピート率 (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
