'use client';

import { useState, useCallback } from 'react';
import { MenuFormData, INITIAL_FORM_DATA, Menu } from './types';

/**
 * メニューフォームのバリデーションとフォーム状態管理
 */
export function useMenuFormValidation() {
  const [formData, setFormData] = useState<MenuFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const validateForm = useCallback((): boolean => {
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
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setFormErrors([]);
  }, []);

  const setFormFromMenu = useCallback((menu: Menu) => {
    setFormData({
      name: menu.name,
      price: menu.price.toString(),
      duration: menu.duration.toString(),
      category: menu.category || '',
      description: menu.description || '',
    });
    setFormErrors([]);
  }, []);

  return {
    formData,
    formErrors,
    setFormData,
    validateForm,
    resetForm,
    setFormFromMenu,
  };
}
