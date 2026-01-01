/**
 * リマインダーメールのテンプレート
 */

export interface ReminderEmailData {
  customerName: string;
  reservedDate: string; // "2025-01-15"
  reservedTime: string; // "14:00"
  menuName: string;
  staffName?: string;
  myPageUrl: string;
}

/**
 * リマインダーメールの件名を生成
 */
export function getReminderEmailSubject(): string {
  return '【予約リマインダー】明日のご予約について';
}

/**
 * リマインダーメールのHTML本文を生成
 */
export function getReminderEmailHtml(data: ReminderEmailData): string {
  const { customerName, reservedDate, reservedTime, menuName, staffName, myPageUrl } = data;

  // 日付をフォーマット（例: 2025-01-15 → 2025年1月15日）
  const date = new Date(reservedDate);
  const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

  return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>予約リマインダー</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3b82f6;
    }
    .header h1 {
      color: #3b82f6;
      margin: 0;
      font-size: 24px;
    }
    .content {
      margin-bottom: 30px;
    }
    .reservation-details {
      background-color: #f9fafb;
      border-left: 4px solid #3b82f6;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 12px;
      align-items: baseline;
    }
    .detail-label {
      font-weight: bold;
      min-width: 120px;
      color: #4b5563;
    }
    .detail-value {
      color: #111827;
    }
    .important {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: bold;
      text-align: center;
      margin: 10px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      color: #6b7280;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔔 予約リマインダー</h1>
    </div>

    <div class="content">
      <p>${customerName} 様</p>

      <p>いつもご利用いただきありがとうございます。<br>
      明日のご予約についてご案内いたします。</p>

      <div class="reservation-details">
        <h2 style="margin-top: 0; color: #111827; font-size: 18px;">📅 ご予約内容</h2>

        <div class="detail-row">
          <span class="detail-label">予約日時：</span>
          <span class="detail-value">${formattedDate}（明日） ${reservedTime}</span>
        </div>

        <div class="detail-row">
          <span class="detail-label">メニュー：</span>
          <span class="detail-value">${menuName}</span>
        </div>

        ${
          staffName
            ? `
        <div class="detail-row">
          <span class="detail-label">担当スタッフ：</span>
          <span class="detail-value">${staffName}</span>
        </div>
        `
            : ''
        }
      </div>

      <div class="important">
        <strong>⚠️ キャンセルについて</strong><br>
        ご都合が悪くなった場合は、マイページからキャンセル可能です。<br>
        お早めにご連絡いただけますと幸いです。
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${myPageUrl}" class="button">マイページで予約を確認</a>
      </div>

      <p>皆様のご来店を心よりお待ちしております。</p>
    </div>

    <div class="footer">
      <p>このメールは自動送信されています。<br>
      返信いただいても対応できませんのでご了承ください。</p>
      <p>© 2025 Demo Booking. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * リマインダーメールのテキスト本文を生成
 */
export function getReminderEmailText(data: ReminderEmailData): string {
  const { customerName, reservedDate, reservedTime, menuName, staffName, myPageUrl } = data;

  // 日付をフォーマット
  const date = new Date(reservedDate);
  const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

  const staffInfo = staffName ? `担当スタッフ： ${staffName}\n` : '';

  return `
【予約リマインダー】明日のご予約について

${customerName} 様

いつもご利用いただきありがとうございます。
明日のご予約についてご案内いたします。

━━━━━━━━━━━━━━━━━━━━━━
📅 ご予約内容
━━━━━━━━━━━━━━━━━━━━━━

予約日時： ${formattedDate}（明日） ${reservedTime}
メニュー： ${menuName}
${staffInfo}
━━━━━━━━━━━━━━━━━━━━━━

⚠️ キャンセルについて

ご都合が悪くなった場合は、マイページからキャンセル可能です。
お早めにご連絡いただけますと幸いです。

マイページ： ${myPageUrl}

━━━━━━━━━━━━━━━━━━━━━━

皆様のご来店を心よりお待ちしております。

━━━━━━━━━━━━━━━━━━━━━━
このメールは自動送信されています。
返信いただいても対応できませんのでご了承ください。

© 2025 Demo Booking. All rights reserved.
  `.trim();
}
