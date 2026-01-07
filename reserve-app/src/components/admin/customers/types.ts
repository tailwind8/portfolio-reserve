/**
 * 顧客詳細ページ用の型定義
 */

export interface VisitHistoryItem {
  id: string;
  date: string;
  time: string;
  menuName: string;
  menuPrice: number;
  menuDuration: number;
  staffName: string;
  staffRole: string | null;
}

export interface ReservationHistoryItem {
  id: string;
  date: string;
  time: string;
  status: string;
  menuName: string;
  menuPrice: number;
  staffName: string;
  createdAt: string;
}

export interface CustomerDetail {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  memo: string;
  visitHistory: VisitHistoryItem[];
  reservationHistory: ReservationHistoryItem[];
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TabType = 'visit' | 'reservation';

// ステータス定義
export const STATUS_LABELS: Record<string, string> = {
  PENDING: '予約確定待ち',
  CONFIRMED: '確定',
  CANCELLED: 'キャンセル',
  COMPLETED: '来店済み',
  NO_SHOW: '無断キャンセル',
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

export const getStatusLabel = (status: string): string => STATUS_LABELS[status] || status;
export const getStatusColor = (status: string): string => STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

/**
 * コンポーネント用Props型定義
 */

export interface CustomerInfoSectionProps {
  customer: CustomerDetail;
  onEdit: () => void;
}

export interface CustomerMemoSectionProps {
  memo: string | null;
  isEditing: boolean;
  memoValue: string;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onMemoChange: (value: string) => void;
}

export interface HistoryTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export interface VisitHistoryListProps {
  visitHistory: VisitHistoryItem[];
}

export interface ReservationHistoryListProps {
  reservationHistory: ReservationHistoryItem[];
}

export interface CustomerEditModalProps {
  isOpen: boolean;
  formData: { name: string; phone: string };
  isSaving: boolean;
  onFormChange: (data: { name: string; phone: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}
