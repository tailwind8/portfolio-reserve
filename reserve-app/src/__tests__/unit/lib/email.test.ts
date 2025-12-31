// Mock Resend module before importing functions
const mockSend = jest.fn();

jest.mock('resend', () => {
  return {
    Resend: jest.fn().mockImplementation(() => {
      return {
        emails: {
          send: mockSend,
        },
      };
    }),
  };
});

import {
  sendReservationConfirmationEmail,
  sendReservationUpdateEmail,
  sendReservationCancellationEmail,
} from '@/lib/email';

describe('Email Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendReservationConfirmationEmail', () => {
    it('should send confirmation email with correct data', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-1' }, error: null });

      const emailData = {
        to: 'test@example.com',
        userName: '山田太郎',
        menuName: 'カット',
        staffName: '田中花子',
        reservedDate: '2025-12-25',
        reservedTime: '14:00',
        price: 5000,
        duration: 60,
        notes: 'テスト備考',
      };

      await sendReservationConfirmationEmail(emailData);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: '【予約確認】ご予約ありがとうございます',
        })
      );
    });

    it('should throw error when email sending fails', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Failed to send email' },
      });

      const emailData = {
        to: 'test@example.com',
        userName: '山田太郎',
        menuName: 'カット',
        staffName: '田中花子',
        reservedDate: '2025-12-25',
        reservedTime: '14:00',
        price: 5000,
        duration: 60,
      };

      await expect(sendReservationConfirmationEmail(emailData)).rejects.toThrow(
        'メール送信に失敗しました'
      );
    });
  });

  describe('sendReservationUpdateEmail', () => {
    it('should send update email with correct data', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-2' }, error: null });

      const emailData = {
        to: 'test@example.com',
        userName: '山田太郎',
        menuName: 'カット',
        staffName: '田中花子',
        reservedDate: '2025-12-25',
        reservedTime: '15:00',
        price: 5000,
        duration: 60,
      };

      await sendReservationUpdateEmail(emailData);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: '【予約変更完了】予約内容が変更されました',
        })
      );
    });

    it('should throw error when email sending fails', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Failed to send email' },
      });

      const emailData = {
        to: 'test@example.com',
        userName: '山田太郎',
        menuName: 'カット',
        staffName: '田中花子',
        reservedDate: '2025-12-25',
        reservedTime: '15:00',
        price: 5000,
        duration: 60,
      };

      await expect(sendReservationUpdateEmail(emailData)).rejects.toThrow(
        '変更確認メール送信に失敗しました'
      );
    });
  });

  describe('sendReservationCancellationEmail', () => {
    it('should send cancellation email with correct data', async () => {
      mockSend.mockResolvedValue({ data: { id: 'email-3' }, error: null });

      const emailData = {
        to: 'test@example.com',
        userName: '山田太郎',
        menuName: 'カット',
        staffName: '田中花子',
        reservedDate: '2025-12-25',
        reservedTime: '14:00',
        price: 5000,
        duration: 60,
      };

      await sendReservationCancellationEmail(emailData);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: '【予約キャンセル完了】予約がキャンセルされました',
        })
      );
    });

    it('should throw error when email sending fails', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Failed to send email' },
      });

      const emailData = {
        to: 'test@example.com',
        userName: '山田太郎',
        menuName: 'カット',
        staffName: '田中花子',
        reservedDate: '2025-12-25',
        reservedTime: '14:00',
        price: 5000,
        duration: 60,
      };

      await expect(sendReservationCancellationEmail(emailData)).rejects.toThrow(
        'キャンセル確認メール送信に失敗しました'
      );
    });
  });
});
