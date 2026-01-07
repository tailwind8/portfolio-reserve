import { render, screen, fireEvent } from '@testing-library/react';
import BookingSidebar from '@/components/booking/BookingSidebar';
import type { Menu, Staff } from '@/types/api';

const mockMenus: Menu[] = [
  { id: '1', name: 'カット', duration: 30, price: 3000, description: '' },
  { id: '2', name: 'カラー', duration: 60, price: 8000, description: '' },
];

const mockStaff: Staff[] = [
  { id: 's1', name: '山田太郎', role: 'スタイリスト', email: 'yamada@example.com' },
  { id: 's2', name: '鈴木花子', role: 'アシスタント', email: 'suzuki@example.com' },
];

const defaultProps = {
  selectedDate: null,
  selectedTime: null,
  selectedMenuId: '',
  selectedStaffId: '',
  notes: '',
  couponCode: '',
  menus: mockMenus,
  staff: mockStaff,
  featureFlags: null,
  submitting: false,
  onMenuChange: jest.fn(),
  onStaffChange: jest.fn(),
  onNotesChange: jest.fn(),
  onCouponChange: jest.fn(),
  onSubmit: jest.fn(),
};

describe('BookingSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本表示', () => {
    it('サイドバーが表示される', () => {
      render(<BookingSidebar {...defaultProps} />);

      expect(screen.getByTestId('booking-info-sidebar')).toBeInTheDocument();
      expect(screen.getByText('予約情報')).toBeInTheDocument();
    });

    it('日付未選択の状態が表示される', () => {
      render(<BookingSidebar {...defaultProps} />);

      expect(screen.getByTestId('selected-date')).toHaveTextContent('日付未選択');
      expect(screen.getByTestId('selected-time')).toHaveTextContent('時間未選択');
    });

    it('選択した日付と時間が表示される', () => {
      const selectedDate = new Date(2026, 0, 15);
      render(
        <BookingSidebar
          {...defaultProps}
          selectedDate={selectedDate}
          selectedTime="10:00"
        />
      );

      expect(screen.getByTestId('selected-date')).toHaveTextContent('2026年1月15日（木）');
      expect(screen.getByTestId('selected-time')).toHaveTextContent('10:00');
    });
  });

  describe('メニュー選択', () => {
    it('メニュー一覧が表示される', () => {
      render(<BookingSidebar {...defaultProps} />);

      expect(screen.getByRole('option', { name: /カット/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /カラー/ })).toBeInTheDocument();
    });

    it('メニュー変更時にコールバックが呼ばれる', () => {
      render(<BookingSidebar {...defaultProps} />);

      const select = screen.getByLabelText('メニュー');
      fireEvent.change(select, { target: { value: '1' } });

      expect(defaultProps.onMenuChange).toHaveBeenCalledWith('1');
    });

    it('選択したメニューの料金と所要時間が表示される', () => {
      render(<BookingSidebar {...defaultProps} selectedMenuId="1" />);

      expect(screen.getByText('¥3,000')).toBeInTheDocument();
      expect(screen.getByText('30分')).toBeInTheDocument();
    });
  });

  describe('スタッフ選択', () => {
    it('featureFlagsが無効の場合、スタッフ選択が表示されない', () => {
      render(<BookingSidebar {...defaultProps} />);

      expect(screen.queryByLabelText('担当者')).not.toBeInTheDocument();
    });

    it('featureFlagsが有効の場合、スタッフ選択が表示される', () => {
      render(
        <BookingSidebar
          {...defaultProps}
          featureFlags={{ enableStaffSelection: true, enableCouponFeature: false }}
        />
      );

      expect(screen.getByLabelText('担当者')).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /山田太郎/ })).toBeInTheDocument();
    });

    it('スタッフ変更時にコールバックが呼ばれる', () => {
      render(
        <BookingSidebar
          {...defaultProps}
          featureFlags={{ enableStaffSelection: true, enableCouponFeature: false }}
        />
      );

      const select = screen.getByLabelText('担当者');
      fireEvent.change(select, { target: { value: 's1' } });

      expect(defaultProps.onStaffChange).toHaveBeenCalledWith('s1');
    });
  });

  describe('備考入力', () => {
    it('備考テキストエリアが表示される', () => {
      render(<BookingSidebar {...defaultProps} />);

      expect(screen.getByLabelText(/備考/)).toBeInTheDocument();
    });

    it('備考変更時にコールバックが呼ばれる', () => {
      render(<BookingSidebar {...defaultProps} />);

      const textarea = screen.getByLabelText(/備考/);
      fireEvent.change(textarea, { target: { value: 'テスト備考' } });

      expect(defaultProps.onNotesChange).toHaveBeenCalledWith('テスト備考');
    });

    it('文字数カウントが表示される', () => {
      render(<BookingSidebar {...defaultProps} notes="テスト" />);

      expect(screen.getByText('3/500文字')).toBeInTheDocument();
    });
  });

  describe('クーポンコード', () => {
    it('featureFlagsが無効の場合、クーポン入力が表示されない', () => {
      render(<BookingSidebar {...defaultProps} />);

      expect(screen.queryByTestId('coupon-input')).not.toBeInTheDocument();
    });

    it('featureFlagsが有効の場合、クーポン入力が表示される', () => {
      render(
        <BookingSidebar
          {...defaultProps}
          featureFlags={{ enableStaffSelection: false, enableCouponFeature: true }}
        />
      );

      expect(screen.getByTestId('coupon-input')).toBeInTheDocument();
    });

    it('クーポン変更時にコールバックが呼ばれる', () => {
      render(
        <BookingSidebar
          {...defaultProps}
          featureFlags={{ enableStaffSelection: false, enableCouponFeature: true }}
        />
      );

      const input = screen.getByTestId('coupon-input');
      fireEvent.change(input, { target: { value: 'DISCOUNT10' } });

      expect(defaultProps.onCouponChange).toHaveBeenCalledWith('DISCOUNT10');
    });
  });

  describe('送信ボタン', () => {
    it('必須項目が未入力の場合、ボタンが無効になる', () => {
      render(<BookingSidebar {...defaultProps} />);

      const button = screen.getByTestId('submit-button');
      expect(button).toBeDisabled();
    });

    it('必須項目が入力済みの場合、ボタンが有効になる', () => {
      render(
        <BookingSidebar
          {...defaultProps}
          selectedDate={new Date()}
          selectedTime="10:00"
          selectedMenuId="1"
        />
      );

      const button = screen.getByTestId('submit-button');
      expect(button).not.toBeDisabled();
    });

    it('送信中はボタンが無効になり、テキストが変わる', () => {
      render(
        <BookingSidebar
          {...defaultProps}
          selectedDate={new Date()}
          selectedTime="10:00"
          selectedMenuId="1"
          submitting={true}
        />
      );

      const button = screen.getByTestId('submit-button');
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent('予約中...');
    });

    it('送信ボタンクリックでコールバックが呼ばれる', () => {
      render(
        <BookingSidebar
          {...defaultProps}
          selectedDate={new Date()}
          selectedTime="10:00"
          selectedMenuId="1"
        />
      );

      const button = screen.getByTestId('submit-button');
      fireEvent.click(button);

      expect(defaultProps.onSubmit).toHaveBeenCalled();
    });
  });

  describe('キャンセル情報', () => {
    it('キャンセル・変更の案内が表示される', () => {
      render(<BookingSidebar {...defaultProps} />);

      expect(screen.getByText('予約のキャンセル・変更')).toBeInTheDocument();
      expect(screen.getByText(/予約日の前日まで可能/)).toBeInTheDocument();
    });
  });
});
