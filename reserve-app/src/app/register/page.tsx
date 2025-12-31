'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Card from '@/components/Card';
import { registerSchema } from '@/lib/validations';

// Form state type (different from validation input type)
type RegisterFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  passwordConfirm: string;
  termsAccepted: boolean;
};

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
    setSuccessMessage('');
    setIsLoading(true);

    // Validate form data
    const validationResult = registerSchema.safeParse(formData);
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
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
          termsAccepted: formData.termsAccepted,
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
          setErrors({ general: data.message || 'Registration failed' });
        }
        setIsLoading(false);
        return;
      }

      // Registration successful
      setSuccessMessage(
        data.data.message || 'Registration successful! Redirecting to login...'
      );

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center space-x-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500">
            <span className="text-xl font-bold text-white">R</span>
          </div>
          <span className="text-2xl font-bold text-gray-900">予約システム</span>
        </Link>

        {/* Register Card */}
        <Card className="mb-6">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">新規登録</h1>
            <p className="text-sm text-gray-600">アカウントを作成して予約を始めましょう</p>
          </div>

          {errors.general && (
            <div
              data-testid="error-message"
              className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600"
            >
              {errors.general}
            </div>
          )}

          {successMessage && (
            <div
              data-testid="success-message"
              className="mb-4 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-600"
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                お名前 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                data-testid="register-name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="山田 太郎"
                className={`w-full rounded-lg border ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.name && (
                <p data-testid="error-name" className="mt-1 text-xs text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                data-testid="register-email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className={`w-full rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.email && (
                <p data-testid="error-email" className="mt-1 text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                電話番号
              </label>
              <input
                id="phone"
                data-testid="register-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="090-1234-5678"
                className={`w-full rounded-lg border ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.phone && (
                <p data-testid="error-phone" className="mt-1 text-xs text-red-500">
                  {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                パスワード <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                data-testid="register-password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="8文字以上"
                className={`w-full rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                8文字以上の英数字を含めてください
              </p>
              {errors.password && (
                <p data-testid="error-password" className="mt-1 text-xs text-red-500">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="passwordConfirm"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                パスワード（確認） <span className="text-red-500">*</span>
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                data-testid="register-password-confirm"
                type="password"
                value={formData.passwordConfirm}
                onChange={handleChange}
                placeholder="パスワードを再入力"
                className={`w-full rounded-lg border ${
                  errors.passwordConfirm ? 'border-red-500' : 'border-gray-300'
                } px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                disabled={isLoading}
              />
              {errors.passwordConfirm && (
                <p data-testid="error-passwordConfirm" className="mt-1 text-xs text-red-500">
                  {errors.passwordConfirm}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-start">
                <input
                  id="termsAccepted"
                  name="termsAccepted"
                data-testid="register-terms"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <label htmlFor="termsAccepted" className="ml-2 text-sm text-gray-700">
                  <Link href="/terms" className="text-blue-500 hover:text-blue-600">
                    利用規約
                  </Link>
                  と
                  <Link href="/privacy" className="text-blue-500 hover:text-blue-600">
                    プライバシーポリシー
                  </Link>
                  に同意します <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.termsAccepted && (
                <p data-testid="error-termsAccepted" className="mt-1 text-xs text-red-500">
                  {errors.termsAccepted}
                </p>
              )}
            </div>

            <Button fullWidth size="lg" disabled={isLoading} data-testid="register-submit">
              {isLoading ? '登録中...' : 'アカウントを作成'}
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
              Googleで登録
            </button>
          </div>
        </Card>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600">
          既にアカウントをお持ちですか？{' '}
          <Link href="/login" className="font-medium text-blue-500 hover:text-blue-600">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
