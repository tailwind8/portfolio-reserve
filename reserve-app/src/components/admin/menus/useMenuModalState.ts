'use client';

import { useState, useCallback } from 'react';
import { Menu } from './types';

/**
 * メニューモーダルの状態管理
 */
export function useMenuModalState() {
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const openAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const closeAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const openEditModal = useCallback((menu: Menu) => {
    setSelectedMenu(menu);
    setIsEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setIsEditModalOpen(false);
  }, []);

  const openDeleteDialog = useCallback((menu: Menu) => {
    setSelectedMenu(menu);
    setIsDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setIsDeleteDialogOpen(false);
  }, []);

  return {
    selectedMenu,
    isAddModalOpen,
    isEditModalOpen,
    isDeleteDialogOpen,
    setIsAddModalOpen,
    setIsEditModalOpen,
    setIsDeleteDialogOpen,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteDialog,
    closeDeleteDialog,
  };
}
