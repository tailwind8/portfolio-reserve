import { useState, useEffect } from 'react';
import { BlockedTime } from '@/app/admin/blocked-times/page';
import Button from '@/components/Button';

interface BlockedTimeFormProps {
  blockedTime: BlockedTime | null;
  onSubmit: (data: Omit<BlockedTime, 'id'>) => void;
  onClose: () => void;
}

export default function BlockedTimeForm({
  blockedTime,
  onSubmit,
  onClose,
}: BlockedTimeFormProps) {
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const formatDateTimeForInput = (dateTime: string) => {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (blockedTime) {
      // 編集モード: 既存のデータをセット
      setStartDateTime(formatDateTimeForInput(blockedTime.startDateTime));
      setEndDateTime(formatDateTimeForInput(blockedTime.endDateTime));
      setReason(blockedTime.reason || '');
      setDescription(blockedTime.description || '');
    } else {
      // 新規モード: フォームをクリア
      setStartDateTime('');
      setEndDateTime('');
      setReason('');
      setDescription('');
    }
    setError('');
    // formatDateTimeForInputは変更されないため、依存配列には含めない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockedTime]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // バリデーション
    if (!startDateTime || !endDateTime) {
      setError('開始日時と終了日時は必須です');
      return;
    }

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end <= start) {
      setError('終了日時は開始日時より後にしてください');
      return;
    }

    // 送信
    onSubmit({
      startDateTime,
      endDateTime,
      reason: reason || null,
      description: description || null,
    });
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div
        data-testid="blocked-time-form-modal"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 data-testid="form-heading" className="text-2xl font-bold text-gray-900">
            {blockedTime ? '予約ブロック編集' : '予約ブロック追加'}
          </h2>
          <button
            data-testid="close-button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div data-testid="error-message" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Start DateTime */}
          <div>
            <label htmlFor="start-date-time" className="mb-1 block text-sm font-medium text-gray-700">
              開始日時 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="start-date-time"
              data-testid="start-date-time-input"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* End DateTime */}
          <div>
            <label htmlFor="end-date-time" className="mb-1 block text-sm font-medium text-gray-700">
              終了日時 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              id="end-date-time"
              data-testid="end-date-time-input"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="mb-1 block text-sm font-medium text-gray-700">
              理由
            </label>
            <select
              id="reason"
              data-testid="reason-select"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">選択してください</option>
              <option value="ホットペッパー予約">ホットペッパー予約</option>
              <option value="電話予約">電話予約</option>
              <option value="臨時休業">臨時休業</option>
              <option value="メンテナンス">メンテナンス</option>
              <option value="その他">その他</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              詳細説明（任意）
            </label>
            <textarea
              id="description"
              data-testid="description-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="詳細な説明を入力してください"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              data-testid="cancel-button"
              type="button"
              variant="outline"
              size="md"
              fullWidth
              onClick={onClose}
            >
              キャンセル
            </Button>
            <Button
              data-testid="submit-button"
              type="submit"
              variant="primary"
              size="md"
              fullWidth
            >
              {blockedTime ? '更新' : '追加'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
