import { BlockedTime } from '@/app/admin/blocked-times/page';
import Button from '@/components/Button';

interface BlockedTimeListProps {
  blockedTimes: BlockedTime[];
  onEdit: (blockedTime: BlockedTime) => void;
  onDelete: (id: string) => void;
}

export default function BlockedTimeList({
  blockedTimes,
  onEdit,
  onDelete,
}: BlockedTimeListProps) {
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getReasonLabel = (reason: string | null) => {
    const labels: Record<string, string> = {
      'ホットペッパー予約': 'ホットペッパー予約',
      '電話予約': '電話予約',
      '臨時休業': '臨時休業',
      'メンテナンス': 'メンテナンス',
      'その他': 'その他',
    };
    return reason && labels[reason] ? labels[reason] : reason || '未設定';
  };

  const getReasonColor = (reason: string | null) => {
    const colors: Record<string, string> = {
      'ホットペッパー予約': 'bg-purple-100 text-purple-800',
      '電話予約': 'bg-blue-100 text-blue-800',
      '臨時休業': 'bg-red-100 text-red-800',
      'メンテナンス': 'bg-yellow-100 text-yellow-800',
      'その他': 'bg-gray-100 text-gray-800',
    };
    return reason && colors[reason] ? colors[reason] : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {blockedTimes.map((blockedTime) => (
        <div
          key={blockedTime.id}
          data-testid="blocked-time-card"
          className="rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Date Time */}
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div className="flex items-center gap-2">
                  <span data-testid="start-date-time" className="font-medium text-gray-900">
                    {formatDateTime(blockedTime.startDateTime)}
                  </span>
                  <span className="text-gray-400">〜</span>
                  <span data-testid="end-date-time" className="font-medium text-gray-900">
                    {formatDateTime(blockedTime.endDateTime)}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-2 flex items-center gap-2">
                <span
                  data-testid="reason"
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${getReasonColor(blockedTime.reason)}`}
                >
                  {getReasonLabel(blockedTime.reason)}
                </span>
              </div>

              {/* Description */}
              {blockedTime.description && (
                <div className="mt-2 flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                  <p data-testid="description" className="text-sm text-gray-600">
                    {blockedTime.description}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="ml-4 flex gap-2">
              <Button
                data-testid="edit-button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(blockedTime)}
              >
                編集
              </Button>
              <Button
                data-testid="delete-button"
                variant="outline"
                size="sm"
                onClick={() => onDelete(blockedTime.id)}
              >
                削除
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
