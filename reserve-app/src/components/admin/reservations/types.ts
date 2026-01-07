/**
 * 予約管理モーダル用の型定義
 */

export interface Reservation {
  id: string;
  reservedDate: string;
  reservedTime: string;
  customerName: string;
  menuName: string;
  staffName: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
  notes?: string;
  menuId?: string;
  staffId?: string;
}

export interface ReservationFormData {
  customer?: string;
  menu: string;
  staff: string;
  date: string;
  time: string;
  status?: Reservation['status'];
  notes?: string;
}

/**
 * コンポーネント用Props型定義
 */

export type ViewMode = 'list' | 'calendar';

export interface UniqueItem {
  id: string;
  name: string;
}

export interface ReservationViewTabsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export interface ReservationListFilterProps {
  statusFilter: string;
  dateRangeFilter: string;
  searchQuery: string;
  onStatusChange: (status: string) => void;
  onDateRangeChange: (range: string) => void;
  onSearchChange: (query: string) => void;
}

export interface ReservationTableProps {
  reservations: Reservation[];
  onShowDetail: (reservation: Reservation) => void;
  onEdit: (reservation: Reservation) => void;
  onDelete: (reservation: Reservation) => void;
}

export interface ReservationCalendarFilterProps {
  staffFilter: string;
  menuFilter: string;
  statusFilter: string;
  uniqueStaff: UniqueItem[];
  uniqueMenus: UniqueItem[];
  onStaffChange: (staff: string) => void;
  onMenuChange: (menu: string) => void;
  onStatusChange: (status: string) => void;
}

export interface WeeklyCalendarProps {
  weekDates: Date[];
  weekTitle: string;
  timeSlots: string[];
  reservations: Reservation[];
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onTimeBlockClick: (date: Date, time: string) => void;
}
