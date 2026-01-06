/**
 * 時間処理ユーティリティ
 *
 * このモジュールは、予約システム全体で使用される時間処理の共通ロジックを提供します。
 *
 * @module time-utils
 */

/**
 * パースされた時間を表す型
 */
export interface ParsedTime {
  hour: number;
  minute: number;
}

/**
 * 時間文字列（HH:MM形式）をパースして時と分を返す
 *
 * @param time - "HH:MM" 形式の時間文字列（例: "09:30", "14:45"）
 * @returns パースされた時と分を含むオブジェクト
 * @throws {Error} 不正な時間フォーマットの場合
 *
 * @example
 * ```typescript
 * const { hour, minute } = parseTimeString('09:30');
 * // => { hour: 9, minute: 30 }
 * ```
 */
export function parseTimeString(time: string): ParsedTime {
  // フォーマット検証
  if (!isValidTimeFormat(time)) {
    throw new Error('Invalid time format: expected HH:MM format');
  }

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  // 数値変換の検証
  if (isNaN(hour) || isNaN(minute)) {
    throw new Error('Invalid time format: hour or minute is not a number');
  }

  // 範囲検証
  if (hour < 0 || hour > 23) {
    throw new Error('Invalid time format: hour must be between 0 and 23');
  }

  if (minute < 0 || minute > 59) {
    throw new Error('Invalid time format: minute must be between 0 and 59');
  }

  return { hour, minute };
}

/**
 * 時間文字列を0時0分からの経過分数に変換する
 *
 * @param time - "HH:MM" 形式の時間文字列
 * @returns 0時0分からの経過分数
 * @throws {Error} 不正な時間フォーマットの場合
 *
 * @example
 * ```typescript
 * minutesSinceStartOfDay('09:30'); // => 570 (9 * 60 + 30)
 * minutesSinceStartOfDay('14:45'); // => 885 (14 * 60 + 45)
 * ```
 */
export function minutesSinceStartOfDay(time: string): number {
  const { hour, minute } = parseTimeString(time);
  return hour * 60 + minute;
}

/**
 * 0時0分からの経過分数を時間文字列（HH:MM形式）に変換する
 *
 * @param minutes - 0時0分からの経過分数
 * @returns "HH:MM" 形式の時間文字列
 * @throws {Error} 負の値または1440以上の値の場合
 *
 * @example
 * ```typescript
 * formatMinutesToTime(570); // => "09:30"
 * formatMinutesToTime(885); // => "14:45"
 * ```
 */
export function formatMinutesToTime(minutes: number): string {
  if (minutes < 0) {
    throw new Error('Minutes must be non-negative');
  }

  if (minutes >= 1440) {
    // 1日 = 24時間 = 1440分
    throw new Error('Minutes must be less than 1440 (24 hours)');
  }

  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * 時間文字列が有効なHH:MM形式であるかを検証する
 *
 * @param time - 検証する時間文字列
 * @returns 有効な形式の場合true、それ以外はfalse
 *
 * @example
 * ```typescript
 * isValidTimeFormat('09:30'); // => true
 * isValidTimeFormat('25:00'); // => false
 * isValidTimeFormat('12:60'); // => false
 * ```
 */
export function isValidTimeFormat(time: string): boolean {
  // 基本的なフォーマット検証（正規表現）
  const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return timeRegex.test(time);
}

/**
 * 2つの時間範囲が重複しているかを判定する
 *
 * @param start1Minutes - 範囲1の開始時刻（分数）
 * @param end1Minutes - 範囲1の終了時刻（分数）
 * @param start2Minutes - 範囲2の開始時刻（分数）
 * @param end2Minutes - 範囲2の終了時刻（分数）
 * @returns 重複している場合true、それ以外はfalse
 *
 * @example
 * ```typescript
 * // 9:00-10:00 と 9:30-10:30 は重複
 * hasTimeOverlap(540, 600, 570, 630); // => true
 *
 * // 9:00-10:00 と 10:00-11:00 は重複しない（境界は含まない）
 * hasTimeOverlap(540, 600, 600, 660); // => false
 * ```
 */
export function hasTimeOverlap(
  start1Minutes: number,
  end1Minutes: number,
  start2Minutes: number,
  end2Minutes: number
): boolean {
  return (
    (start1Minutes >= start2Minutes && start1Minutes < end2Minutes) ||
    (end1Minutes > start2Minutes && end1Minutes <= end2Minutes) ||
    (start1Minutes <= start2Minutes && end1Minutes >= end2Minutes)
  );
}

/**
 * 指定された時間が休憩時間内かどうかを判定する
 *
 * @param time - 判定する時間（HH:MM形式）
 * @param breakStart - 休憩開始時間（HH:MM形式）
 * @param breakEnd - 休憩終了時間（HH:MM形式）
 * @returns 休憩時間内の場合true
 *
 * @example
 * ```typescript
 * isBreakTime('12:30', '12:00', '13:00'); // => true
 * isBreakTime('14:00', '12:00', '13:00'); // => false
 * ```
 */
export function isBreakTime(
  time: string,
  breakStart: string,
  breakEnd: string
): boolean {
  const timeMinutes = minutesSinceStartOfDay(time);
  const breakStartMinutes = minutesSinceStartOfDay(breakStart);
  const breakEndMinutes = minutesSinceStartOfDay(breakEnd);
  return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes;
}

/**
 * 営業時間内の時間スロットを生成する
 *
 * @param openTime - 開店時間（HH:MM形式）
 * @param closeTime - 閉店時間（HH:MM形式）
 * @param intervalMinutes - スロット間隔（分）、デフォルト30分
 * @returns 時間スロットの配列
 *
 * @example
 * ```typescript
 * generateTimeSlots('09:00', '12:00'); // => ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
 * generateTimeSlots('09:00', '11:00', 60); // => ['09:00', '10:00']
 * ```
 */
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number = 30
): string[] {
  const startMinutes = minutesSinceStartOfDay(openTime);
  const endMinutes = minutesSinceStartOfDay(closeTime);
  const slots: string[] = [];

  for (let minutes = startMinutes; minutes < endMinutes; minutes += intervalMinutes) {
    slots.push(formatMinutesToTime(minutes));
  }

  return slots;
}
