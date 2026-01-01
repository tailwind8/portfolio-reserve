# OWASP API Security Top 10 対応表

このドキュメントは、OWASP API Security Top 10 (2023) とNext.js/TypeScriptプロジェクトにおける具体的な対策をマッピングします。

---

## API1:2023 - Broken Object Level Authorization (BOLA)

### 概要
ユーザーが権限のないオブジェクトにアクセスできる脆弱性。

### Next.jsでの対策

#### ❌ 脆弱な実装
```typescript
// app/api/admin/reservations/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // ❌ tenant_id チェックなし
  const reservation = await prisma.restaurantReservation.findUnique({
    where: { id: params.id },
  });

  return Response.json(reservation);
}
```

#### ✅ セキュアな実装
```typescript
// app/api/admin/reservations/[id]/route.ts
import { requireAuth } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request);
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ✅ tenant_id でフィルタリング
  const reservation = await prisma.restaurantReservation.findUnique({
    where: {
      id: params.id,
      tenant_id: session.tenantId, // 必須
    },
  });

  if (!reservation) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json(reservation);
}
```

---

## API2:2023 - Broken Authentication

### 概要
認証メカニズムの不備により、攻撃者が他のユーザーのアカウントを乗っ取ることができる。

### Next.jsでの対策

#### ❌ 脆弱な実装
```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const { email, password } = await request.json();

  // ❌ プレーンテキストでパスワード比較
  const user = await prisma.user.findUnique({
    where: { email, password }, // ❌ NG
  });

  if (user) {
    return Response.json({ token: 'simple-token' });
  }

  return Response.json({ error: 'Invalid credentials' }, { status: 401 });
}
```

#### ✅ セキュアな実装
```typescript
// app/api/auth/login/route.ts
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  // ✅ バリデーション
  const body = await request.json();
  const result = LoginSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { email, password } = result.data;

  // ✅ ハッシュ化されたパスワードで認証
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // ✅ セキュアなセッション作成
  const session = await createSession(user.id, user.tenant_id);

  return Response.json({ success: true });
}
```

---

## API3:2023 - Broken Object Property Level Authorization

### 概要
ユーザーが権限のないプロパティにアクセス・変更できる脆弱性。

### Next.jsでの対策

#### ❌ 脆弱な実装
```typescript
// app/api/users/[id]/route.ts
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();

  // ❌ すべてのプロパティを更新可能
  const user = await prisma.user.update({
    where: { id: params.id },
    data: body, // role, is_admin なども更新可能
  });

  return Response.json(user);
}
```

#### ✅ セキュアな実装
```typescript
// app/api/users/[id]/route.ts
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';

// ✅ 更新可能なフィールドのみ定義
const UpdateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await requireAuth(request);

  // ✅ 自分のアカウントのみ更新可能
  if (session.userId !== params.id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const result = UpdateUserSchema.safeParse(body);

  if (!result.success) {
    return Response.json({ error: result.error.flatten() }, { status: 400 });
  }

  // ✅ 許可されたフィールドのみ更新
  const user = await prisma.user.update({
    where: { id: params.id },
    data: result.data,
  });

  return Response.json(user);
}
```

---

## API4:2023 - Unrestricted Resource Consumption

### 概要
レート制限がないため、APIが大量のリクエストで過負荷になる。

### Next.jsでの対策

#### ✅ セキュアな実装
```typescript
// app/api/reservations/route.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10リクエスト/分
});

export async function POST(request: Request) {
  const identifier = getClientIp(request);

  // ✅ レート制限チェック
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return Response.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // 通常の処理
  // ...
}
```

---

## API5:2023 - Broken Function Level Authorization

### 概要
管理者機能が一般ユーザーからアクセス可能。

### Next.jsでの対策

#### ❌ 脆弱な実装
```typescript
// app/api/admin/users/route.ts
export async function GET(request: Request) {
  // ❌ 認証チェックなし
  const users = await prisma.user.findMany();
  return Response.json(users);
}
```

#### ✅ セキュアな実装
```typescript
// app/api/admin/users/route.ts
import { requireAdmin } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await requireAdmin(request);

  if (!session || !session.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ✅ 管理者のみアクセス可能
  const users = await prisma.user.findMany({
    where: { tenant_id: session.tenantId },
  });

  return Response.json(users);
}
```

---

## API6:2023 - Unrestricted Access to Sensitive Business Flows

### 概要
重要なビジネスフローが自動化ツールで悪用される。

### Next.jsでの対策

