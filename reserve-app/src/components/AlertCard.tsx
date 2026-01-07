'use client';

import Card from './Card';

interface AlertCardProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

const alertStyles = {
  error: {
    card: 'border-red-200 bg-red-50',
    text: 'text-red-700',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  success: {
    card: 'border-green-200 bg-green-50',
    text: 'text-green-700',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    card: 'border-yellow-200 bg-yellow-50',
    text: 'text-yellow-700',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  info: {
    card: 'border-blue-200 bg-blue-50',
    text: 'text-blue-700',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
};

/**
 * 共通のアラートカードコンポーネント
 */
export function AlertCard({ type, message, className = '' }: AlertCardProps) {
  const styles = alertStyles[type];

  return (
    <Card className={`${styles.card} ${className}`} data-testid={`alert-${type}`}>
      <div className={`flex items-center gap-3 ${styles.text}`}>
        <svg
          className="h-5 w-5 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={styles.icon}
          />
        </svg>
        <p>{message}</p>
      </div>
    </Card>
  );
}
