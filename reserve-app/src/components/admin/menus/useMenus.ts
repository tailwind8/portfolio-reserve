'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import { Menu } from './types';
import {
  fetchMenusApi,
  addMenuApi,
  updateMenuApi,
  deleteMenuApi,
  toggleMenuActiveApi,
} from './menuApi';
import { useMenuFormValidation } from './useMenuFormValidation';
import { useMenuModalState } from './useMenuModalState';

/**
 * メニュー管理のカスタムフック
 */
export function useMenus() {
  const { authFetch } = useAuthFetch();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  const form = useMenuFormValidation();
  const modal = useMenuModalState();

  const showSuccessMessage = useCallback((message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  }, []);

  const fetchMenus = useCallback(async () => {
    setPageLoading(true);
    const result = await fetchMenusApi(authFetch);
    if (result.success && result.data) {
      setMenus(result.data);
    } else {
      setErrorMessage(result.error || 'エラーが発生しました');
    }
    setPageLoading(false);
  }, [authFetch]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const filteredMenus = useMemo(() => {
    let result = menus;
    if (searchQuery) {
      result = result.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    if (categoryFilter) {
      result = result.filter((m) => m.category === categoryFilter);
    }
    return result;
  }, [menus, searchQuery, categoryFilter]);

  const handleOpenAddModal = useCallback(() => {
    form.resetForm();
    modal.openAddModal();
  }, [form, modal]);

  const handleOpenEditModal = useCallback((menu: Menu) => {
    form.setFormFromMenu(menu);
    modal.openEditModal(menu);
  }, [form, modal]);

  const submitAddMenu = useCallback(async () => {
    if (!form.validateForm()) {
      return;
    }
    const result = await addMenuApi(authFetch, form.formData);
    if (result.success) {
      showSuccessMessage('メニューを追加しました');
      modal.closeAddModal();
      fetchMenus();
    } else {
      setErrorMessage(result.error || 'エラーが発生しました');
    }
  }, [authFetch, form, modal, showSuccessMessage, fetchMenus]);

  const submitEditMenu = useCallback(async () => {
    if (!modal.selectedMenu || !form.validateForm()) {
      return;
    }
    const result = await updateMenuApi(authFetch, modal.selectedMenu.id, form.formData);
    if (result.success) {
      showSuccessMessage('メニュー情報を更新しました');
      modal.closeEditModal();
      fetchMenus();
    } else {
      setErrorMessage(result.error || 'エラーが発生しました');
    }
  }, [authFetch, form, modal, showSuccessMessage, fetchMenus]);

  const confirmDelete = useCallback(async () => {
    if (!modal.selectedMenu) {
      return;
    }
    const result = await deleteMenuApi(authFetch, modal.selectedMenu.id);
    if (result.success) {
      showSuccessMessage('メニューを削除しました');
      modal.closeDeleteDialog();
      fetchMenus();
    } else {
      setErrorMessage(result.error || 'エラーが発生しました');
    }
  }, [authFetch, modal, showSuccessMessage, fetchMenus]);

  const toggleMenuActive = useCallback(async (menu: Menu) => {
    const result = await toggleMenuActiveApi(authFetch, menu);
    if (result.success && result.data) {
      showSuccessMessage(result.data);
      fetchMenus();
    } else {
      setErrorMessage(result.error || 'エラーが発生しました');
    }
  }, [authFetch, showSuccessMessage, fetchMenus]);

  return {
    menus: filteredMenus,
    selectedMenu: modal.selectedMenu,
    formData: form.formData,
    formErrors: form.formErrors,
    successMessage,
    errorMessage,
    searchQuery,
    categoryFilter,
    pageLoading,
    isAddModalOpen: modal.isAddModalOpen,
    isEditModalOpen: modal.isEditModalOpen,
    isDeleteDialogOpen: modal.isDeleteDialogOpen,
    setFormData: form.setFormData,
    setSearchQuery,
    setCategoryFilter,
    setIsAddModalOpen: modal.setIsAddModalOpen,
    setIsEditModalOpen: modal.setIsEditModalOpen,
    setIsDeleteDialogOpen: modal.setIsDeleteDialogOpen,
    openAddModal: handleOpenAddModal,
    openEditModal: handleOpenEditModal,
    openDeleteDialog: modal.openDeleteDialog,
    submitAddMenu,
    submitEditMenu,
    confirmDelete,
    toggleMenuActive,
  };
}
