'use client';

import { Menu } from './types';

type MenuItemProps = {
  menu: Menu;
  index: number;
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  onToggleActive: (menu: Menu) => void;
};

/**
 * メニュー項目コンポーネント
 */
export function MenuItem({ menu, index, onEdit, onDelete, onToggleActive }: MenuItemProps) {
  const hasReservations = menu._count.reservations > 0;

  return (
    <div data-testid={`menu-item-${index}`} className="border p-4 rounded shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 data-testid="menu-name" className="text-lg font-bold">
            {menu.name}
          </h3>
          <p data-testid="menu-price" className="text-gray-700">
            ¥{menu.price.toLocaleString()}
          </p>
          <p data-testid="menu-duration" className="text-gray-600">
            {menu.duration}分
          </p>
          {menu.category && (
            <p data-testid="menu-category" className="text-gray-600">
              カテゴリ: {menu.category}
            </p>
          )}
          {menu.description && (
            <p data-testid="menu-description" className="text-gray-600 mt-2">
              {menu.description}
            </p>
          )}
          <p data-testid="menu-status" className="text-sm mt-2">
            {menu.isActive ? '有効' : '無効'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            data-testid={`edit-menu-${index}`}
            onClick={() => onEdit(menu)}
            className="bg-yellow-500 text-white px-3 py-1 rounded"
          >
            編集
          </button>
          <button
            data-testid={`delete-menu-${index}`}
            onClick={() => onDelete(menu)}
            disabled={hasReservations}
            className={`px-3 py-1 rounded ${
              hasReservations
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-500 text-white'
            }`}
          >
            削除
          </button>
          <button
            data-testid={menu.isActive ? `deactivate-menu-${index}` : `activate-menu-${index}`}
            onClick={() => onToggleActive(menu)}
            className="bg-gray-500 text-white px-3 py-1 rounded"
          >
            {menu.isActive ? '無効にする' : '有効にする'}
          </button>
        </div>
      </div>
      {hasReservations && (
        <p className="text-red-600 text-sm mt-2">予約が存在するため削除できません</p>
      )}
    </div>
  );
}
