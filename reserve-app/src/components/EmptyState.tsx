import Card from './Card';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/**
 * EmptyState - 空状態表示コンポーネント
 *
 * @param icon - 表示するアイコン（オプション）
 * @param title - タイトルテキスト
 * @param description - 説明テキスト（オプション）
 * @param action - アクションボタンなど（オプション）
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card>
      <div className="py-12 text-center">
        {icon && <div className="mx-auto h-12 w-12 text-gray-400">{icon}</div>}
        <p className="mt-4 text-lg font-medium text-gray-900">{title}</p>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </Card>
  );
}
