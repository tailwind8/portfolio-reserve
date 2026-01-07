/**
 * メニュー管理で使用する型定義
 */

export type Menu = {
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

export type MenuFormData = {
  name: string;
  price: string;
  duration: string;
  category: string;
  description: string;
};

export const INITIAL_FORM_DATA: MenuFormData = {
  name: '',
  price: '',
  duration: '',
  category: '',
  description: '',
};

export const MENU_CATEGORIES = ['ヘアケア', 'カラー', 'パーマ'] as const;
