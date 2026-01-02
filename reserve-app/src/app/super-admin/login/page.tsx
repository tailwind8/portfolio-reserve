'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { loginSchema } from '@/lib/validations';

// Form state type
type SuperAdminLoginFormData = {
  email: string;
  password: string;
};

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<SuperAdminLoginFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validate form data (email and password only)
    const validationResult = loginSchema.safeParse({
      email: formData.email,
      password: formData.password,
    });

    if (!validationResult.success) {
      const fieldErrors: Record<string, string> = {};
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/super-admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors && Array.isArray(data.errors)) {
          const fieldErrors: Record<string, string> = {};
          data.errors.forEach((error: { path?: string[]; message: string }) => {
            if (error.path && error.path.length > 0) {
              fieldErrors[error.path[0]] = error.message;
            }
          });
          setErrors(fieldErrors);
        } else {
          setErrors({
            general:
              data.error?.message || data.message || 'ログインに失敗しました',
          });
        }
        setIsLoading(false);
        return;
      }

      // Login successful - redirect to super admin dashboard
      router.push('/super-admin/dashboard');
      router.refresh(); // Refresh to update auth state
    } catch (error) {
      console.error('Super admin login error:', error);
      setErrors({
        general: '予期しないエラーが発生しました。もう一度お試しください。',
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center space-x-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500">
            <span className="text-xl font-bold text-white">S</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">
            予約システム - スーパー管理者
          </span>
        </Link>

        {/* Login Card */}
        <Card className="mb-6">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">
              スーパー管理者ログイン
            </h1>
            <p className="text-sm text-gray-600">
              開発者アカウントでログインしてください
            </p>
          </div>

          {/* Warning message */}
          <div
            data-testid="warning-message"
            className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-700"
          >
            ⚠️ このページは開発者専用です
          </div>

          {errors.general && (
            <div
              data-testid="error-message"
              className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600"
            >
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                data-testid="super-admin-email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="contact@tailwind8.com"
                className={`w-full rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                パスワード
              </label>
              <input
                id="password"
                name="password"
                data-testid="super-admin-password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500`}
                disabled={isLoading}
                autoComplete="current-password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={isLoading}
              data-testid="super-admin-login-button"
              className="bg-purple-500 hover:bg-purple-600"
            >
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">または</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div className="space-y-3 text-center text-sm">
            <Link
              href="/admin/login"
              className="block text-purple-500 hover:text-purple-600"
            >
              店舗管理者ログインはこちら
            </Link>
            <Link
              href="/login"
              className="block text-purple-500 hover:text-purple-600"
            >
              一般ユーザーログインはこちら
            </Link>
          </div>
        </Card>

        {/* Security notice */}
        <div className="text-center text-xs text-gray-500">
          <p>このログインページはスーパー管理者（開発者）専用です。</p>
          <p className="mt-1">
            不正アクセスは禁止されています。すべてのアクセスは記録されます。
          </p>
        </div>
      </div>
    </div>
  );
}
