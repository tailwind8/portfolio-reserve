import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('should render PENDING status with correct style and label', () => {
    render(<StatusBadge status="PENDING" />);

    const badge = screen.getByText('予約待ち');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800', 'border-yellow-200');
  });

  it('should render CONFIRMED status with correct style and label', () => {
    render(<StatusBadge status="CONFIRMED" />);

    const badge = screen.getByText('予約確定');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'border-green-200');
  });

  it('should render CANCELLED status with correct style and label', () => {
    render(<StatusBadge status="CANCELLED" />);

    const badge = screen.getByText('キャンセル');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-100', 'text-red-800', 'border-red-200');
  });

  it('should render COMPLETED status with correct style and label', () => {
    render(<StatusBadge status="COMPLETED" />);

    const badge = screen.getByText('完了');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800', 'border-blue-200');
  });

  it('should render NO_SHOW status with correct style and label', () => {
    render(<StatusBadge status="NO_SHOW" />);

    const badge = screen.getByText('来店なし');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
  });

  it('should apply additional className when provided', () => {
    render(<StatusBadge status="CONFIRMED" className="ml-2" />);

    const badge = screen.getByText('予約確定');
    expect(badge).toHaveClass('ml-2');
  });

  it('should have correct base classes for all statuses', () => {
    render(<StatusBadge status="PENDING" />);

    const badge = screen.getByText('予約待ち');
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'rounded-full',
      'border',
      'px-2.5',
      'py-0.5',
      'text-xs',
      'font-medium'
    );
  });
});
