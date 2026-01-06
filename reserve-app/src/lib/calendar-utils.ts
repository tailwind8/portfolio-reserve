/**
 * カレンダー処理ユーティリティ
 *
 * このモジュールは、週間カレンダー表示で使用される共通ロジックを提供します。
 *
 * @module calendar-utils
 */

/**
 * 指定された週の開始日から7日分の日付配列を生成する
 *
 * @param weekStart - 週の開始日（通常は月曜日）
 * @returns 7日分のDate配列
 *
 * @example
 * ```typescript
 * const weekStart = new Date('2026-01-06'); // 月曜日
 * const dates = getWeekDates(weekStart);
 * // => [Mon Jan 06, Tue Jan 07, ..., Sun Jan 12]
 * ```
 */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + i);
    return date;
  });
}

/**
 * 週の範囲を表すテキストを生成する
 *
 * @param weekStart - 週の開始日
 * @returns 範囲テキスト（例: "2026年1月6日 〜 1月12日"）
 *
 * @example
 * ```typescript
 * const weekStart = new Date('2026-01-06');
 * getWeekRangeText(weekStart);
 * // => "2026年1月6日 〜 1月12日"
 * ```
 */
export function getWeekRangeText(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 〜 ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
}

/**
 * 指定された日付が定休日（日曜日）かどうかを判定する
 *
 * @param date - 判定する日付
 * @returns 定休日の場合true、それ以外はfalse
 *
 * @example
 * ```typescript
 * isClosedDay(new Date('2026-01-12')); // 日曜日 => true
 * isClosedDay(new Date('2026-01-06')); // 月曜日 => false
 * ```
 */
export function isClosedDay(date: Date): boolean {
  return date.getDay() === 0; // 0 = 日曜日
}

/**
 * 日付を "YYYY-MM-DD" 形式の文字列にフォーマットする
 *
 * @param date - フォーマットする日付
 * @returns "YYYY-MM-DD" 形式の文字列
 *
 * @example
 * ```typescript
 * formatDateToString(new Date('2026-01-06'));
 * // => "2026-01-06"
 * ```
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 曜日の日本語表示を取得する
 *
 * @param date - 曜日を取得する日付
 * @returns 日本語の曜日（例: "月", "火"）
 */
export function getDayOfWeekJa(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}
