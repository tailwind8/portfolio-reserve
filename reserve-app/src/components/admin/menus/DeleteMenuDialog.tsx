'use client';

type DeleteMenuDialogProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * メニュー削除確認ダイアログ
 */
export function DeleteMenuDialog({ isOpen, onConfirm, onClose }: DeleteMenuDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div data-testid="delete-menu-dialog" className="bg-white p-6 rounded shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4">メニューを削除しますか？</h2>
        <p className="mb-4">この操作は取り消せません。</p>

        <div className="flex gap-2">
          <button
            data-testid="confirm-delete-menu"
            onClick={onConfirm}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            はい
          </button>
          <button
            onClick={onClose}
            className="bg-gray-300 px-4 py-2 rounded"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
