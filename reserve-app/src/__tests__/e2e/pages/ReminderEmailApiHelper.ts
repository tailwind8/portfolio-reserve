import { Page, expect, APIRequestContext } from '@playwright/test';

/**
 * リマインダーメールAPI用のヘルパークラス
 * Cron Job APIのテストをサポート
 */
export class ReminderEmailApiHelper {
  constructor(
    private page: Page,
    private request: APIRequestContext
  ) {}

  /**
   * リマインダーメール送信APIを呼び出す
   * @param authToken 認証トークン（オプション）
   * @returns APIレスポンス
   */
  async sendReminders(authToken?: string) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await this.request.get(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cron/send-reminders`,
      { headers }
    );

    return response;
  }

  /**
   * APIレスポンスのステータスコードを検証
   */
  async expectStatusCode(response: Awaited<ReturnType<APIRequestContext['get']>>, expectedStatus: number) {
    expect(response.status()).toBe(expectedStatus);
  }

  /**
   * APIレスポンスボディに特定のテキストが含まれることを検証
   */
  async expectResponseContains(response: Awaited<ReturnType<APIRequestContext['get']>>, expectedText: string) {
    const body = await response.json();
    const bodyString = JSON.stringify(body);
    expect(bodyString).toContain(expectedText);
  }

  /**
   * APIレスポンスの送信件数を検証
   */
  async expectSentCount(response: Awaited<ReturnType<APIRequestContext['get']>>, expectedCount: number) {
    const body = (await response.json()) as { sent: number };
    expect(body.sent).toBe(expectedCount);
  }

  /**
   * APIレスポンスの成功件数を検証
   */
  async expectSuccessCount(response: Awaited<ReturnType<APIRequestContext['get']>>, expectedCount: number) {
    const body = (await response.json()) as { success: number };
    expect(body.success).toBe(expectedCount);
  }

  /**
   * APIレスポンスの失敗件数を検証
   */
  async expectFailureCount(response: Awaited<ReturnType<APIRequestContext['get']>>, expectedCount: number) {
    const body = (await response.json()) as { failure: number };
    expect(body.failure).toBe(expectedCount);
  }

  /**
   * メール送信内容を検証（MSWモックを使用）
   * @param recipient 受信者メールアドレス
   */
  async expectEmailSent(recipient: string) {
    // MSWでモックされたメール送信をブラウザコンテキストから確認
    const emailSent = await this.page.evaluate(
      (email) => {
        // @ts-expect-error - グローバル変数（MSWでセット）
        return window.__TEST_EMAILS__?.some((e: { to: string }) => e.to === email);
      },
      recipient
    );
    expect(emailSent).toBe(true);
  }

  /**
   * メール件名を検証
   */
  async expectEmailSubject(subject: string) {
    const emailFound = await this.page.evaluate(
      (expectedSubject) => {
        // @ts-expect-error - グローバル変数（MSWでセット）
        return window.__TEST_EMAILS__?.some((e: { subject: string }) => e.subject === expectedSubject);
      },
      subject
    );
    expect(emailFound).toBe(true);
  }

  /**
   * メール本文に特定のテキストが含まれることを検証
   */
  async expectEmailBodyContains(recipient: string, expectedText: string) {
    const bodyContains = await this.page.evaluate(
      ({ email, text }) => {
        // @ts-expect-error - グローバル変数（MSWでセット）
        const emailData = window.__TEST_EMAILS__?.find((e: { to: string }) => e.to === email) as { html?: string; text?: string } | undefined;
        return emailData?.html?.includes(text) || emailData?.text?.includes(text);
      },
      { email: recipient, text: expectedText }
    );
    expect(bodyContains).toBe(true);
  }

  /**
   * 送信されたメールの総数を検証
   */
  async expectTotalEmailsSent(expectedCount: number) {
    const count = await this.page.evaluate(() => {
      // @ts-expect-error - グローバル変数（MSWでセット）
      return window.__TEST_EMAILS__?.length || 0;
    });
    expect(count).toBe(expectedCount);
  }

  /**
   * メール送信履歴をリセット
   */
  async resetEmailHistory() {
    await this.page.evaluate(() => {
      // @ts-expect-error - グローバル変数（MSWでセット）
      window.__TEST_EMAILS__ = [];
    });
  }

  /**
   * データベースの予約にリマインダー送信済みフラグが立っていることを検証
   * 注: 実際の実装ではPrismaクライアントを使用してDBを直接確認
   */
  async expectReminderSentFlag(reservationId: string, expectedValue: boolean = true) {
    // この実装はE2Eテストでは直接DBにアクセスできないため、
    // APIレスポンスまたはモックデータで確認する必要がある
    // 実装時にはPrismaを使った確認ロジックを追加
    const response = await this.request.get(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reservations/${reservationId}`
    );
    const data = await response.json();
    expect(data.reminderSent).toBe(expectedValue);
  }

  /**
   * 翌日の予約を作成するヘルパー（テストデータセットアップ用）
   */
  async createTomorrowReservation(customerData: {
    name: string;
    email: string;
    menuName: string;
    time: string;
    staffName?: string;
  }) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(customerData.time.split(':')[0]), parseInt(customerData.time.split(':')[1]), 0, 0);

    const response = await this.request.post(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test/create-reservation`,
      {
        data: {
          customerName: customerData.name,
          customerEmail: customerData.email,
          menuName: customerData.menuName,
          dateTime: tomorrow.toISOString(),
          staffName: customerData.staffName,
          status: 'confirmed',
          reminderSent: false,
        },
      }
    );

    return response;
  }

  /**
   * キャンセル済み予約を作成するヘルパー
   */
  async createCancelledReservation(customerData: {
    name: string;
    email: string;
  }) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await this.request.post(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test/create-reservation`,
      {
        data: {
          customerName: customerData.name,
          customerEmail: customerData.email,
          dateTime: tomorrow.toISOString(),
          status: 'cancelled',
          reminderSent: false,
        },
      }
    );

    return response;
  }

  /**
   * リマインダー送信済みの予約を作成するヘルパー
   */
  async createReminderSentReservation(customerData: {
    name: string;
    email: string;
  }) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const response = await this.request.post(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/test/create-reservation`,
      {
        data: {
          customerName: customerData.name,
          customerEmail: customerData.email,
          dateTime: tomorrow.toISOString(),
          status: 'confirmed',
          reminderSent: true,
        },
      }
    );

    return response;
  }
}
