/**
 * スタッフ管理モーダル用の型定義
 */

export interface Staff {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  isActive: boolean;
  _count?: {
    reservations: number;
  };
}

export interface StaffFormData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
}

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface ShiftData {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface ShiftFormData {
  [key: string]: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface VacationFormData {
  startDate: string;
  endDate: string;
  reason: string;
}

export const DAY_OF_WEEK_MAP: { [key: string]: DayOfWeek } = {
  '月曜日': 'MONDAY',
  '火曜日': 'TUESDAY',
  '水曜日': 'WEDNESDAY',
  '木曜日': 'THURSDAY',
  '金曜日': 'FRIDAY',
  '土曜日': 'SATURDAY',
  '日曜日': 'SUNDAY',
};

export const DAYS = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
