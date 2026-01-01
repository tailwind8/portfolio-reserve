# セキュアコーディングパターン集

このドキュメントは、Next.js/TypeScriptプロジェクトでよく使うセキュアなコーディングパターンを示します。

---

## 1. 認証・認可パターン

### 1-1. requireAuth（認証必須）

```typescript
// lib/auth.ts
import { cookies } from 'next/headers';
import { verifySession } from './session';

export async function requireAuth(request?: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('session')?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);
  return session;
}

// 使用例
// app/api/admin/dashboard/route.ts
export async function GET(request: Request) {
  const session = await requireAuth();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 認証済みユーザーのみアクセス可能
  return Response.json({ userId: session.userId });
}
```

---

### 1-2. requireAdmin（管理者のみ）

```typescript
// lib/auth.ts
export async function requireAdmin(request?: Request) {
  const session = await requireAuth(request);

  if (!session || !session.isAdmin) {
    return null;
  }

  return session;
}

// 使用例
// app/api/admin/users/route.ts
export async function GET(request: Request) {
  const session = await requireAdmin();

  if (!session) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 管理者のみアクセス可能
  const users = await prisma.user.findMany({
    where: { tenant_id: session.tenantId },
  });

  return Response.json(users);
}
```

---

### 1-3. テナント分離パターン

```typescript
// lib/prisma-helpers.ts
import { PrismaClient } from '@prisma/client';

export class TenantPrismaClient {
  constructor(
    private prisma: PrismaClient,
    private tenantId: string
  ) {}

  // 予約の取得（自動的にtenant_idでフィルタリング）
  async findManyReservations(where: any = {}) {
    return this.prisma.restaurantReservation.findMany({
      where: {
        ...where,
        tenant_id: this.tenantId, // 自動追加
      },
    });
  }

  async findUniqueReservation(id: string) {
    return this.prisma.restaurantReservation.findUnique({
      where: {
        id,
        tenant_id: this.tenantId, // 自動追加
      },
    });
  }

  // その他のメソッドも同様に実装
}

// 使用例
// app/api/admin/reservations/route.ts
export async function GET(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantPrisma = new TenantPrismaClient(prisma, session.tenantId);

  // ✅ 自動的にtenant_idでフィルタリング
  const reservations = await tenantPrisma.findManyReservations({
    where: { status: 'pending' },
  });

  return Response.json(reservations);
}
```

---

## 2. バリデーションパターン

### 2-1. Zodバリデーション（API Routes）

```typescript
// lib/validations.ts
import { z } from 'zod';

export const CreateReservationSchema = z.object({
  customer_name: z.string().min(1, '名前を入力してください').max(100),
  email: z.string().email('正しいメールアドレスを入力してください'),
  phone: z.string().regex(
    /^\d{2,4}-\d{2,4}-\d{4}$/,
    '正しい電話番号を入力してください（例: 03-1234-5678）'
  ),
  date_time: z.string().datetime('正しい日時を入力してください'),
  guest_count: z.number().int().min(1, '1人以上を選択してください').max(10, '10人以下を選択してください'),
  notes: z.string().max(500, '備考は500文字以内にしてください').optional(),
});

export type CreateReservationInput = z.infer<typeof CreateReservationSchema>;

// 使用例
// app/api/reservations/route.ts
import { CreateReservationSchema } from '@/lib/validations';

export async function POST(request: Request) {
  const body = await request.json();

  // ✅ バリデーション
  const result = CreateReservationSchema.safeParse(body);

  if (!result.success) {
    return Response.json(
      { error: result.error.flatten() },
      { status: 400 }
    );
  }

  // ✅ 型安全なデータ
  const reservation = await prisma.restaurantReservation.create({
    data: {
      ...result.data,
      tenant_id: session.tenantId,
    },
  });

  return Response.json(reservation);
}
```

---

### 2-2. サニタイゼーションパターン

```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

/**
 * HTMLをサニタイズ
 */
export function sanitizeHtml(dirtyHtml: string): string {
  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href'],
  });
}

/**
 * テキストのみを抽出（HTMLタグを除去）
 */
export function stripHtml(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
}

// 使用例
// app/api/reservations/route.ts
import { sanitizeHtml, stripHtml } from '@/lib/sanitize';

export async function POST(request: Request) {
  const { notes } = await request.json();

  // ✅ サニタイズ
  const sanitizedNotes = stripHtml(notes);

  const reservation = await prisma.restaurantReservation.create({
    data: {
      // ...
      notes: sanitizedNotes,
    },
  });

  return Response.json(reservation);
}
```

---

## 3. エラーハンドリングパターン

### 3-1. 安全なエラーレスポンス

