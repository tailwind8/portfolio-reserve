/**
 * 店舗設定で使用する型定義と定数
 */

export type SettingsFormData = {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  openTime: string;
  closeTime: string;
  closedDays: string[];
  slotDuration: string;
  isPublic: boolean;
  minAdvanceBookingDays: string;
  maxAdvanceBookingDays: string;
  cancellationDeadlineHours: string;
};

export const INITIAL_FORM_DATA: SettingsFormData = {
  storeName: '',
  storeEmail: '',
  storePhone: '',
  openTime: '09:00',
  closeTime: '20:00',
  closedDays: [],
  slotDuration: '30',
  isPublic: true,
  minAdvanceBookingDays: '0',
  maxAdvanceBookingDays: '90',
  cancellationDeadlineHours: '24',
};

export const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: '月曜日' },
  { value: 'TUESDAY', label: '火曜日' },
  { value: 'WEDNESDAY', label: '水曜日' },
  { value: 'THURSDAY', label: '木曜日' },
  { value: 'FRIDAY', label: '金曜日' },
  { value: 'SATURDAY', label: '土曜日' },
  { value: 'SUNDAY', label: '日曜日' },
] as const;

export const SLOT_DURATIONS = [
  { value: '15', label: '15分' },
  { value: '30', label: '30分' },
  { value: '60', label: '60分' },
  { value: '90', label: '90分' },
  { value: '120', label: '120分' },
] as const;
