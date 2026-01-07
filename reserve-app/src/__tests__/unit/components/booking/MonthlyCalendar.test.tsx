import { render, screen, fireEvent } from '@testing-library/react';
import MonthlyCalendar from '@/components/booking/MonthlyCalendar';
import type { TimeSlot } from '@/types/api';

const mockAvailableSlots: TimeSlot[] = [
  { time: '09:00', available: true },
  { time: '10:00', available: true },
  { time: '11:00', available: false },
  { time: '12:00', available: true },
];

const defaultProps = {
  currentDate: new Date(2026, 0, 1),
  selectedDate: null,
  selectedTime: null,
  selectedMenuId: '',
  availableSlots: [],
  loadingSlots: false,
  onPrevMonth: jest.fn(),
  onNextMonth: jest.fn(),
  onDateClick: jest.fn(),
  onTimeClick: jest.fn(),
};

describe('MonthlyCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 10));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('カレンダー表示', () => {
    it('カレンダーが表示される', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      expect(screen.getByTestId('monthly-calendar')).toBeInTheDocument();
    });

    it('月タイトルが表示される', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      expect(screen.getByText('2026年1月')).toBeInTheDocument();
    });

    it('曜日ヘッダーが表示される', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      const weekdays = screen.getAllByTestId('calendar-weekday');
      expect(weekdays).toHaveLength(7);
      expect(weekdays[0]).toHaveTextContent('日');
      expect(weekdays[6]).toHaveTextContent('土');
    });

    it('日付グリッドが表示される', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      expect(screen.getByTestId('calendar-grid')).toBeInTheDocument();
    });
  });

  describe('月ナビゲーション', () => {
    it('前月ボタンをクリックするとコールバックが呼ばれる', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      fireEvent.click(screen.getByText('← 前月'));

      expect(defaultProps.onPrevMonth).toHaveBeenCalled();
    });

    it('次月ボタンをクリックするとコールバックが呼ばれる', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      fireEvent.click(screen.getByText('次月 →'));

      expect(defaultProps.onNextMonth).toHaveBeenCalled();
    });
  });

  describe('日付選択', () => {
    it('日付をクリックするとコールバックが呼ばれる', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      const day15 = screen.getByRole('button', { name: '15' });
      fireEvent.click(day15);

      expect(defaultProps.onDateClick).toHaveBeenCalledWith(15);
    });

    it('過去の日付は無効化される', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      const day5 = screen.getByRole('button', { name: '5' });
      expect(day5).toBeDisabled();
    });

    it('選択した日付にはスタイルが適用される', () => {
      const selectedDate = new Date(2026, 0, 15);
      render(<MonthlyCalendar {...defaultProps} selectedDate={selectedDate} />);

      const day15 = screen.getByRole('button', { name: '15' });
      expect(day15).toHaveClass('bg-blue-500', 'text-white');
    });
  });

  describe('時間スロット', () => {
    it('メニュー未選択時は「メニューを選択してください」が表示される', () => {
      render(<MonthlyCalendar {...defaultProps} />);

      expect(screen.getByText('メニューを選択してください')).toBeInTheDocument();
    });

    it('日付選択時に時間スロットセクションが表示される', () => {
      const selectedDate = new Date(2026, 0, 15);
      render(
        <MonthlyCalendar
          {...defaultProps}
          selectedDate={selectedDate}
          selectedMenuId="1"
          availableSlots={mockAvailableSlots}
        />
      );

      expect(screen.getByTestId('time-slots-section')).toBeInTheDocument();
    });

    it('時間スロットが表示される', () => {
      const selectedDate = new Date(2026, 0, 15);
      render(
        <MonthlyCalendar
          {...defaultProps}
          selectedDate={selectedDate}
          selectedMenuId="1"
          availableSlots={mockAvailableSlots}
        />
      );

      const slots = screen.getAllByTestId('time-slot');
      expect(slots).toHaveLength(4);
    });

    it('利用可能な時間スロットをクリックするとコールバックが呼ばれる', () => {
      const selectedDate = new Date(2026, 0, 15);
      render(
        <MonthlyCalendar
          {...defaultProps}
          selectedDate={selectedDate}
          selectedMenuId="1"
          availableSlots={mockAvailableSlots}
        />
      );

      const slots = screen.getAllByTestId('time-slot');
      fireEvent.click(slots[0]);

      expect(defaultProps.onTimeClick).toHaveBeenCalledWith('09:00', undefined);
    });

    it('利用不可の時間スロットは無効化される', () => {
      const selectedDate = new Date(2026, 0, 15);
      render(
        <MonthlyCalendar
          {...defaultProps}
          selectedDate={selectedDate}
          selectedMenuId="1"
          availableSlots={mockAvailableSlots}
        />
      );

      const slots = screen.getAllByTestId('time-slot');
      expect(slots[2]).toBeDisabled();
    });

    it('予約可能な時間がない場合はメッセージが表示される', () => {
      const selectedDate = new Date(2026, 0, 15);
      render(
        <MonthlyCalendar
          {...defaultProps}
          selectedDate={selectedDate}
          selectedMenuId="1"
          availableSlots={[]}
        />
      );

      expect(screen.getByText('この日は予約できる時間がありません')).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はスピナーが表示される', () => {
      const selectedDate = new Date(2026, 0, 15);
      const { container } = render(
        <MonthlyCalendar
          {...defaultProps}
          selectedDate={selectedDate}
          selectedMenuId="1"
          loadingSlots={true}
        />
      );

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });
});
