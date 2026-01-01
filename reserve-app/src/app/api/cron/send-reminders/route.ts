import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/lib/prisma';
import {
  getReminderEmailSubject,
  getReminderEmailHtml,
  getReminderEmailText,
  type ReminderEmailData,
} from '@/lib/email/templates/reminder-email';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const TENANT_ID = 'demo-booking';

/**
 * リマインダーメール送信Cron Job API
 * Vercel Cronから毎日実行される
 *
 * GET /api/cron/send-reminders
 */
export async function GET(request: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    // 認証チェック（Vercel Cronからのリクエストのみ許可）
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'test-cron-token';

    if (!authHeader || !authHeader.includes(expectedToken)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 翌日の予約を取得
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // 翌日の予約で、リマインダー未送信、かつキャンセルされていないものを取得
    const reservations = await prisma.bookingReservation.findMany({
      where: {
        tenantId: TENANT_ID,
        reservedDate: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
        reminderSent: false,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
      },
      include: {
        user: true,
        menu: true,
        staff: true,
      },
    });

    console.log(`[Reminder Cron] Found ${reservations.length} reservations for tomorrow`);

    let successCount = 0;
    let failureCount = 0;
    const errors: Array<{ reservationId: string; error: string }> = [];

    // 各予約にリマインダーメールを送信
    for (const reservation of reservations) {
      try {
        const myPageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mypage`;

        const emailData: ReminderEmailData = {
          customerName: reservation.user.name || '様',
          reservedDate: reservation.reservedDate.toISOString().split('T')[0],
          reservedTime: reservation.reservedTime,
          menuName: reservation.menu.name,
          staffName: reservation.staff?.name,
          myPageUrl,
        };

        // メール送信
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@example.com',
          to: reservation.user.email,
          subject: getReminderEmailSubject(),
          html: getReminderEmailHtml(emailData),
          text: getReminderEmailText(emailData),
        });

        // リマインダー送信済みフラグを立てる
        await prisma.bookingReservation.update({
          where: { id: reservation.id },
          data: { reminderSent: true },
        });

        successCount++;
        console.log(`[Reminder Cron] Email sent to ${reservation.user.email} for reservation ${reservation.id}`);
      } catch (error) {
        failureCount++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          reservationId: reservation.id,
          error: errorMessage,
        });
        console.error(`[Reminder Cron] Failed to send email for reservation ${reservation.id}:`, error);
        // エラーが発生しても処理を継続
      }
    }

    // 結果を返す
    const result = {
      sent: reservations.length,
      success: successCount,
      failure: failureCount,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    };

    console.log('[Reminder Cron] Result:', result);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[Reminder Cron] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
