# Next.js向けセキュリティチェックリスト

このドキュメントは、Next.js/TypeScriptプロジェクトのセキュリティレビュー時に使用するチェックリストです。

---

## 1. 認証・認可

### 1-1. 認証

- [ ] **セッション管理**
  - [ ] セッションIDは予測不可能な値を使用
  - [ ] セッションタイムアウトを設定（例: 30分）
  - [ ] ログアウト時にセッションを破棄
  - [ ] セッションIDをURLパラメータに含めない

- [ ] **パスワード管理**
  - [ ] パスワードはbcryptでハッシュ化（salt rounds: 10以上）
  - [ ] パスワードの最小長を8文字以上に設定
  - [ ] パスワードポリシーを適用（大文字、小文字、数字、記号）

- [ ] **認証エンドポイント**
  - [ ] ログイン試行回数を制限（例: 5回/10分）
  - [ ] ブルートフォース攻撃対策
  - [ ] アカウントロックアウト機能

---

### 1-2. 認可（アクセス制御）

- [ ] **ページレベル**
  - [ ] 未認証ユーザーの保護されたページへのアクセスを防止
  - [ ] ミドルウェアで認証チェックを実装
  - [ ] 管理者専用ページは役割ベースでアクセス制御

- [ ] **APIレベル**
  - [ ] すべてのAPI Routesで認証チェック
  - [ ] APIキーやトークンの検証
  - [ ] 権限不足時は403 Forbiddenを返す

- [ ] **データレベル**
  - [ ] tenant_idフィルタリングを必須化
  - [ ] ユーザーは自分のデータのみアクセス可能
  - [ ] 管理者は自テナントのデータのみアクセス可能

---

## 2. 入力バリデーション

### 2-1. サーバーサイドバリデーション

- [ ] **必須**
  - [ ] すべてのAPI Routesで入力バリデーション
  - [ ] Zodなどのバリデーションライブラリを使用
  - [ ] 型安全なバリデーション

- [ ] **バリデーション項目**
  - [ ] 必須項目チェック
  - [ ] 型チェック（文字列、数値、日付など）
  - [ ] 長さ制限（最小・最大）
  - [ ] 正規表現パターンマッチ（メールアドレス、電話番号など）
  - [ ] 範囲チェック（数値の最小・最大）

```typescript
// 例
import { z } from 'zod';

const CreateReservationSchema = z.object({
  customer_name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\d{2,4}-\d{2,4}-\d{4}$/),
  date_time: z.string().datetime(),
  guest_count: z.number().int().min(1).max(10),
});
```

---

### 2-2. クライアントサイドバリデーション

- [ ] **補助的な使用**
  - [ ] UX向上のため実装（エラー早期表示）
  - [ ] サーバーサイドバリデーションも必須

---

## 3. インジェクション対策

### 3-1. SQLインジェクション

- [ ] **Prisma使用時**
  - [ ] パラメータ化クエリを使用（Prismaデフォルト）
  - [ ] 生SQLの使用を避ける
  - [ ] 使用する場合は`prisma.$queryRaw`でパラメータ化

```typescript
// ✅ 安全
const users = await prisma.user.findMany({
  where: { email: userInput },
});

// ❌ 危険（生SQLは使用しない）
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${userInput}'`
);

// ✅ 安全（パラメータ化）
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput}
`;
```

---

### 3-2. XSS（クロスサイトスクリプティング）

- [ ] **サニタイゼーション**
  - [ ] `dangerouslySetInnerHTML`の使用を最小限に
  - [ ] 使用する場合はDOMPurifyでサニタイズ
  - [ ] ユーザー入力をそのままHTMLに埋め込まない

```typescript
// ❌ 危険
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ 安全
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userInput)
}} />

// ✅ 最も安全（React標準）
<div>{userInput}</div> // 自動エスケープ
```

- [ ] **Content Security Policy (CSP)**
  - [ ] CSPヘッダーを設定
  - [ ] インラインスクリプトを制限

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  }
];
```

---

### 3-3. コマンドインジェクション

- [ ] **シェルコマンド実行の回避**
  - [ ] `child_process.exec`の使用を避ける
  - [ ] 使用する場合は`child_process.execFile`でパラメータ化
  - [ ] ユーザー入力をシェルコマンドに含めない

---

## 4. CSRF対策

- [ ] **CSRFトークン**
  - [ ] すべてのPOST/PUT/DELETEリクエストでトークン検証
  - [ ] トークンはセッションごとに生成
  - [ ] トークンをHTTPヘッダーで送信

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      return NextResponse.json(
        { error: 'CSRF token missing' },
        { status: 403 }
      );
    }
  }
}
```

- [ ] **SameSite Cookie**
  - [ ] Cookieに`SameSite=Lax`または`SameSite=Strict`を設定

---

## 5. データ保護

### 5-1. 暗号化

- [ ] **保存時の暗号化**
  - [ ] パスワードはbcryptでハッシュ化
  - [ ] 機密データは暗号化して保存
  - [ ] データベースレベルの暗号化（TDE）

