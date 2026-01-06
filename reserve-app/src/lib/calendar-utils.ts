/**
 * カレンダー処理ユーティリティ
 *
 * このモジュールは、週間カレンダー表示に使用される共通ロジックを提供します。
 *
 * @module calendar-utils
 */

/**
 * 指定された週の開始日から7日分の日付配列を生成する
 *
 * @param weekStart - 週の開始日（通常は月曜日）
 * @returns 7日分のDateオブジェクト配列
 *
 * @example
 * ```typescript
 * const dates = getWeekDates(new Date('2026-01-06'));
 * // => [2026-01-06, 2026-01-07, ..., 2026-01-12]
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
 * 週の日付範囲をテキスト形式で生成する（例: "2026/01/06 - 2026/01/12"）
 *
 * @param weekStart - 週の開始日
 * @returns 日付範囲を表す文字列
 *
 * @example
 * ```typescript
 * getWeekRangeText(new Date('2026-01-06')); // => "2026/01/06 - 2026/01/12"
 * ```
 */
export function getWeekRangeText(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
}

/**
 * 指定された日付が定休日（日曜日）かどうかを判定する
 *
 * @param date - 判定する日付
 * @returns 日曜日の場合true
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
 * 日付をYYYY-MM-DD形式の文字列に変換する
 *
 * @param date - 変換する日付
 * @returns YYYY-MM-DD形式の文字列
 *
 * @example
 * ```typescript
 * formatDateToString(new Date('2026-01-06')); // => "2026-01-06"
 * ```
 */
export function formatDateToString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 曜日の日本語名を取得する
 *
 * @param date - 対象の日付
 * @returns 曜日の日本語名（月、火、水、木、金、土、日）
 *
 * @example
 * ```typescript
 * getDayOfWeekJa(new Date('2026-01-06')); // 月曜日 => "月"
 * getDayOfWeekJa(new Date('2026-01-11')); // 土曜日 => "土"
 * ```
 */
export function getDayOfWeekJa(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}