```typescript
// lib/api-response.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public expose: boolean = false
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    // ✅ エクスポーズ可能なエラーのみ返す
    if (error.expose) {
      return Response.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
  }

  // ✅ 内部エラーは詳細を隠す
  console.error('Internal API error:', error);
  return Response.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  );
}

// 使用例
// app/api/reservations/route.ts
export async function POST(request: Request) {
  try {
    // ...

    if (!session) {
      throw new ApiError(401, 'Unauthorized', true); // expose
    }

    // ...

  } catch (error) {
    return handleApiError(error);
  }
}
```

---

## 4. セッション管理パターン

### 4-1. iron-sessionを使用

```typescript
// lib/session.ts
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId: string;
  tenantId: string;
  isAdmin: boolean;
}

export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD!,
  cookieName: 'session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 1800, // 30分
  },
};

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  return session;
}

export async function createSession(userId: string, tenantId: string, isAdmin: boolean) {
  const session = await getSession();

  session.userId = userId;
  session.tenantId = tenantId;
  session.isAdmin = isAdmin;

  await session.save();
}

export async function destroySession() {
  const session = await getSession();
  session.destroy();
}

// 使用例
// app/api/auth/login/route.ts
import { createSession } from '@/lib/session';

export async function POST(request: Request) {
  // 認証処理
  // ...

  // ✅ セッション作成
  await createSession(user.id, user.tenant_id, user.is_admin);

  return Response.json({ success: true });
}
```

---

## 5. レート制限パターン

### 5-1. Upstash Rate Limitを使用

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

// ログインAPI: 5回/10分
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: true,
});

// 予約API: 10回/分
export const reservationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
});

// 一般API: 100回/分
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
});

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

// 使用例
// app/api/auth/login/route.ts
import { loginRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const identifier = getClientIp(request);

  // ✅ レート制限チェック
  const { success, limit, reset, remaining } = await loginRateLimit.limit(identifier);

  if (!success) {
    return Response.json(
      {
        error: `Too many login attempts. Please try again in ${Math.ceil((reset - Date.now()) / 1000 / 60)} minutes.`,
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
        },
      }
    );
  }

  // 認証処理
  // ...
}
```

---

## 6. CSRFトークンパターン

### 6-1. ミドルウェアでCSRF検証

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyCsrfToken } from './lib/csrf';

export async function middleware(request: NextRequest) {
  // POST/PUT/DELETEリクエストでCSRFトークンを検証
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token');

    if (!csrfToken || !(await verifyCsrfToken(csrfToken))) {
      return NextResponse.json(
        { error: 'CSRF token missing or invalid' },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

```typescript
// lib/csrf.ts
import crypto from 'crypto';
import { getSession } from './session';

export async function generateCsrfToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const session = await getSession();
  session.csrfToken = token;
  await session.save();
  return token;
}

export async function verifyCsrfToken(token: string): Promise<boolean> {
  const session = await getSession();
  return session.csrfToken === token;
}
```

---

## 7. SQLインジェクション防止パターン

### 7-1. Prismaパラメータ化クエリ

```typescript
// ✅ 安全（Prismaデフォルト）
const users = await prisma.user.findMany({
  where: {
    email: userInput, // 自動的にエスケープ
  },
});

// ✅ 安全（パラメータ化Raw Query）
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;

// ❌ 危険（絶対に使用しない）
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'`
);
```

---

## 8. パスワードハッシュ化パターン

### 8-1. bcrypt使用

```typescript
// lib/password.ts
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * パスワードをハッシュ化
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * パスワードを検証
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// 使用例
// app/api/auth/register/route.ts
import { hashPassword } from '@/lib/password';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // ✅ ハッシュ化
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword, // ハッシュ化されたパスワード
    },
  });

  return Response.json({ id: user.id });
}
```

---

## 9. 環境変数管理パターン

### 9-1. サーバーのみで使用

```typescript
// ✅ サーバーのみ（Server Component、API Route）
const apiKey = process.env.API_KEY;

// ❌ クライアントで使用（バンドルに含まれる）
'use client';
const apiKey = process.env.API_KEY; // NG
```

### 9-2. NEXT_PUBLIC_プレフィックス

```typescript
// クライアントで使用する公開情報のみ
'use client';

const publicApiUrl = process.env.NEXT_PUBLIC_API_URL; // OK
```

---

## 10. ファイルアップロードパターン

### 10-1. セキュアなファイルアップロード

```typescript
// app/api/upload/route.ts
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return Response.json({ error: 'File required' }, { status: 400 });
  }

  // ✅ ファイルタイプチェック
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // ✅ ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File too large' }, { status: 400 });
  }

  // ✅ ランダムなファイル名を生成
  const ext = path.extname(file.name);
  const filename = `${crypto.randomUUID()}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join('/uploads', filename), buffer);

  return Response.json({ filename });
}
```

---

## まとめ

これらのセキュアコーディングパターンを適用することで、Next.js/TypeScriptプロジェクトのセキュリティを大幅に向上させることができます。

各パターンをプロジェクトの要件に合わせてカスタマイズして使用してください。
