// コンポーネント
export { default as CustomerInfoSection } from './CustomerInfoSection';
export { default as CustomerMemoSection } from './CustomerMemoSection';
export { default as HistoryTabs } from './HistoryTabs';
export { default as VisitHistoryList } from './VisitHistoryList';
export { default as ReservationHistoryList } from './ReservationHistoryList';
export { default as CustomerEditModal } from './CustomerEditModal';

// 型定義
export type {
  CustomerDetail,
  VisitHistoryItem,
  ReservationHistoryItem,
  TabType,
  CustomerInfoSectionProps,
  CustomerMemoSectionProps,
  HistoryTabsProps,
  VisitHistoryListProps,
  ReservationHistoryListProps,
  CustomerEditModalProps,
} from './types';

// ユーティリティ
export { STATUS_LABELS, STATUS_COLORS, getStatusLabel, getStatusColor } from './types';
