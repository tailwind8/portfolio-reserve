import {
  sendReservationConfirmationEmail,
  sendReservationUpdateEmail,
  sendReservationCancellationEmail,
  type ReservationEmailData,
  type ReservationUpdateEmailData,
  type ReservationCancellationEmailData,
} from '@/lib/email';
import { mockSend } from '__mocks__/resend';

// Resendをモック化
jest.mock('resend');

describe('Email送信機能', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // 環境変数を保存
    originalEnv = { ...process.env };
    process.env.RESEND_API_KEY = 'test-api-key';
    process.env.RESEND_FROM_EMAIL = 'test@example.com';

    // mockSendをリセット
    mockSend.mockReset();
  });

  afterEach(() => {
    // 環境変数を復元
    process.env = originalEnv;
  });

  describe('sendReservationConfirmationEmail', () => {
    const testData: ReservationEmailData = {
      to: 'customer@example.com',
      userName: '田中太郎',
      menuName: 'カット＆カラー',
      staffName: '佐藤花子',
      reservedDate: '2025-01-15',
      reservedTime: '14:00',
      price: 5000,
      duration: 60,
      notes: '窓際の席を希望します',
    };

    test('正常に予約確認メールが送信される', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const result = await sendReservationConfirmationEmail(testData);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.from).toBe('test@example.com');
      expect(callArgs.to).toBe('customer@example.com');
      expect(callArgs.subject).toBe('【予約確認】ご予約ありがとうございます');
      expect(callArgs.html).toContain('予約確認');
      expect(callArgs.text).toContain('ご予約ありがとうございます');
      expect(result).toEqual({ id: 'test-email-id' });
    });

    test('HTMLメールに必要な情報が含まれる', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      await sendReservationConfirmationEmail(testData);

      const calledArgs = mockSend.mock.calls[0][0];
      expect(calledArgs.html).toContain('田中太郎');
      expect(calledArgs.html).toContain('カット＆カラー');
      expect(calledArgs.html).toContain('佐藤花子');
      expect(calledArgs.html).toContain('14:00');
      expect(calledArgs.html).toContain('¥5,000');
      expect(calledArgs.html).toContain('60分');
      expect(calledArgs.html).toContain('窓際の席を希望します');
    });

    test('テキストメールに必要な情報が含まれる', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      await sendReservationConfirmationEmail(testData);

      const calledArgs = mockSend.mock.calls[0][0];
      expect(calledArgs.text).toContain('田中太郎');
      expect(calledArgs.text).toContain('カット＆カラー');
      expect(calledArgs.text).toContain('佐藤花子');
      expect(calledArgs.text).toContain('14:00');
      expect(calledArgs.text).toContain('¥5,000');
      expect(calledArgs.text).toContain('60分');
      expect(calledArgs.text).toContain('窓際の席を希望します');
    });

    test('備考が無い場合でも正常に送信される', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const dataWithoutNotes = { ...testData, notes: undefined };
      const result = await sendReservationConfirmationEmail(dataWithoutNotes);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'test-email-id' });
    });

    test('メール送信エラーが発生した場合は例外をスローする', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'API Error' },
      });

      await expect(sendReservationConfirmationEmail(testData)).rejects.toThrow(
        'メール送信に失敗しました'
      );
    });

    test('Resend APIの例外が発生した場合は例外をスローする', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      await expect(sendReservationConfirmationEmail(testData)).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('sendReservationUpdateEmail', () => {
    const testData: ReservationUpdateEmailData = {
      to: 'customer@example.com',
      userName: '田中太郎',
      oldDate: '2025-01-15',
      oldTime: '14:00',
      oldMenuName: 'カット',
      oldStaffName: '佐藤花子',
      newDate: '2025-01-20',
      newTime: '16:00',
      newMenuName: 'カット＆カラー',
      newStaffName: '山田太郎',
    };

    test('正常に予約変更メールが送信される', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const result = await sendReservationUpdateEmail(testData);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.from).toBe('test@example.com');
      expect(callArgs.to).toBe('customer@example.com');
      expect(callArgs.subject).toBe('【予約変更完了】ご予約内容が変更されました');
      expect(callArgs.html).toContain('予約変更完了');
      expect(callArgs.text).toContain('ご予約内容が変更されました');
      expect(result).toEqual({ id: 'test-email-id' });
    });

    test('HTMLメールに変更前後の情報が含まれる', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      await sendReservationUpdateEmail(testData);

      const calledArgs = mockSend.mock.calls[0][0];
      // 変更前
      expect(calledArgs.html).toContain('カット');
      expect(calledArgs.html).toContain('14:00');
      expect(calledArgs.html).toContain('佐藤花子');
      // 変更後
      expect(calledArgs.html).toContain('カット＆カラー');
      expect(calledArgs.html).toContain('16:00');
      expect(calledArgs.html).toContain('山田太郎');
    });

    test('テキストメールに変更前後の情報が含まれる', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      await sendReservationUpdateEmail(testData);

      const calledArgs = mockSend.mock.calls[0][0];
      // 変更前
      expect(calledArgs.text).toContain('カット');
      expect(calledArgs.text).toContain('14:00');
      expect(calledArgs.text).toContain('佐藤花子');
      // 変更後
      expect(calledArgs.text).toContain('カット＆カラー');
      expect(calledArgs.text).toContain('16:00');
      expect(calledArgs.text).toContain('山田太郎');
    });

    test('メール送信エラーが発生した場合は例外をスローする', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'API Error' },
      });

      await expect(sendReservationUpdateEmail(testData)).rejects.toThrow(
        'メール送信に失敗しました'
      );
    });
  });

  describe('sendReservationCancellationEmail', () => {
    const testData: ReservationCancellationEmailData = {
      to: 'customer@example.com',
      userName: '田中太郎',
      date: '2025-01-15',
      time: '14:00',
      menuName: 'カット＆カラー',
      staffName: '佐藤花子',
      cancellationReason: '体調不良のため',
    };

    test('正常に予約キャンセルメールが送信される', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const result = await sendReservationCancellationEmail(testData);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.from).toBe('test@example.com');
      expect(callArgs.to).toBe('customer@example.com');
      expect(callArgs.subject).toBe('【予約キャンセル完了】ご予約がキャンセルされました');
      expect(callArgs.html).toContain('予約キャンセル完了');
      expect(callArgs.text).toContain('ご予約がキャンセルされました');
      expect(result).toEqual({ id: 'test-email-id' });
    });

    test('HTMLメールに必要な情報が含まれる', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      await sendReservationCancellationEmail(testData);

      const calledArgs = mockSend.mock.calls[0][0];
      expect(calledArgs.html).toContain('田中太郎');
      expect(calledArgs.html).toContain('カット＆カラー');
      expect(calledArgs.html).toContain('佐藤花子');
      expect(calledArgs.html).toContain('14:00');
      expect(calledArgs.html).toContain('体調不良のため');
    });

    test('テキストメールに必要な情報が含まれる', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      await sendReservationCancellationEmail(testData);

      const calledArgs = mockSend.mock.calls[0][0];
      expect(calledArgs.text).toContain('田中太郎');
      expect(calledArgs.text).toContain('カット＆カラー');
      expect(calledArgs.text).toContain('佐藤花子');
      expect(calledArgs.text).toContain('14:00');
      expect(calledArgs.text).toContain('体調不良のため');
    });

    test('キャンセル理由が無い場合でも正常に送信される', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const dataWithoutReason = { ...testData, cancellationReason: undefined };
      const result = await sendReservationCancellationEmail(dataWithoutReason);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'test-email-id' });
    });

    test('メール送信エラーが発生した場合は例外をスローする', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'API Error' },
      });

      await expect(sendReservationCancellationEmail(testData)).rejects.toThrow(
        'メール送信に失敗しました'
      );
    });
  });

  describe('環境変数', () => {
    test('RESEND_FROM_EMAILが設定されていない場合はデフォルト値を使用', async () => {
      delete process.env.RESEND_FROM_EMAIL;
      mockSend.mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      });

      const testData: ReservationEmailData = {
        to: 'customer@example.com',
        userName: '田中太郎',
        menuName: 'カット',
        staffName: '佐藤花子',
        reservedDate: '2025-01-15',
        reservedTime: '14:00',
        price: 3000,
        duration: 30,
      };

      await sendReservationConfirmationEmail(testData);

      const callArgs = mockSend.mock.calls[0][0];
      expect(callArgs.from).toBe('onboarding@resend.dev');
    });
  });
});
