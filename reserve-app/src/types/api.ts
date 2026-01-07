import { ReservationStatus } from '@prisma/client';

/**
 * Menu API types
 */
export interface Menu {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category: string | null;
  isActive: boolean;
}

/**
 * Staff API types
 */
export interface Staff {
  id: string;
  name: string;
  role: string | null;
  isActive: boolean;
}

/**
 * Available time slot
 */
export interface TimeSlot {
  time: string; // "14:00" format
  available: boolean;
  staffId?: string;
}

/**
 * Available slots response
 */
export interface AvailableSlots {
  date: string; // "2025-01-20" format
  slots: TimeSlot[];
}

/**
 * Reservation creation request
 */
interface CreateReservationRequest {
  menuId: string;
  staffId?: string | null; // オプショナル（指名なし可）
  reservedDate: string; // "2025-01-20" format
  reservedTime: string; // "14:00" format
  notes?: string;
}

/**
 * Reservation update request
 */
interface UpdateReservationRequest {
  menuId?: string;
  staffId?: string;
  reservedDate?: string; // "2025-01-20" format
  reservedTime?: string; // "14:00" format
  notes?: string;
}

/**
 * Reservation API types
 */
export interface Reservation {
  id: string;
  userId: string;
  staffId: string | null; // nullable（指名なし可）
  menuId: string;
  reservedDate: string;
  reservedTime: string;
  status: ReservationStatus;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  staff: {
    id: string;
    name: string;
  } | null; // nullable（指名なし可）
  menu: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Reservation filter status types
 * Used for filtering reservations by status on mypage
 */
export type ReservationFilterStatus =
  | 'ALL'
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';
