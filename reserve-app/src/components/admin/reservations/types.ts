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
