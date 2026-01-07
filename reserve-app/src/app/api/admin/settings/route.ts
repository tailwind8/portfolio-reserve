import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { z } from 'zod';
import type { NextRequest } from 'next/server';
import { requireAdminApiAuth } from '@/lib/admin-api-auth';

/**
 * 店舗設定更新用のバリデーションスキーマ
 */
const updateSettingsSchema = z.object({
  storeName: z.string().min(1, '店舗名は必須です').max(100, '店舗名は100文字以内で入力してください'),
  storeEmail: z.string().email('有効なメールアドレスを入力してください').optional().or(z.literal('')),
  storePhone: z.string().optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, '時刻の形式が正しくありません'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, '時刻の形式が正しくありません'),
  closedDays: z.array(z.string()).optional(),
  slotDuration: z.number().min(15, '予約枠は15分以上である必要があります').max(120, '予約枠は120分以下である必要があります'),
  isPublic: z.boolean().optional().default(true),
  minAdvanceBookingDays: z.number().int().min(0, '0以上の値を入力してください').optional(),
  maxAdvanceBookingDays: z.number().int().min(1, '1以上の値を入力してください').optional(),
}).refine((data) => {
  // 開店時刻が閉店時刻より前であることを検証
  const openMinutes = parseInt(data.openTime.split(':')[0]) * 60 + parseInt(data.openTime.split(':')[1]);
  const closeMinutes = parseInt(data.closeTime.split(':')[0]) * 60 + parseInt(data.closeTime.split(':')[1]);
  return openMinutes < closeMinutes;
}, {
  message: '開店時刻は閉店時刻より前である必要があります',
  path: ['openTime'],
}).refine((data) => {
  // 最短予約日数が最長予約日数より小さいことを検証
  if (data.minAdvanceBookingDays !== undefined && data.maxAdvanceBookingDays !== undefined) {
    return data.minAdvanceBookingDays < data.maxAdvanceBookingDays;
  }
  return true;
}, {
  message: '最短予約日数は最長予約日数より小さい値を設定してください',
  path: ['minAdvanceBookingDays'],
});

/**
 * GET /api/admin/settings
 * 店舗設定を取得
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // 店舗設定を取得（1テナント1設定）
    let settings = await prisma.bookingSettings.findUnique({
      where: {
        tenantId,
      },
    });

    // 設定が存在しない場合は初期値で作成
    if (!settings) {
      settings = await prisma.bookingSettings.create({
        data: {
          tenantId,
          storeName: 'サンプル美容室',
          storeEmail: 'info@sample-salon.com',
          storePhone: '03-1234-5678',
          openTime: '09:00',
          closeTime: '20:00',
          closedDays: [],
          slotDuration: 30,
          isPublic: true,
        },
      });
    }

    return successResponse(settings, 200);
  } catch (error) {
    console.error('GET /api/admin/settings error:', error);
    return errorResponse('店舗設定の取得に失敗しました', 500, 'INTERNAL_ERROR');
  }
}

/**
 * PATCH /api/admin/settings
 * 店舗設定を更新
 */
export async function PATCH(request: NextRequest) {
  const admin = await requireAdminApiAuth(request);
  if (admin instanceof Response) {return admin;}

  try {
    const body = await request.json();
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID || 'demo-booking';

    // バリデーション
    const validation = updateSettingsSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(
        'バリデーションエラー',
        400,
        'VALIDATION_ERROR',
        validation.error.issues
      );
    }

    const validatedData = validation.data;

    // 店舗設定を更新（upsert: 存在しない場合は作成）
    const settings = await prisma.bookingSettings.upsert({
      where: {
        tenantId,
      },
      update: {
        storeName: validatedData.storeName,
        storeEmail: validatedData.storeEmail || null,
        storePhone: validatedData.storePhone || null,
        openTime: validatedData.openTime,
        closeTime: validatedData.closeTime,
        closedDays: validatedData.closedDays || [],
        slotDuration: validatedData.slotDuration,
        isPublic: validatedData.isPublic,
        ...(validatedData.minAdvanceBookingDays !== undefined && {
          minAdvanceBookingDays: validatedData.minAdvanceBookingDays,
        }),
        ...(validatedData.maxAdvanceBookingDays !== undefined && {
          maxAdvanceBookingDays: validatedData.maxAdvanceBookingDays,
        }),
      },
      create: {
        tenantId,
        storeName: validatedData.storeName,
        storeEmail: validatedData.storeEmail || null,
        storePhone: validatedData.storePhone || null,
        openTime: validatedData.openTime,
        closeTime: validatedData.closeTime,
        closedDays: validatedData.closedDays || [],
        slotDuration: validatedData.slotDuration,
        isPublic: validatedData.isPublic ?? true,
        minAdvanceBookingDays: validatedData.minAdvanceBookingDays ?? 0,
        maxAdvanceBookingDays: validatedData.maxAdvanceBookingDays ?? 90,
      },
    });

    return successResponse(settings, 200);
  } catch (error) {
    console.error('PATCH /api/admin/settings error:', error);
    return errorResponse('店舗設定の更新に失敗しました', 500, 'INTERNAL_ERROR');
  }
}
