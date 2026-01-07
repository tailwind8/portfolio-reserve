import { extractErrorMessage } from '@/hooks/useAuthFetch';
import { Menu, MenuFormData } from './types';

type AuthFetch = (url: string, options?: RequestInit) => Promise<Response>;

type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * メニューAPI操作を担当
 */
export async function fetchMenusApi(authFetch: AuthFetch): Promise<ApiResult<Menu[]>> {
  try {
    const response = await authFetch('/api/admin/menus');
    if (response.ok) {
      const data = await response.json();
      return { success: true, data: data.data };
    }
    const result = await response.json();
    return {
      success: false,
      error: extractErrorMessage(result.error) || 'メニュー一覧の取得に失敗しました',
    };
  } catch (error) {
    console.error('メニュー一覧の取得に失敗しました:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メニュー一覧の取得に失敗しました',
    };
  }
}

export async function addMenuApi(
  authFetch: AuthFetch,
  formData: MenuFormData
): Promise<ApiResult<void>> {
  try {
    const response = await authFetch('/api/admin/menus', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.name,
        price: parseInt(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category || null,
        description: formData.description || null,
      }),
    });

    if (response.ok) {
      return { success: true };
    }
    const result = await response.json();
    return {
      success: false,
      error: extractErrorMessage(result.error) || 'メニューの追加に失敗しました',
    };
  } catch (error) {
    console.error('メニュー追加エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メニューの追加に失敗しました',
    };
  }
}

export async function updateMenuApi(
  authFetch: AuthFetch,
  menuId: string,
  formData: MenuFormData
): Promise<ApiResult<void>> {
  try {
    const response = await authFetch(`/api/admin/menus/${menuId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: formData.name,
        price: parseInt(formData.price),
        duration: parseInt(formData.duration),
        category: formData.category || null,
        description: formData.description || null,
      }),
    });

    if (response.ok) {
      return { success: true };
    }
    const result = await response.json();
    return {
      success: false,
      error: extractErrorMessage(result.error) || 'メニューの更新に失敗しました',
    };
  } catch (error) {
    console.error('メニュー更新エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メニューの更新に失敗しました',
    };
  }
}

export async function deleteMenuApi(
  authFetch: AuthFetch,
  menuId: string
): Promise<ApiResult<void>> {
  try {
    const response = await authFetch(`/api/admin/menus/${menuId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      return { success: true };
    }
    const result = await response.json();
    return {
      success: false,
      error: extractErrorMessage(result.error) || 'メニューの削除に失敗しました',
    };
  } catch (error) {
    console.error('メニュー削除エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メニューの削除に失敗しました',
    };
  }
}

export async function toggleMenuActiveApi(
  authFetch: AuthFetch,
  menu: Menu
): Promise<ApiResult<string>> {
  try {
    const response = await authFetch(`/api/admin/menus/${menu.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        isActive: !menu.isActive,
      }),
    });

    if (response.ok) {
      const message = menu.isActive ? 'メニューを無効にしました' : 'メニューを有効にしました';
      return { success: true, data: message };
    }
    const result = await response.json();
    return {
      success: false,
      error: extractErrorMessage(result.error) || 'メニュー状態の変更に失敗しました',
    };
  } catch (error) {
    console.error('メニュー状態変更エラー:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'メニュー状態の変更に失敗しました',
    };
  }
}
