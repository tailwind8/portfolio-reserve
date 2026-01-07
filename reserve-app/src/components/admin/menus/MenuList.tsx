'use client';

import { Menu } from './types';
import { MenuItem } from './MenuItem';

type MenuListProps = {
  menus: Menu[];
  onEdit: (menu: Menu) => void;
  onDelete: (menu: Menu) => void;
  onToggleActive: (menu: Menu) => void;
};

/**
 * メニュー一覧コンポーネント
 */
export function MenuList({ menus, onEdit, onDelete, onToggleActive }: MenuListProps) {
  return (
    <div data-testid="menu-list" className="space-y-4">
      {menus.map((menu, index) => (
        <MenuItem
          key={menu.id}
          menu={menu}
          index={index}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
        />
      ))}
    </div>
  );
}
