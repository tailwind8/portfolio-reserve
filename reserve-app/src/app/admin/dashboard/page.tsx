import AdminSidebar from '@/components/AdminSidebar';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function AdminDashboard() {
  // Mock data
  const todayReservations = [
    { id: 1, time: '10:00', customer: '山田 太郎', menu: 'カット', staff: '田中', status: 'confirmed' },
    { id: 2, time: '11:30', customer: '佐藤 花子', menu: 'カラー', staff: '佐藤', status: 'confirmed' },
    { id: 3, time: '13:00', customer: '鈴木 一郎', menu: 'パーマ', staff: '鈴木', status: 'pending' },
    { id: 4, time: '14:30', customer: '田中 美咲', menu: 'トリートメント', staff: '田中', status: 'confirmed' },
    { id: 5, time: '16:00', customer: '高橋 健太', menu: 'カット', staff: '佐藤', status: 'confirmed' },
  ];

  const stats = [
    { label: '本日の予約', value: '12件', change: '+3', trend: 'up', color: 'blue' },
    { label: '今月の予約', value: '145件', change: '+15%', trend: 'up', color: 'green' },
    { label: '今月の売上', value: '¥580,000', change: '+8%', trend: 'up', color: 'orange' },
    { label: 'リピート率', value: '68%', change: '+2%', trend: 'up', color: 'purple' },
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
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="mb-1 text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <svg className="mr-1 h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="font-medium text-green-600">{stat.change}</span>
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
            <Card>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">本日の予約</h2>
                <Button variant="outline" size="sm">
                  すべて表示
                </Button>
              </div>

              <div className="space-y-3">
                {todayReservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-sm font-semibold text-blue-600">
                        {reservation.time}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{reservation.customer}</p>
                        <p className="text-sm text-gray-600">
                          {reservation.menu} / {reservation.staff}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {statusBadge(reservation.status)}
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weekly Chart */}
            <Card className="mt-6">
              <h2 className="mb-6 text-xl font-semibold text-gray-900">週間予約状況</h2>
              <div className="flex items-end justify-between gap-4" style={{ height: '200px' }}>
                {['月', '火', '水', '木', '金', '土', '日'].map((day, index) => {
                  const heights = [60, 75, 90, 65, 80, 85, 70];
                  return (
                    <div key={day} className="flex flex-1 flex-col items-center gap-2">
                      <div
                        className="w-full rounded-t-lg bg-blue-500 transition-all hover:bg-blue-600"
                        style={{ height: `${heights[index]}%` }}
                      ></div>
                      <span className="text-sm font-medium text-gray-600">{day}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">クイックアクション</h3>
              <div className="space-y-3">
                <Button fullWidth variant="primary" size="md">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  新規予約を追加
                </Button>
                <Button fullWidth variant="outline" size="md">
                  <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  顧客を追加
                </Button>
              </div>
            </Card>

            {/* Staff Status */}
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">スタッフ出勤状況</h3>
              <div className="space-y-3">
                {[
                  { name: '田中 太郎', status: '勤務中', available: true },
                  { name: '佐藤 花子', status: '勤務中', available: true },
                  { name: '鈴木 一郎', status: '休憩中', available: false },
                ].map((staff) => (
                  <div key={staff.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                        {staff.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{staff.name}</p>
                        <p className="text-xs text-gray-500">{staff.status}</p>
                      </div>
                    </div>
                    <div className={`h-2 w-2 rounded-full ${staff.available ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">最近の活動</h3>
              <div className="space-y-3">
                {[
                  { action: '新規予約', time: '5分前', icon: '📅' },
                  { action: '予約変更', time: '15分前', icon: '✏️' },
                  { action: '新規顧客登録', time: '1時間前', icon: '👤' },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <span className="text-lg">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
