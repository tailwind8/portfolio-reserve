'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * メニュー管理ページ
 * Issue: #23
 *
 * 機能:
 * - メニュー一覧表示
 * - メニュー追加
 * - メニュー編集
 * - メニュー削除
 * - カテゴリフィルター
 * - 検索機能
 * - 有効/無効切り替え
 */

type Menu = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  category: string | null;
  isActive: boolean;
  _count: {
    reservations: number;
  };
};

type MenuFormData = {
  name: string;
  price: string;
  duration: string;
  category: string;
  description: string;
};

export default function MenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState<MenuFormData>({
    name: '',
    price: '',
    duration: '',
    category: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchMenus = async () => {
    try {
      const response = await fetch('/api/admin/menus');
      if (response.ok) {
        const data = await response.json();
        setMenus(data.data);
      }
    } catch (error) {
      console.error('メニュー一覧の取得に失敗しました:', error);
    }
  };

  // メニュー一覧を取得
  useEffect(() => {
    // Data fetching on mount is an acceptable use case for setState in useEffect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMenus();
  }, []);

  // 検索とフィルター - useMemoで計算
  const filteredMenus = useMemo(() => {
    let result = menus;

    // 検索フィルター
    if (searchQuery) {
      result = result.filter((menu) =>
        menu.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // カテゴリフィルター
    if (categoryFilter) {
      result = result.filter((menu) => menu.category === categoryFilter);
    }

    return result;
  }, [menus, searchQuery, categoryFilter]);

  const handleAddMenu = () => {
    setFormData({
      name: '',
      price: '',
      duration: '',
      category: '',
      description: '',
    });
    setFormErrors([]);
    setIsAddModalOpen(true);
  };

  const handleEditMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setFormData({
      name: menu.name,
      price: menu.price.toString(),
      duration: menu.duration.toString(),
      category: menu.category || '',
      description: menu.description || '',
    });
    setFormErrors([]);
    setIsEditModalOpen(true);
  };

  const handleDeleteMenu = (menu: Menu) => {
    setSelectedMenu(menu);
    setIsDeleteDialogOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('名前を入力してください');
    }

    if (!formData.price.trim()) {
      errors.push('価格を入力してください');
    } else if (parseInt(formData.price) < 0) {
      errors.push('価格は0以上の数値を入力してください');
    }

    if (!formData.duration.trim()) {
      errors.push('所要時間を入力してください');
    }

    setFormErrors(errors);
    return errors.length === 0;
  };

  const submitAddMenu = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseInt(formData.price),
          duration: parseInt(formData.duration),
          category: formData.category || null,
          description: formData.description || null,
        }),
      });

      if (response.ok) {
        setSuccessMessage('メニューを追加しました');
        setIsAddModalOpen(false);
        fetchMenus();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'メニューの追加に失敗しました');
      }
    } catch (error) {
      console.error('メニュー追加エラー:', error);
      setErrorMessage('メニューの追加に失敗しました');
    }
  };

  const submitEditMenu = async () => {
    if (!selectedMenu || !validateForm()) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/menus/${selectedMenu.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          price: parseInt(formData.price),
          duration: parseInt(formData.duration),
          category: formData.category || null,
          description: formData.description || null,
        }),
      });

      if (response.ok) {
        setSuccessMessage('メニュー情報を更新しました');
        setIsEditModalOpen(false);
        fetchMenus();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'メニューの更新に失敗しました');
      }
    } catch (error) {
      console.error('メニュー更新エラー:', error);
      setErrorMessage('メニューの更新に失敗しました');
    }
  };

  const confirmDelete = async () => {
    if (!selectedMenu) return;

    try {
      const response = await fetch(`/api/admin/menus/${selectedMenu.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccessMessage('メニューを削除しました');
        setIsDeleteDialogOpen(false);
        fetchMenus();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const error = await response.json();
        setErrorMessage(error.message || 'メニューの削除に失敗しました');
      }
    } catch (error) {
      console.error('メニュー削除エラー:', error);
      setErrorMessage('メニューの削除に失敗しました');
    }
  };

  const toggleMenuActive = async (menu: Menu) => {
    try {
      const response = await fetch(`/api/admin/menus/${menu.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !menu.isActive,
        }),
      });

      if (response.ok) {
        const message = menu.isActive ? 'メニューを無効にしました' : 'メニューを有効にしました';
        setSuccessMessage(message);
        fetchMenus();
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      console.error('メニュー状態変更エラー:', error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* ページタイトル */}
      <h1 data-testid="page-title" className="text-2xl font-bold mb-6">
        メニュー管理
      </h1>

      {/* 成功メッセージ */}
      {successMessage && (
        <div data-testid="success-message" className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      {/* エラーメッセージ */}
      {errorMessage && (
        <div data-testid="error-message" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {/* 検索とフィルター */}
      <div className="mb-4 flex gap-4">
        <input
          type="text"
          data-testid="search-input"
          placeholder="メニュー名で検索"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <select
          data-testid="category-filter"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border px-4 py-2 rounded"
        >
          <option value="">すべてのカテゴリ</option>
          <option value="ヘアケア">ヘアケア</option>
          <option value="カラー">カラー</option>
          <option value="パーマ">パーマ</option>
        </select>
      </div>

      {/* メニュー追加ボタン */}
      <button
        data-testid="add-menu-button"
        onClick={handleAddMenu}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        メニューを追加
      </button>

      {/* メニュー一覧 */}
      <div data-testid="menu-list" className="space-y-4">
        {filteredMenus.map((menu, index) => (
          <div
            key={menu.id}
            data-testid={`menu-item-${index}`}
            className="border p-4 rounded shadow"
          >
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
                  onClick={() => handleEditMenu(menu)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  編集
                </button>
                <button
                  data-testid={`delete-menu-${index}`}
                  onClick={() => handleDeleteMenu(menu)}
                  disabled={menu._count.reservations > 0}
                  className={`px-3 py-1 rounded ${
                    menu._count.reservations > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  削除
                </button>
                <button
                  data-testid={menu.isActive ? `deactivate-menu-${index}` : `activate-menu-${index}`}
                  onClick={() => toggleMenuActive(menu)}
                  className="bg-gray-500 text-white px-3 py-1 rounded"
                >
                  {menu.isActive ? '無効にする' : '有効にする'}
                </button>
              </div>
            </div>
            {menu._count.reservations > 0 && (
              <p className="text-red-600 text-sm mt-2">
                予約が存在するため削除できません
              </p>
            )}
          </div>
        ))}
      </div>

      {/* メニュー追加モーダル */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div data-testid="add-menu-modal" className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">メニューを追加</h2>

            {/* バリデーションエラー */}
            {formErrors.length > 0 && (
              <div className="mb-4">
                {formErrors.map((error, index) => (
                  <p key={index} data-testid="validation-error" className="text-red-600 text-sm">
                    {error}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                data-testid="menu-name-input"
                placeholder="名前"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                data-testid="menu-price-input"
                placeholder="価格"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                data-testid="menu-duration-input"
                placeholder="所要時間（分）"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                data-testid="menu-category-input"
                placeholder="カテゴリ"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <textarea
                data-testid="menu-description-input"
                placeholder="説明"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                rows={3}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                data-testid="submit-add-menu"
                onClick={submitAddMenu}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                追加
              </button>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* メニュー編集モーダル */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div data-testid="edit-menu-modal" className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">メニューを編集</h2>

            {/* バリデーションエラー */}
            {formErrors.length > 0 && (
              <div className="mb-4">
                {formErrors.map((error, index) => (
                  <p key={index} data-testid="validation-error" className="text-red-600 text-sm">
                    {error}
                  </p>
                ))}
              </div>
            )}

            <div className="space-y-4">
              <input
                type="text"
                data-testid="menu-name-input"
                placeholder="名前"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                data-testid="menu-price-input"
                placeholder="価格"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="number"
                data-testid="menu-duration-input"
                placeholder="所要時間（分）"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <input
                type="text"
                data-testid="menu-category-input"
                placeholder="カテゴリ"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border px-3 py-2 rounded"
              />
              <textarea
                data-testid="menu-description-input"
                placeholder="説明"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border px-3 py-2 rounded"
                rows={3}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <button
                data-testid="submit-edit-menu"
                onClick={submitEditMenu}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                保存
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div data-testid="delete-menu-dialog" className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">メニューを削除しますか？</h2>
            <p className="mb-4">この操作は取り消せません。</p>

            <div className="flex gap-2">
              <button
                data-testid="confirm-delete-menu"
                onClick={confirmDelete}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                はい
              </button>
              <button
                onClick={() => setIsDeleteDialogOpen(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
