'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import type { Menu, Staff } from '@/types/api';
import type { FeatureFlags } from '@/hooks/useFeatureFlags';

interface BookingSidebarProps {
  selectedDate: Date | null;
  selectedTime: string | null;
  selectedMenuId: string;
  selectedStaffId: string;
  notes: string;
  couponCode: string;
  menus: Menu[];
  staff: Staff[];
  featureFlags: FeatureFlags | null;
  submitting: boolean;
  onMenuChange: (menuId: string) => void;
  onStaffChange: (staffId: string) => void;
  onNotesChange: (notes: string) => void;
  onCouponChange: (coupon: string) => void;
  onSubmit: () => void;
}

const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土'];

export default function BookingSidebar({
  selectedDate,
  selectedTime,
  selectedMenuId,
  selectedStaffId,
  notes,
  couponCode,
  menus,
  staff,
  featureFlags,
  submitting,
  onMenuChange,
  onStaffChange,
  onNotesChange,
  onCouponChange,
  onSubmit,
}: BookingSidebarProps) {
  const selectedDateStr = selectedDate
    ? `${selectedDate.getFullYear()}年${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日（${WEEK_DAYS[selectedDate.getDay()]}）`
    : '日付未選択';

  const selectedMenu = menus.find((m) => m.id === selectedMenuId);
  const isFormValid = selectedDate && selectedTime && selectedMenuId;

  return (
    <>
      <Card className="sticky top-24" data-testid="booking-info-sidebar">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">予約情報</h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              日時
            </label>
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
              <span data-testid="selected-date">{selectedDateStr}</span>
              <br />
              <span className="text-gray-500" data-testid="selected-time">
                {selectedTime || '時間未選択'}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="menu" className="mb-1 block text-sm font-medium text-gray-700">
              メニュー
            </label>
            <select
              id="menu"
              value={selectedMenuId}
              onChange={(e) => onMenuChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              {menus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.name}（{menu.duration}分）¥{menu.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          {featureFlags?.enableStaffSelection && (
            <div>
              <label htmlFor="staff" className="mb-1 block text-sm font-medium text-gray-700">
                担当者
              </label>
              <select
                id="staff"
                value={selectedStaffId}
                onChange={(e) => onStaffChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">指名なし</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.role && `（${s.role}）`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="notes" className="mb-1 block text-sm font-medium text-gray-700">
              備考・ご要望（任意）
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="特別なご要望があればご記入ください"
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">{notes.length}/500文字</p>
          </div>

          {featureFlags?.enableCouponFeature && (
            <div>
              <label htmlFor="coupon" className="mb-1 block text-sm font-medium text-gray-700">
                クーポンコード（任意）
              </label>
              <input
                id="coupon"
                type="text"
                value={couponCode}
                onChange={(e) => onCouponChange(e.target.value)}
                placeholder="クーポンコードを入力"
                maxLength={50}
                data-testid="coupon-input"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {selectedMenu && (
            <div className="border-t pt-4">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-gray-600">料金</span>
                <span className="font-semibold text-gray-900">
                  ¥{selectedMenu.price.toLocaleString()}
                </span>
              </div>
              <div className="mb-4 flex justify-between text-sm">
                <span className="text-gray-600">所要時間</span>
                <span className="font-semibold text-gray-900">{selectedMenu.duration}分</span>
              </div>
            </div>
          )}

          <Button
            fullWidth
            size="lg"
            disabled={!isFormValid || submitting}
            onClick={onSubmit}
            data-testid="submit-button"
          >
            {submitting ? '予約中...' : '予約を確定する'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            ※予約確定後、確認メールをお送りします
          </p>
        </div>
      </Card>

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
    </>
  );
}
