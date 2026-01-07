'use client';

import { MenuFormData } from './types';
import { MenuFormFields } from './MenuFormFields';

type MenuFormModalProps = {
  isOpen: boolean;
  mode: 'add' | 'edit';
  formData: MenuFormData;
  formErrors: string[];
  onFormChange: (data: MenuFormData) => void;
  onSubmit: () => void;
  onClose: () => void;
};

/**
 * メニュー追加・編集モーダル
 */
export function MenuFormModal({
  isOpen,
  mode,
  formData,
  formErrors,
  onFormChange,
  onSubmit,
  onClose,
}: MenuFormModalProps) {
  if (!isOpen) {
    return null;
  }

  const title = mode === 'add' ? 'メニューを追加' : 'メニューを編集';
  const submitLabel = mode === 'add' ? '追加' : '保存';
  const testIdPrefix = mode === 'add' ? 'add-menu-modal' : 'edit-menu-modal';
  const submitTestId = mode === 'add' ? 'submit-add-menu' : 'submit-edit-menu';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div data-testid={testIdPrefix} className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">{title}</h2>

        {formErrors.length > 0 && (
          <div className="mb-4">
            {formErrors.map((error, index) => (
              <p key={index} data-testid="validation-error" className="text-red-600 text-sm">
                {error}
              </p>
            ))}
          </div>
        )}

        <MenuFormFields formData={formData} onFormChange={onFormChange} />

        <div className="flex gap-2 mt-4">
          <button
            data-testid={submitTestId}
            onClick={onSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            {submitLabel}
          </button>
          <button onClick={onClose} className="bg-gray-300 px-4 py-2 rounded">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
