'use client';

import Card from '@/components/Card';

interface FeatureItemProps {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  description: string;
}

function FeatureItem({ icon, iconBgColor, title, description }: FeatureItemProps) {
  return (
    <Card padding="sm">
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBgColor} flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold text-gray-900">{title}</h4>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export default function BookingFeatures() {
  return (
    <div className="mt-12 grid gap-6 md:grid-cols-3">
      <FeatureItem
        icon={
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        iconBgColor="bg-green-100"
        title="24時間予約OK"
        description="いつでもオンラインで予約できます"
      />

      <FeatureItem
        icon={
          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        iconBgColor="bg-blue-100"
        title="確認メール送信"
        description="予約確定後すぐに送信されます"
      />

      <FeatureItem
        icon={
          <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        iconBgColor="bg-orange-100"
        title="リマインダー"
        description="予約日前日にメールでお知らせ"
      />
    </div>
  );
}
