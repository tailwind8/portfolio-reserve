/**
 * calendar-utils.ts のユニットテスト
 *
 * カレンダー処理ユーティリティ関数のテスト
 */

import {
  getWeekDates,
  getWeekRangeText,
  isClosedDay,
  formatDateToString,
  getDayOfWeekJa,
} from '@/lib/calendar-utils';

describe('calendar-utils', () => {
  describe('getWeekDates', () => {
    it('指定された日付から7日分の日付配列を生成する', () => {
      const weekStart = new Date('2026-01-06');
      const result = getWeekDates(weekStart);

      expect(result).toHaveLength(7);
      expect(result[0].getDate()).toBe(6);
      expect(result[1].getDate()).toBe(7);
      expect(result[2].getDate()).toBe(8);
      expect(result[3].getDate()).toBe(9);
      expect(result[4].getDate()).toBe(10);
      expect(result[5].getDate()).toBe(11);
      expect(result[6].getDate()).toBe(12);
    });

    it('月をまたぐ場合も正しく処理する', () => {
      const weekStart = new Date('2026-01-29');
      const result = getWeekDates(weekStart);

      expect(result).toHaveLength(7);
      expect(result[0].getDate()).toBe(29);
      expect(result[1].getDate()).toBe(30);
      expect(result[2].getDate()).toBe(31);
      expect(result[3].getDate()).toBe(1);
      expect(result[3].getMonth()).toBe(1); // 2月
    });

    it('年をまたぐ場合も正しく処理する', () => {
      const weekStart = new Date('2025-12-29');
      const result = getWeekDates(weekStart);

      expect(result).toHaveLength(7);
      expect(result[0].getFullYear()).toBe(2025);
      expect(result[2].getDate()).toBe(31);
      expect(result[3].getDate()).toBe(1);
      expect(result[3].getFullYear()).toBe(2026);
    });

    it('元の日付オブジェクトを変更しない', () => {
      const weekStart = new Date('2026-01-06');
      const originalDate = weekStart.getDate();
      getWeekDates(weekStart);

      expect(weekStart.getDate()).toBe(originalDate);
    });
  });

  describe('getWeekRangeText', () => {
    it('週の日付範囲をテキスト形式で生成する', () => {
      const weekStart = new Date('2026-01-06');
      const result = getWeekRangeText(weekStart);

      expect(result).toBe('2026/01/06 - 2026/01/12');
    });

    it('月をまたぐ場合も正しく表示する', () => {
      const weekStart = new Date('2026-01-29');
      const result = getWeekRangeText(weekStart);

      expect(result).toBe('2026/01/29 - 2026/02/04');
    });

    it('年をまたぐ場合も正しく表示する', () => {
      const weekStart = new Date('2025-12-29');
      const result = getWeekRangeText(weekStart);

      expect(result).toBe('2025/12/29 - 2026/01/04');
    });

    it('1桁の月日を0埋めする', () => {
      const weekStart = new Date('2026-01-01');
      const result = getWeekRangeText(weekStart);

      expect(result).toBe('2026/01/01 - 2026/01/07');
    });
  });

  describe('isClosedDay', () => {
    it('日曜日の場合trueを返す', () => {
      const sunday = new Date('2026-01-04'); // 日曜日
      expect(isClosedDay(sunday)).toBe(true);
    });

    it('月曜日の場合falseを返す', () => {
      const monday = new Date('2026-01-05'); // 月曜日
      expect(isClosedDay(monday)).toBe(false);
    });

    it('火曜日の場合falseを返す', () => {
      const tuesday = new Date('2026-01-06'); // 火曜日
      expect(isClosedDay(tuesday)).toBe(false);
    });

    it('土曜日の場合falseを返す', () => {
      const saturday = new Date('2026-01-03'); // 土曜日
      expect(isClosedDay(saturday)).toBe(false);
    });
  });

  describe('formatDateToString', () => {
    it('日付をYYYY-MM-DD形式に変換する', () => {
      const date = new Date('2026-01-06');
      expect(formatDateToString(date)).toBe('2026-01-06');
    });

    it('1桁の月日を0埋めする', () => {
      const date = new Date('2026-01-01');
      expect(formatDateToString(date)).toBe('2026-01-01');
    });

    it('12月の日付を正しく変換する', () => {
      const date = new Date('2025-12-25');
      expect(formatDateToString(date)).toBe('2025-12-25');
    });

    it('月末の日付を正しく変換する', () => {
      const date = new Date('2026-01-31');
      expect(formatDateToString(date)).toBe('2026-01-31');
    });
  });

  describe('getDayOfWeekJa', () => {
    it('日曜日を「日」と返す', () => {
      const sunday = new Date('2026-01-04');
      expect(getDayOfWeekJa(sunday)).toBe('日');
    });

    it('月曜日を「月」と返す', () => {
      const monday = new Date('2026-01-05');
      expect(getDayOfWeekJa(monday)).toBe('月');
    });

    it('火曜日を「火」と返す', () => {
      const tuesday = new Date('2026-01-06');
      expect(getDayOfWeekJa(tuesday)).toBe('火');
    });

    it('水曜日を「水」と返す', () => {
      const wednesday = new Date('2026-01-07');
      expect(getDayOfWeekJa(wednesday)).toBe('水');
    });

    it('木曜日を「木」と返す', () => {
      const thursday = new Date('2026-01-08');
      expect(getDayOfWeekJa(thursday)).toBe('木');
    });

    it('金曜日を「金」と返す', () => {
      const friday = new Date('2026-01-09');
      expect(getDayOfWeekJa(friday)).toBe('金');
    });

    it('土曜日を「土」と返す', () => {
      const saturday = new Date('2026-01-10');
      expect(getDayOfWeekJa(saturday)).toBe('土');
    });
  });
});
