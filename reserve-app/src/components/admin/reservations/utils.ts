/**
 * 予約管理ページ用ユーティリティ関数
 */

import type { Reservation } from './types';

// 営業時間設定
export const OPENING_TIME = '09:00';
export const CLOSING_TIME = '20:00';
export const BREAK_TIME_START = '12:00';
export const BREAK_TIME_END = '13:00';

// ステータスのスタイル定義
export const STATUS_STYLES: Record<Reservation['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

// ステータスのラベル定義
export const STATUS_LABELS: Record<Reservation['status'], string> = {
  PENDING: '保留',
  CONFIRMED: '確定',
  CANCELLED: 'キャンセル',
  COMPLETED: '完了',
  NO_SHOW: '無断キャンセル',
};

/**
 * 定休日かどうかを判定（日曜日を定休日とする）
 */
export const isClosedDay = (date: Date): boolean => {
  return date.getDay() === 0; // 0 = 日曜日
};

/**
 * タイムブロックの色を取得
 */
export const getBlockColor = (reservation: Reservation | null): string => {
  if (!reservation) {
    return 'bg-green-100 text-green-800';
  }

  switch (reservation.status) {
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'COMPLETED':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * 時間スロットを生成（30分刻み）
 */
export const generateTimeSlots = (): string[] => {
  const [openHour, openMinute] = OPENING_TIME.split(':').map(Number);
  const [closeHour, closeMinute] = CLOSING_TIME.split(':').map(Number);

  const slots: string[] = [];
  const startMinutes = openHour * 60 + openMinute;
  const endMinutes = closeHour * 60 + closeMinute;

  for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
  }

  return slots;
};

/**
 * 日付を YYYY-MM-DD 形式の文字列に変換
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * 週の範囲テキストを生成
 */
export const formatWeekTitle = (weekStart: Date): string => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 〜 ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
};

/**
 * 7日分の日付配列を生成
 */
export const generateWeekDates = (weekStart: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });
};
