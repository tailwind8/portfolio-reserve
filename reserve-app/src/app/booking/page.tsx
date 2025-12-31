import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function BookingPage() {
  // Mock data
  const availableSlots = [
    { time: '10:00', available: true },
    { time: '10:30', available: true },
    { time: '11:00', available: false },
    { time: '11:30', available: true },
    { time: '12:00', available: true },
    { time: '12:30', available: false },
    { time: '13:00', available: true },
    { time: '13:30', available: true },
    { time: '14:00', available: true },
    { time: '14:30', available: false },
    { time: '15:00', available: true },
    { time: '15:30', available: true },
    { time: '16:00', available: true },
    { time: '16:30', available: true },
    { time: '17:00', available: true },
    { time: '17:30', available: false },
  ];

  const currentMonth = '2025年1月';
  const selectedDate = '2025年1月15日（水）';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold text-gray-900">予約カレンダー</h1>
            <p className="text-gray-600">ご希望の日時を選択してください</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Calendar Section */}
            <div className="lg:col-span-2">
              <Card>
                <div className="mb-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">{currentMonth}</h2>
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">
                        ← 前月
                      </button>
                      <button className="rounded-lg border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100">
                        次月 →
                      </button>
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
                      <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((date) => {
                      const isSelected = date === 15;
                      const isToday = date === 10;
                      const isPast = date < 10;

                      return (
                        <button
                          key={date}
                          disabled={isPast}
                          className={`
                            aspect-square rounded-lg p-2 text-sm font-medium transition-colors
                            ${isPast ? 'cursor-not-allowed text-gray-300' : ''}
                            ${isSelected ? 'bg-blue-500 text-white' : ''}
                            ${isToday && !isSelected ? 'border-2 border-blue-500 text-blue-500' : ''}
                            ${!isPast && !isSelected && !isToday ? 'hover:bg-blue-50 text-gray-700' : ''}
                          `}
                        >
                          {date}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Time Slots */}
                <div className="border-t pt-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">
                    時間帯を選択（{selectedDate}）
                  </h3>
                  <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        className={`
                          rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                          ${
                            slot.available
                              ? 'border-gray-300 bg-white text-gray-700 hover:border-blue-500 hover:bg-blue-50'
                              : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through'
                          }
                        `}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Booking Info Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">予約情報</h3>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      日時
                    </label>
                    <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
                      {selectedDate}
                      <br />
                      <span className="text-gray-500">時間未選択</span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      メニュー
                    </label>
                    <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option>選択してください</option>
                      <option>カット（60分）¥5,000</option>
                      <option>カラー（90分）¥8,000</option>
                      <option>パーマ（120分）¥12,000</option>
                      <option>トリートメント（45分）¥4,000</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      担当者
                    </label>
                    <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500">
                      <option>指名なし</option>
                      <option>田中 太郎</option>
                      <option>佐藤 花子</option>
                      <option>鈴木 一郎</option>
                    </select>
                  </div>

                  <div className="border-t pt-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-600">料金</span>
                      <span className="font-semibold text-gray-900">¥5,000</span>
                    </div>
                    <div className="mb-4 flex justify-between text-sm">
                      <span className="text-gray-600">所要時間</span>
                      <span className="font-semibold text-gray-900">60分</span>
                    </div>
                  </div>

                  <Button fullWidth size="lg">
                    予約を確定する
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    ※予約確定後、確認メールをお送りします
                  </p>
                </div>
              </Card>

              {/* Notice */}
              <Card className="mt-4" padding="sm">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-xs text-gray-600">
                    <p className="font-medium mb-1">予約のキャンセル・変更</p>
                    <p>予約日の前日まで可能です。マイページから変更できます。</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

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
                  <h4 className="mb-1 text-sm font-semibold text-gray-900">24時間予約OK</h4>
                  <p className="text-xs text-gray-600">いつでもオンラインで予約できます</p>
                </div>
              </div>
            </Card>

            <Card padding="sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-gray-900">確認メール送信</h4>
                  <p className="text-xs text-gray-600">予約確定後すぐに送信されます</p>
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
                  <h4 className="mb-1 text-sm font-semibold text-gray-900">リマインダー</h4>
                  <p className="text-xs text-gray-600">予約日前日にメールでお知らせ</p>
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
