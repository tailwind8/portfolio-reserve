'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import type { CustomerMemoSectionProps } from './types';

/**
 * 顧客メモセクションコンポーネント
 */
export default function CustomerMemoSection({
  memo,
  isEditing,
  memoValue,
  isSaving,
  onEdit,
  onSave,
  onDelete,
  onCancel,
  onMemoChange,
}: CustomerMemoSectionProps) {
  return (
    <Card className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">メモ</h2>
        {!isEditing && (
          <div className="flex gap-2">
            {memo && (
              <Button
                data-testid="customer-memo-delete-button"
                onClick={onDelete}
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                メモを削除
              </Button>
            )}
            <Button
              data-testid="customer-memo-edit-button"
              onClick={onEdit}
              variant="outline"
              size="sm"
            >
              メモを追加{memo ? '・編集' : ''}
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div>
          <textarea
            data-testid="customer-memo-input"
            value={memoValue}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 500) {
                onMemoChange(value);
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            rows={5}
            placeholder="顧客メモを入力してください（500文字以内）"
            disabled={isSaving}
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">{memoValue.length}/500文字</p>
            <div className="flex gap-2">
              <Button
                data-testid="customer-memo-cancel-button"
                onClick={onCancel}
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                キャンセル
              </Button>
              <Button
                data-testid="customer-memo-save-button"
                onClick={onSave}
                variant="primary"
                size="sm"
                disabled={isSaving}
              >
                {isSaving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {memo ? (
            <p data-testid="customer-memo" className="whitespace-pre-wrap text-gray-700">
              {memo}
            </p>
          ) : (
            <p className="text-gray-500">メモがありません</p>
          )}
        </div>
      )}
    </Card>
  );
}
