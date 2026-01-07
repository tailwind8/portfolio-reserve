'use client';

import AdminSidebar from '@/components/AdminSidebar';
import {
  MenuSearchFilter,
  MenuList,
  MenuFormModal,
  DeleteMenuDialog,
  useMenus,
} from '@/components/admin/menus';

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
export default function MenusPage() {
  const {
    menus,
    formData,
    formErrors,
    successMessage,
    errorMessage,
    searchQuery,
    categoryFilter,
    pageLoading,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    setFormData,
    setSearchQuery,
    setCategoryFilter,
    setIsAddModalOpen,
    setIsEditModalOpen,
    setIsDeleteDialogOpen,
    openAddModal,
    openEditModal,
    openDeleteDialog,
    submitAddMenu,
    submitEditMenu,
    confirmDelete,
    toggleMenuActive,
  } = useMenus();

  if (pageLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="ml-64 flex-1 p-8">
          <div className="flex h-96 items-center justify-center">
            <div data-testid="loading-message" className="text-gray-500">読み込み中...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <h1 data-testid="page-title" className="text-3xl font-bold text-gray-900 mb-6">
          メニュー管理
        </h1>

        {successMessage && (
          <div data-testid="success-message" className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div data-testid="error-message" className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {errorMessage}
          </div>
        )}

        <MenuSearchFilter
          searchQuery={searchQuery}
          categoryFilter={categoryFilter}
          onSearchChange={setSearchQuery}
          onCategoryChange={setCategoryFilter}
        />

        <button
          data-testid="add-menu-button"
          onClick={openAddModal}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          メニューを追加
        </button>

        <MenuList
          menus={menus}
          onEdit={openEditModal}
          onDelete={openDeleteDialog}
          onToggleActive={toggleMenuActive}
        />
      </main>

      <MenuFormModal
        isOpen={isAddModalOpen}
        mode="add"
        formData={formData}
        formErrors={formErrors}
        onFormChange={setFormData}
        onSubmit={submitAddMenu}
        onClose={() => setIsAddModalOpen(false)}
      />

      <MenuFormModal
        isOpen={isEditModalOpen}
        mode="edit"
        formData={formData}
        formErrors={formErrors}
        onFormChange={setFormData}
        onSubmit={submitEditMenu}
        onClose={() => setIsEditModalOpen(false)}
      />

      <DeleteMenuDialog
        isOpen={isDeleteDialogOpen}
        onConfirm={confirmDelete}
        onClose={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
