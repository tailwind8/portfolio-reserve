import { registerSchema, loginSchema } from '@/lib/validations';

describe('Authentication Validations', () => {
  describe('registerSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate registration without phone (optional field)', () => {
      const validData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('名前を入力してください');
      }
    });

    it('should reject invalid email', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'invalid-email',
        phone: '090-1234-5678',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください');
      }
    });

    it('should reject password shorter than 8 characters', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'pass123',
        passwordConfirm: 'pass123',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードは8文字以上で入力してください'
        );
      }
    });

    it('should reject password without lowercase letters', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'PASSWORD123!',
        passwordConfirm: 'PASSWORD123!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードには少なくとも1つの小文字英字を含めてください'
        );
      }
    });

    it('should reject password without uppercase letters', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'password123!',
        passwordConfirm: 'password123!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードには少なくとも1つの大文字英字を含めてください'
        );
      }
    });

    it('should reject password without numbers', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'Password!',
        passwordConfirm: 'Password!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードには少なくとも1つの数字を含めてください'
        );
      }
    });

    it('should reject password without symbols', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'Password123',
        passwordConfirm: 'Password123',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'パスワードには少なくとも1つの記号（!@#$%^&*など）を含めてください'
        );
      }
    });

    it('should reject mismatched passwords', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'Password123!',
        passwordConfirm: 'Password456!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('パスワードが一致しません');
      }
    });

    it('should reject when terms not accepted', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '090-1234-5678',
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        termsAccepted: false,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          '利用規約に同意してください'
        );
      }
    });

    it('should accept valid Japanese phone numbers', () => {
      const validPhoneNumbers = [
        '090-1234-5678',
        '09012345678',
        '03-1234-5678',
        '0312345678',
      ];

      validPhoneNumbers.forEach((phone) => {
        const data = {
          name: '山田太郎',
          email: 'yamada@example.com',
          phone,
          password: 'Password123!',
          passwordConfirm: 'Password123!',
          termsAccepted: true,
        };

        const result = registerSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidData = {
        name: '山田太郎',
        email: 'yamada@example.com',
        phone: '123-456', // Too short
        password: 'Password123!',
        passwordConfirm: 'Password123!',
        termsAccepted: true,
      };

      const result = registerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効な電話番号を入力してください（例: 090-1234-5678）');
      }
    });
  });

  describe('loginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'yamada@example.com',
        password: 'password123',
        remember: false,
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate login data with remember flag', () => {
      const validData = {
        email: 'yamada@example.com',
        password: 'password123',
        remember: true,
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate login data without remember field (optional)', () => {
      const validData = {
        email: 'yamada@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効なメールアドレスを入力してください');
      }
    });

    it('should reject empty password', () => {
      const invalidData = {
        email: 'yamada@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('パスワードを入力してください');
      }
    });

    it('should reject missing email', () => {
      const invalidData = {
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing password', () => {
      const invalidData = {
        email: 'yamada@example.com',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
