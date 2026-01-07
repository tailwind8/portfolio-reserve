'use client';

import Card from '@/components/Card';
import Button from '@/components/Button';
import type { CustomerInfoSectionProps } from './types';

/**
 * 顧客基本情報表示コンポーネント
 */
export default function CustomerInfoSection({ customer, onEdit }: CustomerInfoSectionProps) {
  return (
    <Card className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>
        <Button
          data-testid="customer-info-edit-button"
          onClick={onEdit}
          variant="outline"
          size="sm"
        >
          顧客情報を編集
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-gray-500">名前</p>
          <p data-testid="customer-detail-name" className="text-lg font-semibold text-gray-900">
            {customer.name || '（名前未設定）'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">メールアドレス</p>
          <p data-testid="customer-detail-email" className="text-lg font-semibold text-gray-900">
            {customer.email}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">電話番号</p>
          <p data-testid="customer-detail-phone" className="text-lg font-semibold text-gray-900">
            {customer.phone || '（未設定）'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">来店回数</p>
          <p className="text-lg font-semibold text-gray-900">{customer.visitCount}回</p>
        </div>
      </div>
    </Card>
  );
}
