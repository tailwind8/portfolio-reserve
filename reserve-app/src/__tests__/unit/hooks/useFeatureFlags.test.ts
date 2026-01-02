import { renderHook, waitFor } from '@testing-library/react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

describe('useFeatureFlags', () => {
  beforeEach(() => {
    // fetch のモックをリセット
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('正常にフラグを取得できる', async () => {
    const mockFlags = {
      enableStaffSelection: true,
      enableStaffShiftManagement: true,
      enableCustomerManagement: true,
      enableReservationUpdate: true,
      enableReminderEmail: true,
      enableManualReservation: true,
      enableAnalyticsReport: true,
      enableRepeatRateAnalysis: true,
      enableCouponFeature: true,
      enableLineNotification: true,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          featureFlags: mockFlags,
        },
      }),
    });

    const { result } = renderHook(() => useFeatureFlags());

    // 初期状態
    expect(result.current.flags).toBeNull();
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();

    // API呼び出し完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // フラグが正しく設定されている
    expect(result.current.flags).toEqual(mockFlags);
    expect(result.current.error).toBeNull();
  });

  it('APIエラー時は全てfalseのフラグを返す', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // エラー時は全てfalse
    expect(result.current.flags).toEqual({
      enableStaffSelection: false,
      enableStaffShiftManagement: false,
      enableCustomerManagement: false,
      enableReservationUpdate: false,
      enableReminderEmail: false,
      enableManualReservation: false,
      enableAnalyticsReport: false,
      enableRepeatRateAnalysis: false,
      enableCouponFeature: false,
      enableLineNotification: false,
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('レスポンス形式が不正な場合はエラーを返す', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: false, // success が false
      }),
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // エラー時は全てfalse
    expect(result.current.flags).toEqual({
      enableStaffSelection: false,
      enableStaffShiftManagement: false,
      enableCustomerManagement: false,
      enableReservationUpdate: false,
      enableReminderEmail: false,
      enableManualReservation: false,
      enableAnalyticsReport: false,
      enableRepeatRateAnalysis: false,
      enableCouponFeature: false,
      enableLineNotification: false,
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Invalid response format from feature flags API');
  });

  it('ネットワークエラー時は全てfalseのフラグを返す', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // エラー時は全てfalse
    expect(result.current.flags).toEqual({
      enableStaffSelection: false,
      enableStaffShiftManagement: false,
      enableCustomerManagement: false,
      enableReservationUpdate: false,
      enableReminderEmail: false,
      enableManualReservation: false,
      enableAnalyticsReport: false,
      enableRepeatRateAnalysis: false,
      enableCouponFeature: false,
      enableLineNotification: false,
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('レスポンスにdataがない場合はエラーを返す', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        // data がない
      }),
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.flags).toEqual({
      enableStaffSelection: false,
      enableStaffShiftManagement: false,
      enableCustomerManagement: false,
      enableReservationUpdate: false,
      enableReminderEmail: false,
      enableManualReservation: false,
      enableAnalyticsReport: false,
      enableRepeatRateAnalysis: false,
      enableCouponFeature: false,
      enableLineNotification: false,
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('レスポンスにfeatureFlagsがない場合はエラーを返す', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          // featureFlags がない
        },
      }),
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.flags).toEqual({
      enableStaffSelection: false,
      enableStaffShiftManagement: false,
      enableCustomerManagement: false,
      enableReservationUpdate: false,
      enableReminderEmail: false,
      enableManualReservation: false,
      enableAnalyticsReport: false,
      enableRepeatRateAnalysis: false,
      enableCouponFeature: false,
      enableLineNotification: false,
    });
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
