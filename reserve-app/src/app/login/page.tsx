'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { loginSchema } from '@/lib/validations';

// Form state type (different from validation input type)
type LoginFormData = {
  email: string;
  password: string;
  remember: boolean;
};

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

    // Validate form data
    const validationResult = loginSchema.safeParse(formData);
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
      const response = await fetch('/api/auth/login', {
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
          setErrors({ general: data.message || 'Login failed' });
        }
        setIsLoading(false);
        return;
      }

      // Login successful - redirect to dashboard/home
      router.push('/');
      router.refresh(); // Refresh to update auth state
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center space-x-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-xl font-bold text-white">R</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">予約システム</span>
        </Link>

        {/* Login Card */}
        <Card className="mb-6">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">ログイン</h1>
            <p className="text-sm text-gray-600">アカウントにログインしてください</p>
          </div>

          {errors.general && (
            <div data-testid="error-message" className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                data-testid="login-email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className={`w-full rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  パスワード
                </label>
                <Link href="/reset-password" className="text-sm text-blue-500 hover:text-blue-600">
                  お忘れですか？
                </Link>
              </div>
              <input
                id="password"
                name="password"
                data-testid="login-password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                data-testid="login-remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                ログイン状態を保持する
              </label>
            </div>

            <Button fullWidth size="lg" disabled={isLoading} data-testid="login-submit">
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">または</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでログイン
            </button>
          </div>
        </Card>

        {/* Sign Up Link */}
        <p className="text-center text-sm text-gray-600">
          アカウントをお持ちでないですか？{' '}
          <Link href="/register" className="font-medium text-blue-500 hover:text-blue-600">
            新規登録
          </Link>
        </p>

        {/* Admin Login Link */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="mb-2 text-sm font-medium text-gray-700">店舗管理者の方</p>
          <Link href="/admin/login" className="text-sm text-blue-500 hover:text-blue-600">
            管理者ログインはこちら →
          </Link>
        </div>
      </div>
    </div>
  );
}