#### ✅ セキュアな実装
```typescript
// app/api/reservations/route.ts
import { verifyCaptcha } from '@/lib/captcha';

export async function POST(request: Request) {
  const body = await request.json();

  // ✅ CAPTCHA検証（予約作成時）
  const captchaToken = request.headers.get('x-captcha-token');
  if (!captchaToken || !(await verifyCaptcha(captchaToken))) {
    return Response.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
  }

  // 予約作成処理
  // ...
}
```

---

## API7:2023 - Server Side Request Forgery (SSRF)

### 概要
攻撃者がサーバーに任意のURLへのリクエストを送信させることができる。

### Next.jsでの対策

#### ❌ 脆弱な実装
```typescript
// app/api/fetch-image/route.ts
export async function GET(request: Request) {
  const url = request.nextUrl.searchParams.get('url');

  // ❌ 検証なしでリクエスト
  const response = await fetch(url!);
  const data = await response.json();

  return Response.json(data);
}
```

#### ✅ セキュアな実装
```typescript
// app/api/fetch-image/route.ts
const ALLOWED_DOMAINS = ['api.example.com', 'cdn.example.com'];

export async function GET(request: Request) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return Response.json({ error: 'URL required' }, { status: 400 });
  }

  try {
    const parsedUrl = new URL(url);

    // ✅ ホワイトリストチェック
    if (!ALLOWED_DOMAINS.includes(parsedUrl.hostname)) {
      return Response.json({ error: 'Invalid domain' }, { status: 400 });
    }

    // ✅ プライベートIPを拒否
    if (isPrivateIP(parsedUrl.hostname)) {
      return Response.json({ error: 'Private IP not allowed' }, { status: 400 });
    }

    const response = await fetch(url);
    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Invalid URL' }, { status: 400 });
  }
}
```

---

## API8:2023 - Security Misconfiguration

### 概要
セキュリティ設定の不備により、脆弱性が生じる。

### Next.jsでの対策

#### ✅ セキュアな設定

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

## API9:2023 - Improper Inventory Management

### 概要
APIのインベントリ管理不足により、古いバージョンや未使用のエンドポイントが残存。

### Next.jsでの対策

- [ ] APIエンドポイント一覧をドキュメント化
- [ ] 未使用のエンドポイントを削除
- [ ] バージョニング戦略の確立

---

## API10:2023 - Unsafe Consumption of APIs

### 概要
外部APIからのレスポンスを検証せずに使用。

### Next.jsでの対策

#### ❌ 脆弱な実装
```typescript
// app/api/external-data/route.ts
export async function GET() {
  const response = await fetch('https://external-api.com/data');
  const data = await response.json();

  // ❌ 検証なしでデータを保存
  await prisma.externalData.create({
    data: data,
  });

  return Response.json(data);
}
```

#### ✅ セキュアな実装
```typescript
// app/api/external-data/route.ts
import { z } from 'zod';

const ExternalDataSchema = z.object({
  id: z.string(),
  name: z.string().max(100),
  value: z.number().min(0).max(1000),
});

export async function GET() {
  const response = await fetch('https://external-api.com/data');
  const rawData = await response.json();

  // ✅ スキーマバリデーション
  const result = ExternalDataSchema.safeParse(rawData);

  if (!result.success) {
    console.error('Invalid external data:', result.error);
    return Response.json({ error: 'Invalid data' }, { status: 500 });
  }

  // ✅ 検証済みデータのみ保存
  await prisma.externalData.create({
    data: result.data,
  });

  return Response.json(result.data);
}
```

---

## チェックリストサマリー

| API Security リスク | 対策 | 実装状況 |
|--------------------|------|---------|
| API1: BOLA | tenant_idフィルタリング | [ ] |
| API2: Broken Authentication | bcrypt + セッション管理 | [ ] |
| API3: Broken Property Auth | Zodで許可フィールドのみ | [ ] |
| API4: Resource Consumption | レート制限 | [ ] |
| API5: Function Level Auth | requireAdmin | [ ] |
| API6: Business Flows | CAPTCHA | [ ] |
| API7: SSRF | URLホワイトリスト | [ ] |
| API8: Misconfiguration | セキュリティヘッダー | [ ] |
| API9: Inventory Management | API一覧ドキュメント | [ ] |
| API10: Unsafe API Consumption | 外部データバリデーション | [ ] |

---

## まとめ

OWASP API Security Top 10の各項目に対して、Next.js/TypeScriptプロジェクトで実装可能な具体的な対策を示しました。

定期的にこのチェックリストを確認し、セキュリティレベルを維持・向上させてください。
