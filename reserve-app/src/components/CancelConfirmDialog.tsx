import React from 'react';
import type { Reservation } from '@/types/api';

interface CancelConfirmDialogProps {
  reservation: Reservation;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * CancelConfirmDialog - 予約キャンセル確認ダイアログ
 *
 * @param reservation - キャンセル対象の予約データ
 * @param onConfirm - キャンセル確定時のコールバック
 * @param onCancel - キャンセル中止時のコールバック
 *
 * @example
 * <CancelConfirmDialog
 *   reservation={reservation}
 *   onConfirm={handleConfirm}
 *   onCancel={handleCancel}
 * />
 */
export default function CancelConfirmDialog({
  reservation,
  onConfirm,
  onCancel,
}: CancelConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        {/* ヘッダー */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">予約をキャンセルしますか？</h2>
        </div>

        {/* 予約情報サマリー */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <div className="mb-2 text-sm text-gray-600">予約日時</div>
          <div className="mb-3 text-base font-semibold text-gray-900">
            {new Date(reservation.reservedDate).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short',
            })}{' '}
            {reservation.reservedTime}
          </div>
          <div className="mb-2 text-sm text-gray-600">メニュー</div>
          <div className="mb-1 text-base font-semibold text-gray-900">{reservation.menu.name}</div>
          <div className="text-sm text-gray-600">
            ¥{reservation.menu.price.toLocaleString()} • {reservation.menu.duration}分
          </div>
          {reservation.staff && (
            <>
              <div className="mb-2 mt-3 text-sm text-gray-600">担当者</div>
              <div className="text-base font-semibold text-gray-900">{reservation.staff.name}</div>
            </>
          )}
        </div>

        {/* 警告メッセージ */}
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-yellow-800">
              この操作は取り消せません。本当にキャンセルしますか？
            </p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            戻る
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            キャンセルする
          </button>
        </div>
      </div>
    </div>
  );
}
