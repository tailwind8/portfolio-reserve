'use client';

import { MenuFormData } from './types';

type MenuFormFieldsProps = {
  formData: MenuFormData;
  onFormChange: (data: MenuFormData) => void;
};

/**
 * メニューフォームの入力フィールド
 */
export function MenuFormFields({ formData, onFormChange }: MenuFormFieldsProps) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        data-testid="menu-name-input"
        placeholder="名前"
        value={formData.name}
        onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="number"
        data-testid="menu-price-input"
        placeholder="価格"
        value={formData.price}
        onChange={(e) => onFormChange({ ...formData, price: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="number"
        data-testid="menu-duration-input"
        placeholder="所要時間（分）"
        value={formData.duration}
        onChange={(e) => onFormChange({ ...formData, duration: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />
      <input
        type="text"
        data-testid="menu-category-input"
        placeholder="カテゴリ"
        value={formData.category}
        onChange={(e) => onFormChange({ ...formData, category: e.target.value })}
        className="w-full border px-3 py-2 rounded"
      />
      <textarea
        data-testid="menu-description-input"
        placeholder="説明"
        value={formData.description}
        onChange={(e) => onFormChange({ ...formData, description: e.target.value })}
        className="w-full border px-3 py-2 rounded"
        rows={3}
      />
    </div>
  );
}