- [ ] **通信時の暗号化**
  - [ ] HTTPS必須
  - [ ] 本番環境でHTTPを無効化
  - [ ] HSTS（HTTP Strict Transport Security）を有効化

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  }
];
```

---

### 5-2. 機密情報の管理

- [ ] **環境変数**
  - [ ] `.env.local`をgitignoreに追加
  - [ ] 本番環境の環境変数は Vercel/環境変数管理ツールで管理
  - [ ] APIキーをコードにハードコードしない

```typescript
// ❌ 危険
const apiKey = 'sk-1234567890abcdef';

// ✅ 安全
const apiKey = process.env.API_KEY;
```

- [ ] **クライアント漏洩防止**
  - [ ] クライアントで環境変数を使用しない
  - [ ] `NEXT_PUBLIC_`プレフィックスは公開情報のみ

```typescript
// ❌ クライアントで使用（バンドルに含まれる）
'use client';
const apiKey = process.env.API_KEY;

// ✅ サーバーのみで使用
// Server Component または API Route
const apiKey = process.env.API_KEY;
```

---

## 6. セッション管理

- [ ] **セキュアなCookie**
  - [ ] `HttpOnly`フラグを設定
  - [ ] `Secure`フラグを設定（HTTPS）
  - [ ] `SameSite=Lax`または`SameSite=Strict`を設定

```typescript
// 例: iron-sessionの設定
export const sessionOptions = {
  password: process.env.SECRET_COOKIE_PASSWORD,
  cookieName: 'session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 1800, // 30分
  },
};
```

- [ ] **セッション固定攻撃対策**
  - [ ] ログイン後にセッションIDを再生成

---

## 7. マルチテナント分離

- [ ] **データ分離**
  - [ ] すべてのクエリに`tenant_id`フィルタを追加
  - [ ] URLパラメータでの`tenant_id`指定を無視
  - [ ] セッションから`tenant_id`を取得

```typescript
// ❌ 危険（URLパラメータから取得）
const tenantId = request.nextUrl.searchParams.get('tenant_id');

// ✅ 安全（セッションから取得）
const session = await getSession(request);
const tenantId = session.tenantId;

// ✅ 必ずフィルタリング
const reservations = await prisma.restaurantReservation.findMany({
  where: {
    tenant_id: tenantId,
    // ...
  },
});
```

---

## 8. レート制限

- [ ] **APIエンドポイント**
  - [ ] ログインAPI: 5回/10分
  - [ ] 予約API: 10回/分
  - [ ] その他API: 100回/分

- [ ] **実装方法**
  - [ ] `@upstash/ratelimit` などのライブラリを使用
  - [ ] IPアドレスまたはユーザーIDでレート制限

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
});

export async function POST(request: Request) {
  const identifier = getClientIp(request);
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return Response.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
  }

  // ...
}
```

---

## 9. エラーハンドリング

- [ ] **エラーメッセージ**
  - [ ] スタックトレースを本番環境で非表示
  - [ ] 詳細なエラー情報を外部に漏らさない
  - [ ] ユーザーフレンドリーなエラーメッセージ

```typescript
// ❌ 危険（詳細な内部エラーを返す）
catch (error) {
  return Response.json({ error: error.message }, { status: 500 });
}

// ✅ 安全
catch (error) {
  console.error('Internal error:', error); // ログに記録
  return Response.json(
    { error: 'An error occurred. Please try again.' },
    { status: 500 }
  );
}
```

---

## 10. 依存関係の管理

- [ ] **定期的な監査**
  - [ ] `npm audit`を定期実行
  - [ ] Snykなどのツールを使用
  - [ ] Dependabotを有効化

- [ ] **バージョン管理**
  - [ ] 最新の安定版を使用
  - [ ] 既知の脆弱性があるパッケージを更新

---

## 11. セキュアコーディング

- [ ] **禁止パターン**
  - [ ] `eval()` を使用しない
  - [ ] `new Function()` を使用しない
  - [ ] `dangerouslySetInnerHTML` を最小限に
  - [ ] `process.env.*` をクライアントで使用しない

- [ ] **TypeScript strict mode**
  - [ ] `tsconfig.json`で`"strict": true`を設定
  - [ ] `any`型を避ける

---

## 12. ロギングとモニタリング

- [ ] **ログ記録**
  - [ ] 認証失敗をログに記録
  - [ ] セキュリティイベントをログに記録
  - [ ] 機密情報（パスワード、トークン）をログに含めない

- [ ] **モニタリング**
  - [ ] 異常なアクセスパターンを検出
  - [ ] セキュリティアラートを設定

---

## 13. テスト

- [ ] **セキュリティテスト**
  - [ ] 認証バイパステスト
  - [ ] XSS/CSRFテスト
  - [ ] SQLインジェクションテスト
  - [ ] テナント分離テスト

---

## チェックリスト使用方法

### PRレビュー時

1. 変更されたファイルごとに該当項目をチェック
2. 新しいAPI Routesは特に重点的にチェック
3. セキュリティ関連の変更はダブルチェック

### 定期監査

- 月1回: 全体的なセキュリティレビュー
- 四半期ごと: 依存関係の脆弱性スキャン
- 年1回: ペネトレーションテスト（推奨）

---

## 参考リンク

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/authentication)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
