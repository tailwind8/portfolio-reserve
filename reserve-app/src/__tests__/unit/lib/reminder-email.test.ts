/**
 * reminder-email.ts のユニットテスト
 *
 * リマインダーメールテンプレート生成関数のテスト
 */

import {
  getReminderEmailSubject,
  getReminderEmailHtml,
  getReminderEmailText,
  type ReminderEmailData,
} from '@/lib/email/templates/reminder-email';

describe('reminder-email', () => {
  const mockData: ReminderEmailData = {
    customerName: '田中太郎',
    reservedDate: '2025-01-15',
    reservedTime: '14:00',
    menuName: 'カット',
    staffName: '佐藤花子',
    myPageUrl: 'https://example.com/mypage',
  };

  const mockDataWithoutStaff: ReminderEmailData = {
    customerName: '山田次郎',
    reservedDate: '2025-03-20',
    reservedTime: '10:30',
    menuName: 'カラーリング',
    myPageUrl: 'https://example.com/mypage/123',
  };

  describe('getReminderEmailSubject', () => {
    it('should return the correct subject', () => {
      expect(getReminderEmailSubject()).toBe(
        '【予約リマインダー】明日のご予約について'
      );
    });

    it('should return a non-empty string', () => {
      const subject = getReminderEmailSubject();
      expect(subject.length).toBeGreaterThan(0);
    });

    it('should always return the same value', () => {
      expect(getReminderEmailSubject()).toBe(getReminderEmailSubject());
    });
  });

  describe('getReminderEmailHtml', () => {
    describe('with staff name', () => {
      let html: string;

      beforeAll(() => {
        html = getReminderEmailHtml(mockData);
      });

      it('should include customer name', () => {
        expect(html).toContain('田中太郎');
      });

      it('should include formatted date', () => {
        // 2025-01-15 → 2025年1月15日
        expect(html).toContain('2025年1月15日');
      });

      it('should include reserved time', () => {
        expect(html).toContain('14:00');
      });

      it('should include menu name', () => {
        expect(html).toContain('カット');
      });

      it('should include staff name', () => {
        expect(html).toContain('佐藤花子');
      });

      it('should include mypage URL', () => {
        expect(html).toContain('https://example.com/mypage');
      });

      it('should include DOCTYPE declaration', () => {
        expect(html).toContain('<!DOCTYPE html>');
      });

      it('should include html tag with lang="ja"', () => {
        expect(html).toContain('<html lang="ja">');
      });

      it('should include リマインダー header', () => {
        expect(html).toContain('予約リマインダー');
      });

      it('should include staff label', () => {
        expect(html).toContain('担当スタッフ');
      });

      it('should include cancel information', () => {
        expect(html).toContain('キャンセル');
      });

      it('should include button link to mypage', () => {
        expect(html).toContain('href="https://example.com/mypage"');
      });

      it('should include footer copyright', () => {
        expect(html).toContain('© 2025 Demo Booking');
      });
    });

    describe('without staff name', () => {
      let html: string;

      beforeAll(() => {
        html = getReminderEmailHtml(mockDataWithoutStaff);
      });

      it('should include customer name', () => {
        expect(html).toContain('山田次郎');
      });

      it('should include formatted date', () => {
        // 2025-03-20 → 2025年3月20日
        expect(html).toContain('2025年3月20日');
      });

      it('should include reserved time', () => {
        expect(html).toContain('10:30');
      });

      it('should include menu name', () => {
        expect(html).toContain('カラーリング');
      });

      it('should not include staff section when staff is not provided', () => {
        // スタッフ名がない場合、担当スタッフセクションは表示されない
        expect(html).not.toContain('担当スタッフ');
      });

      it('should include mypage URL', () => {
        expect(html).toContain('https://example.com/mypage/123');
      });
    });

    describe('date formatting', () => {
      it.each([
        ['2025-01-01', '2025年1月1日'],
        ['2025-12-31', '2025年12月31日'],
        ['2025-06-15', '2025年6月15日'],
        ['2025-10-05', '2025年10月5日'],
      ])('should format date %s as %s', (inputDate, expectedFormat) => {
        const data: ReminderEmailData = {
          ...mockData,
          reservedDate: inputDate,
        };
        const html = getReminderEmailHtml(data);
        expect(html).toContain(expectedFormat);
      });
    });

    describe('HTML structure', () => {
      it('should return trimmed HTML', () => {
        const html = getReminderEmailHtml(mockData);
        expect(html.startsWith('<!DOCTYPE')).toBe(true);
        expect(html.endsWith('</html>')).toBe(true);
      });

      it('should include proper CSS styles', () => {
        const html = getReminderEmailHtml(mockData);
        expect(html).toContain('<style>');
        expect(html).toContain('</style>');
      });

      it('should include reservation details section', () => {
        const html = getReminderEmailHtml(mockData);
        expect(html).toContain('class="reservation-details"');
      });

      it('should include important notice section', () => {
        const html = getReminderEmailHtml(mockData);
        expect(html).toContain('class="important"');
      });
    });
  });

  describe('getReminderEmailText', () => {
    describe('with staff name', () => {
      let text: string;

      beforeAll(() => {
        text = getReminderEmailText(mockData);
      });

      it('should include customer name', () => {
        expect(text).toContain('田中太郎');
      });

      it('should include formatted date', () => {
        expect(text).toContain('2025年1月15日');
      });

      it('should include reserved time', () => {
        expect(text).toContain('14:00');
      });

      it('should include menu name', () => {
        expect(text).toContain('カット');
      });

      it('should include staff name', () => {
        expect(text).toContain('佐藤花子');
      });

      it('should include staff label', () => {
        expect(text).toContain('担当スタッフ');
      });

      it('should include mypage URL', () => {
        expect(text).toContain('https://example.com/mypage');
      });

      it('should include subject line', () => {
        expect(text).toContain('【予約リマインダー】明日のご予約について');
      });

      it('should include cancel information', () => {
        expect(text).toContain('キャンセル');
      });

      it('should include footer', () => {
        expect(text).toContain('このメールは自動送信されています');
      });

      it('should include copyright', () => {
        expect(text).toContain('© 2025 Demo Booking');
      });
    });

    describe('without staff name', () => {
      let text: string;

      beforeAll(() => {
        text = getReminderEmailText(mockDataWithoutStaff);
      });

      it('should include customer name', () => {
        expect(text).toContain('山田次郎');
      });

      it('should include formatted date', () => {
        expect(text).toContain('2025年3月20日');
      });

      it('should include reserved time', () => {
        expect(text).toContain('10:30');
      });

      it('should include menu name', () => {
        expect(text).toContain('カラーリング');
      });

      it('should not include staff line when staff is not provided', () => {
        expect(text).not.toContain('担当スタッフ');
      });

      it('should include mypage URL', () => {
        expect(text).toContain('https://example.com/mypage/123');
      });
    });

    describe('date formatting', () => {
      it.each([
        ['2025-01-01', '2025年1月1日'],
        ['2025-12-31', '2025年12月31日'],
        ['2025-06-15', '2025年6月15日'],
        ['2025-10-05', '2025年10月5日'],
      ])('should format date %s as %s', (inputDate, expectedFormat) => {
        const data: ReminderEmailData = {
          ...mockData,
          reservedDate: inputDate,
        };
        const text = getReminderEmailText(data);
        expect(text).toContain(expectedFormat);
      });
    });

    describe('text structure', () => {
      it('should return trimmed text', () => {
        const text = getReminderEmailText(mockData);
        expect(text.startsWith('【')).toBe(true);
      });

      it('should include section dividers', () => {
        const text = getReminderEmailText(mockData);
        expect(text).toContain('━━━━━━━━━━');
      });

      it('should include reservation content section', () => {
        const text = getReminderEmailText(mockData);
        expect(text).toContain('📅 ご予約内容');
      });
    });
  });

  describe('consistency between HTML and text', () => {
    it('should have same customer name in both formats', () => {
      const html = getReminderEmailHtml(mockData);
      const text = getReminderEmailText(mockData);
      expect(html).toContain(mockData.customerName);
      expect(text).toContain(mockData.customerName);
    });

    it('should have same date format in both formats', () => {
      const html = getReminderEmailHtml(mockData);
      const text = getReminderEmailText(mockData);
      expect(html).toContain('2025年1月15日');
      expect(text).toContain('2025年1月15日');
    });

    it('should have same time in both formats', () => {
      const html = getReminderEmailHtml(mockData);
      const text = getReminderEmailText(mockData);
      expect(html).toContain(mockData.reservedTime);
      expect(text).toContain(mockData.reservedTime);
    });

    it('should have same menu name in both formats', () => {
      const html = getReminderEmailHtml(mockData);
      const text = getReminderEmailText(mockData);
      expect(html).toContain(mockData.menuName);
      expect(text).toContain(mockData.menuName);
    });

    it('should have same mypage URL in both formats', () => {
      const html = getReminderEmailHtml(mockData);
      const text = getReminderEmailText(mockData);
      expect(html).toContain(mockData.myPageUrl);
      expect(text).toContain(mockData.myPageUrl);
    });
  });

  describe('edge cases', () => {
    it('should handle long customer name', () => {
      const data: ReminderEmailData = {
        ...mockData,
        customerName: 'とても長い名前の顧客様でございます',
      };
      const html = getReminderEmailHtml(data);
      const text = getReminderEmailText(data);
      expect(html).toContain('とても長い名前の顧客様でございます');
      expect(text).toContain('とても長い名前の顧客様でございます');
    });

    it('should handle long menu name', () => {
      const data: ReminderEmailData = {
        ...mockData,
        menuName: 'カット + カラーリング + トリートメント + ヘッドスパ',
      };
      const html = getReminderEmailHtml(data);
      const text = getReminderEmailText(data);
      expect(html).toContain(
        'カット + カラーリング + トリートメント + ヘッドスパ'
      );
      expect(text).toContain(
        'カット + カラーリング + トリートメント + ヘッドスパ'
      );
    });

    it('should handle URL with query parameters', () => {
      const data: ReminderEmailData = {
        ...mockData,
        myPageUrl: 'https://example.com/mypage?id=123&token=abc',
      };
      const html = getReminderEmailHtml(data);
      const text = getReminderEmailText(data);
      expect(html).toContain('https://example.com/mypage?id=123&token=abc');
      expect(text).toContain('https://example.com/mypage?id=123&token=abc');
    });

    it('should handle midnight time', () => {
      const data: ReminderEmailData = {
        ...mockData,
        reservedTime: '00:00',
      };
      const html = getReminderEmailHtml(data);
      const text = getReminderEmailText(data);
      expect(html).toContain('00:00');
      expect(text).toContain('00:00');
    });

    it('should handle late evening time', () => {
      const data: ReminderEmailData = {
        ...mockData,
        reservedTime: '23:59',
      };
      const html = getReminderEmailHtml(data);
      const text = getReminderEmailText(data);
      expect(html).toContain('23:59');
      expect(text).toContain('23:59');
    });
  });
});
