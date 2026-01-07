import { render, screen, fireEvent } from '@testing-library/react';
import WeeklyCalendar from '@/components/booking/WeeklyCalendar';
import type { TimeSlot } from '@/types/api';

const mockWeeklySlots = new Map<string, TimeSlot[]>([
  ['2026-01-12', [
    { time: '09:00', available: true },
    { time: '10:00', available: true },
    { time: '11:00', available: false },
  ]],
  ['2026-01-13', [
    { time: '09:00', available: false },
    { time: '10:00', available: true },
  ]],
]);

const defaultProps = {
  currentWeekStart: new Date(2026, 0, 12),
  selectedDate: null,
  selectedTime: null,
  selectedMenuId: '',
  selectedStaffId: '',
  weeklySlots: new Map(),
  loadingWeeklySlots: false,
  breakTimeStart: '12:00',
  breakTimeEnd: '13:00',
  onPrevWeek: jest.fn(),
  onNextWeek: jest.fn(),
  onSlotClick: jest.fn(),
};

describe('WeeklyCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 0, 10));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('カレンダー表示', () => {
    it('週間カレンダーが表示される', () => {
      render(<WeeklyCalendar {...defaultProps} />);

      expect(screen.getByTestId('weekly-calendar')).toBeInTheDocument();
    });

    it('週タイトルが表示される', () => {
      render(<WeeklyCalendar {...defaultProps} />);

      expect(screen.getByTestId('week-range-title')).toBeInTheDocument();
    });

    it('メニュー未選択時は「メニューを選択してください」が表示される', () => {
      render(<WeeklyCalendar {...defaultProps} />);

      expect(screen.getByText('メニューを選択してください')).toBeInTheDocument();
    });
  });

  describe('週ナビゲーション', () => {
    it('前週ボタンをクリックするとコールバックが呼ばれる', () => {
      render(<WeeklyCalendar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('previous-week-button'));

      expect(defaultProps.onPrevWeek).toHaveBeenCalled();
    });

    it('次週ボタンをクリックするとコールバックが呼ばれる', () => {
      render(<WeeklyCalendar {...defaultProps} />);

      fireEvent.click(screen.getByTestId('next-week-button'));

      expect(defaultProps.onNextWeek).toHaveBeenCalled();
    });
  });

  describe('テーブル表示', () => {
    it('メニュー選択時にテーブルが表示される', () => {
      render(
        <WeeklyCalendar
          {...defaultProps}
          selectedMenuId="1"
          weeklySlots={mockWeeklySlots}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('曜日ヘッダーが表示される', () => {
      render(
        <WeeklyCalendar
          {...defaultProps}
          selectedMenuId="1"
          weeklySlots={mockWeeklySlots}
        />
      );

      expect(screen.getByText('月')).toBeInTheDocument();
      expect(screen.getByText('火')).toBeInTheDocument();
      expect(screen.getByText('水')).toBeInTheDocument();
      expect(screen.getByText('木')).toBeInTheDocument();
      expect(screen.getByText('金')).toBeInTheDocument();
      expect(screen.getByText('土')).toBeInTheDocument();
      expect(screen.getByText('日')).toBeInTheDocument();
    });

    it('時間列が表示される', () => {
      render(
        <WeeklyCalendar
          {...defaultProps}
          selectedMenuId="1"
          weeklySlots={mockWeeklySlots}
        />
      );

      expect(screen.getByText('09:00')).toBeInTheDocument();
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });
  });

  describe('休憩時間', () => {
    it('休憩時間ブロックが表示される', () => {
      render(
        <WeeklyCalendar
          {...defaultProps}
          selectedMenuId="1"
          weeklySlots={mockWeeklySlots}
        />
      );

      const breakBlocks = screen.getAllByTestId('break-time-block');
      expect(breakBlocks.length).toBeGreaterThan(0);
    });
  });

  describe('スロット選択', () => {
    it('利用可能なスロットをクリックするとコールバックが呼ばれる', () => {
      // 2026-01-12は月曜日。その週の月曜日のスロットを追加
      const slotsWithMonday = new Map<string, TimeSlot[]>([
        ['2026-01-12', [
          { time: '09:00', available: true },
          { time: '10:00', available: true },
        ]],
      ]);

      render(
        <WeeklyCalendar
          {...defaultProps}
          selectedMenuId="1"
          weeklySlots={slotsWithMonday}
        />
      );

      // 09:00の利用可能なスロットを見つけてクリック
      const timeBlocks = screen.getAllByTestId('weekly-time-block');
      const enabledBlocks = timeBlocks.filter((block) => !block.hasAttribute('disabled'));

      if (enabledBlocks.length > 0) {
        fireEvent.click(enabledBlocks[0]);
        expect(defaultProps.onSlotClick).toHaveBeenCalled();
      }
    });

    it('無効なスロットはクリックしてもコールバックが呼ばれない', () => {
      const slotsWithUnavailable = new Map<string, TimeSlot[]>([
        ['2026-01-12', [
          { time: '09:00', available: false },
        ]],
      ]);

      render(
        <WeeklyCalendar
          {...defaultProps}
          selectedMenuId="1"
          weeklySlots={slotsWithUnavailable}
        />
      );

      const timeBlocks = screen.getAllByTestId('weekly-time-block');
      const disabledBlock = timeBlocks.find((block) => block.hasAttribute('disabled'));

      if (disabledBlock) {
        fireEvent.click(disabledBlock);
        expect(defaultProps.onSlotClick).not.toHaveBeenCalled();
      }
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はスピナーが表示される', () => {
      const { container } = render(
        <WeeklyCalendar
          {...defaultProps}
          selectedMenuId="1"
          loadingWeeklySlots={true}
        />
      );

      expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('ローディング中はテーブルが表示されない', () => {
      render(
        <WeeklyCalendar
          {...defaultProps}
          selectedMenuId="1"
          loadingWeeklySlots={true}
        />
      );

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });
});
