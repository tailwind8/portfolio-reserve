# TypeScript リーダブルコード ガイドライン

LLMがTypeScriptコードを生成する際に従うべきルール集。
「リーダブルコード」の原則をTypeScriptに適用した実践的なガイドライン。

---

## 基本原則

**コードは他の開発者が最短時間で理解できるように書く。**

「他の開発者」には、数ヶ月後にコードを読み返す自分自身も含まれる。

---

## 1. 命名規則

### 1.1 明確で具体的な名前を使う

```typescript
// ❌ 曖昧な名前
function getData() { ... }
function process() { ... }
const value = 10;

// ✅ 具体的な名前
function fetchUserProfile() { ... }
function validateEmailFormat() { ... }
const maxRetryCount = 10;
```

### 1.2 汎用的な名前を避ける

`tmp`, `data`, `result`, `value`, `info` などの汎用名は、スコープが極めて小さい場合のみ許容する。

```typescript
// ❌ 汎用的すぎる
const data = await fetch('/api/users');
const result = data.json();

// ✅ 具体的
const userResponse = await fetch('/api/users');
const users = userResponse.json();
```

### 1.3 ループ変数の命名

```typescript
// ❌ 意味不明なループ変数
for (let i = 0; i < users.length; i++) {
  for (let j = 0; j < users[i].orders.length; j++) {
    // i と j が何を指すか不明
  }
}

// ✅ 意味のある名前（forEach/for-of推奨）
for (const user of users) {
  for (const order of user.orders) {
    // 明確
  }
}

// インデックスが必要な場合
users.forEach((user, userIndex) => {
  user.orders.forEach((order, orderIndex) => {
    // 明確
  });
});
```

### 1.4 単位や状態を名前に含める

```typescript
// ❌ 単位が不明
const timeout = 5000;
const delay = 3;
const size = 1024;

// ✅ 単位を明示
const timeoutMs = 5000;
const delaySeconds = 3;
const fileSizeBytes = 1024;
```

```typescript
// ❌ 状態が不明
const password = 'secret123';
const html = '<div>Hello</div>';

// ✅ 状態を明示
const plaintextPassword = 'secret123';
const sanitizedHtml = '<div>Hello</div>';
const rawUserInput = formData.get('comment');
```

### 1.5 ブール値の命名

ブール値には `is`, `has`, `can`, `should`, `needs` などのプレフィックスを付ける。

```typescript
// ❌ ブール値か不明
const admin = true;
const visible = false;
const login = true;

// ✅ ブール値であることが明確
const isAdmin = true;
const isVisible = false;
const hasLoggedIn = true;
const canEdit = user.role === 'editor';
const shouldRefresh = cacheExpired;
const needsValidation = !isVerified;
```

### 1.6 否定形を避ける

```typescript
// ❌ 二重否定で混乱
const isNotDisabled = true;
if (!isNotDisabled) { ... }

// ✅ 肯定形で明確
const isEnabled = true;
if (!isEnabled) { ... }
```

### 1.7 限界値・範囲の命名

```typescript
// ❌ 曖昧
const limit = 100;
const count = 50;

// ✅ 限界値を明示（min/max）
const maxItemsPerPage = 100;
const minPasswordLength = 8;

// ✅ 範囲を明示（first/last または start/end）
const firstDayOfMonth = 1;
const lastDayOfMonth = 31;

// ✅ 包含/排他を明示（begin/end）
const beginIndex = 0;    // 含む
const endIndex = 10;     // 含まない（0〜9が対象）
```

---

## 2. 関数設計

### 2.1 関数は1つのことだけ行う

```typescript
// ❌ 複数の責務
async function processUserRegistration(data: FormData) {
  // バリデーション
  if (!data.email) throw new Error('Email required');
  // ユーザー作成
  const user = await db.user.create({ ... });
  // メール送信
  await sendEmail(user.email, 'Welcome!');
  // ログ記録
  await logActivity('user_registered', user.id);
  return user;
}

// ✅ 責務を分離
async function validateRegistrationData(data: FormData): void {
  if (!data.email) throw new ValidationError('Email required');
}

async function createUser(data: ValidatedFormData): Promise<User> {
  return await db.user.create({ ... });
}

async function sendWelcomeEmail(email: string): Promise<void> {
  await sendEmail(email, 'Welcome!');
}

async function registerUser(data: FormData): Promise<User> {
  validateRegistrationData(data);
  const user = await createUser(data);
  await sendWelcomeEmail(user.email);
  return user;
}
```

### 2.2 早期リターン（ガード節）を使う

ネストを減らし、正常系を目立たせる。

```typescript
// ❌ 深いネスト
function processOrder(order: Order | null) {
  if (order) {
    if (order.status === 'pending') {
      if (order.items.length > 0) {
        // 本来の処理（深すぎる）
        return calculateTotal(order);
      } else {
        return 0;
      }
    } else {
      throw new Error('Order not pending');
    }
  } else {
    throw new Error('Order not found');
  }
}

// ✅ ガード節で早期リターン
function processOrder(order: Order | null) {
  if (!order) {
    throw new Error('Order not found');
  }
  if (order.status !== 'pending') {
    throw new Error('Order not pending');
  }
  if (order.items.length === 0) {
    return 0;
  }

  // 本来の処理（ネストなし）
  return calculateTotal(order);
}
```

### 2.3 引数は少なく保つ

引数が3つを超える場合はオブジェクトにまとめる。

```typescript
// ❌ 引数が多すぎる
function createUser(
  name: string,
  email: string,
  age: number,
  role: string,
  department: string,
  isActive: boolean
) { ... }

// ✅ オブジェクトにまとめる
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  role: string;
  department: string;
  isActive?: boolean;
}

function createUser(params: CreateUserParams) { ... }
```

---

## 3. 条件分岐

### 3.1 肯定形を先に書く

```typescript
// ❌ 否定形が先
if (!isValid) {
  handleError();
} else {
  processData();
}

// ✅ 肯定形が先
if (isValid) {
  processData();
} else {
  handleError();
}
```

### 3.2 単純な条件を先に書く

```typescript
// ❌ 複雑な条件が先
if (user.role === 'admin' && user.permissions.includes('write') && !user.isSuspended) {
  // 管理者処理
} else {
  // 一般処理
}

// ✅ 単純なケースを先に処理
if (user.isSuspended) {
  throw new Error('User is suspended');
}

if (user.role !== 'admin') {
  return handleRegularUser(user);
}

if (!user.permissions.includes('write')) {
  return handleReadOnlyAdmin(user);
}

return handleFullAdmin(user);
```

### 3.3 三項演算子は単純な場合のみ

```typescript
// ❌ 複雑な三項演算子
const result = condition1
  ? (condition2 ? value1 : value2)
  : (condition3 ? value3 : value4);

// ✅ if文で明確に
let result: string;
if (condition1) {
  result = condition2 ? value1 : value2;
} else {
  result = condition3 ? value3 : value4;
}

// ✅ 単純な三項演算子はOK
const displayName = user.nickname ?? user.name;
const statusText = isActive ? '有効' : '無効';
```

---

## 4. 変数

### 4.1 不変性を優先する

変更が不要な変数は必ず `const` を使う。

```typescript
// ❌ 再代入しないのに let
let userId = params.id;
let config = loadConfig();

// ✅ const を使う
const userId = params.id;
const config = loadConfig();
```

### 4.2 変数のスコープを最小化する

変数は使用する直前で宣言する。

```typescript
// ❌ 変数が遠くで宣言されている
function processUsers(users: User[]) {
  let total = 0;           // ← 100行後に使用
  let activeCount = 0;     // ← 50行後に使用

  // ... 50行のコード ...

  activeCount = users.filter(u => u.isActive).length;

  // ... 50行のコード ...

  total = users.length;
}

// ✅ 使用直前で宣言
function processUsers(users: User[]) {
  // ... 処理 ...

  const activeCount = users.filter(u => u.isActive).length;

  // ... 処理 ...

  const total = users.length;
}
```

### 4.3 説明変数を使う

複雑な式に名前を付けて意図を明確にする。

```typescript
// ❌ 複雑な条件式
if (user.age >= 18 && user.country === 'JP' && user.hasAgreedToTerms && !user.isBanned) {
  allowAccess();
}

// ✅ 説明変数で意図を明確に
const isAdult = user.age >= 18;
const isJapaneseResident = user.country === 'JP';
const hasAcceptedTerms = user.hasAgreedToTerms;
const isAccountActive = !user.isBanned;

const canAccessService = isAdult && isJapaneseResident && hasAcceptedTerms && isAccountActive;

if (canAccessService) {
  allowAccess();
}
```

### 4.4 中間結果の変数を減らす

```typescript
// ❌ 不要な中間変数
const userIds = users.map(u => u.id);
const uniqueUserIds = [...new Set(userIds)];
const sortedUserIds = uniqueUserIds.sort();
return sortedUserIds;

// ✅ メソッドチェーンで簡潔に
return [...new Set(users.map(u => u.id))].sort();

// ただし、デバッグが必要な場合や複雑な場合は中間変数を残す
```

---

## 5. コメント

### 5.1 コードで表現できることはコメントしない

```typescript
// ❌ 自明なコメント
// ユーザーIDを取得
const userId = user.id;

// ユーザーを配列に追加
users.push(user);

// ✅ コメント不要（コード自体が説明的）
const userId = user.id;
users.push(user);
```

### 5.2 「なぜ」をコメントする

```typescript
// ✅ 意図や理由を説明
// レガシーAPIとの互換性のため、日付をUNIXタイムスタンプに変換
const timestamp = Math.floor(date.getTime() / 1000);

// パフォーマンス最適化: N+1クエリを避けるため一括取得
const allOrders = await db.order.findMany({
  where: { userId: { in: userIds } }
});
```

### 5.3 定数の由来を説明する

```typescript
// ❌ マジックナンバー
const timeout = 86400000;

// ✅ 由来を説明
// 24時間 = 24 * 60 * 60 * 1000 ミリ秒
const SESSION_TIMEOUT_MS = 86400000;

// または定数で計算を明示
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;
const SESSION_TIMEOUT_MS = HOURS_PER_DAY * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
```

### 5.4 既知の問題をマークする

```typescript
// TODO: ページネーション実装後に削除（Issue #123）
const MAX_ITEMS = 1000;

// FIXME: タイムゾーン考慮が必要
const formattedDate = date.toISOString();

// HACK: ライブラリのバグ回避（v2.0で修正予定）
const workaroundValue = value || '';
```

---

## 6. 型定義

### 6.1 `any` を使わない

```typescript
// ❌ any で型安全性を放棄
function processData(data: any): any {
  return data.value;
}

// ✅ 適切な型を定義
interface ProcessableData {
  value: string;
  metadata?: Record<string, unknown>;
}

function processData(data: ProcessableData): string {
  return data.value;
}

// 型が不明な場合は unknown を使い、型ガードで絞り込む
function processUnknown(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error('Invalid data format');
}
```

### 6.2 型エイリアスで意図を明確にする

```typescript
// ❌ プリミティブ型のまま
function getUser(id: string): Promise<User> { ... }
function getOrder(id: string): Promise<Order> { ... }
// id が何のIDか不明

// ✅ 型エイリアスで区別
type UserId = string;
type OrderId = string;

function getUser(id: UserId): Promise<User> { ... }
function getOrder(id: OrderId): Promise<Order> { ... }
```

### 6.3 Union型で状態を表現する

```typescript
// ❌ フラグの組み合わせ
interface ApiResponse {
  isLoading: boolean;
  isError: boolean;
  data?: User;
  error?: Error;
}
// isLoading と isError が両方 true の状態は？

// ✅ Union型で状態を明確に
type ApiResponse =
  | { status: 'loading' }
  | { status: 'success'; data: User }
  | { status: 'error'; error: Error };

function handleResponse(response: ApiResponse) {
  switch (response.status) {
    case 'loading':
      return <Spinner />;
    case 'success':
      return <UserProfile user={response.data} />;
    case 'error':
      return <ErrorMessage error={response.error} />;
  }
}
```

---

## 7. エラーハンドリング

### 7.1 具体的なエラーメッセージ

```typescript
// ❌ 曖昧なエラー
throw new Error('Invalid input');
throw new Error('Failed');

// ✅ 具体的で対処可能なエラー
throw new Error(`Email format is invalid: ${email}`);
throw new Error(`User not found with ID: ${userId}`);
throw new Error(`API request failed: ${response.status} ${response.statusText}`);
```

### 7.2 カスタムエラークラスを使う

```typescript
// ✅ エラーの種類を区別可能に
class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(
    public readonly resource: string,
    public readonly id: string
  ) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

// 使用例
try {
  await getUser(userId);
} catch (error) {
  if (error instanceof NotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message, field: error.field });
  }
  throw error;
}
```

---

## 8. 配列操作

### 8.1 適切なメソッドを選ぶ

```typescript
// ❌ forEach で配列を構築
const results: string[] = [];
users.forEach(user => {
  results.push(user.name);
});

// ✅ map を使う
const results = users.map(user => user.name);

// ❌ forEach + if でフィルタリング
const activeUsers: User[] = [];
users.forEach(user => {
  if (user.isActive) {
    activeUsers.push(user);
  }
});

// ✅ filter を使う
const activeUsers = users.filter(user => user.isActive);

// ❌ forEach で検索
let foundUser: User | undefined;
users.forEach(user => {
  if (user.id === targetId) {
    foundUser = user;
  }
});

// ✅ find を使う
const foundUser = users.find(user => user.id === targetId);
```

### 8.2 メソッドチェーンは適度に

```typescript
// ❌ 長すぎるチェーン（デバッグ困難）
const result = users
  .filter(u => u.isActive)
  .map(u => u.orders)
  .flat()
  .filter(o => o.status === 'completed')
  .map(o => o.items)
  .flat()
  .reduce((sum, item) => sum + item.price, 0);

// ✅ 意味のある単位で分割
const activeUsers = users.filter(u => u.isActive);
const allOrders = activeUsers.flatMap(u => u.orders);
const completedOrders = allOrders.filter(o => o.status === 'completed');
const allItems = completedOrders.flatMap(o => o.items);
const totalPrice = allItems.reduce((sum, item) => sum + item.price, 0);
```

---

## 9. 非同期処理

### 9.1 async/await を優先する

```typescript
// ❌ Promise チェーン（ネストが深くなりがち）
function fetchUserData(userId: string) {
  return fetch(`/api/users/${userId}`)
    .then(response => response.json())
    .then(user => fetch(`/api/orders?userId=${user.id}`))
    .then(response => response.json())
    .catch(error => console.error(error));
}

// ✅ async/await
async function fetchUserData(userId: string) {
  try {
    const userResponse = await fetch(`/api/users/${userId}`);
    const user = await userResponse.json();

    const ordersResponse = await fetch(`/api/orders?userId=${user.id}`);
    const orders = await ordersResponse.json();

    return { user, orders };
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
}
```

### 9.2 並列実行を活用する

```typescript
// ❌ 直列実行（遅い）
const user = await fetchUser(userId);
const orders = await fetchOrders(userId);
const notifications = await fetchNotifications(userId);

// ✅ 並列実行（高速）
const [user, orders, notifications] = await Promise.all([
  fetchUser(userId),
  fetchOrders(userId),
  fetchNotifications(userId)
]);
```

---

## 10. コードの削減

### 10.1 不要なコードを書かない（YAGNI）

```typescript
// ❌ 使われない機能を実装
interface User {
  id: string;
  name: string;
  // 将来使うかもしれないフィールド
  middleName?: string;
  suffix?: string;
  alternateEmails?: string[];
}

// ✅ 必要なものだけ
interface User {
  id: string;
  name: string;
}
```

### 10.2 標準ライブラリを活用する

```typescript
// ❌ 自前実装
function removeDuplicates<T>(array: T[]): T[] {
  const seen = new Set<T>();
  return array.filter(item => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

// ✅ 標準機能を使う
const uniqueItems = [...new Set(array)];
```

### 10.3 最も読みやすいコードは書かれていないコード

機能を追加する前に、本当に必要か検討する。既存の機能で代替できないか確認する。

---

## まとめ: チェックリスト

コードを書いたら以下を確認する：

### 命名
- [ ] 変数名・関数名は具体的で意図が明確か
- [ ] ブール値には is/has/can などのプレフィックスがあるか
- [ ] 単位や状態が名前に含まれているか

### 関数
- [ ] 関数は1つのことだけ行っているか
- [ ] 早期リターンでネストを減らしているか
- [ ] 引数は3つ以下か（超える場合はオブジェクト化）

### 条件分岐
- [ ] 肯定形を優先しているか
- [ ] ネストは3段階以内か
- [ ] 複雑な条件は説明変数で分解しているか

### 変数
- [ ] const を優先しているか
- [ ] スコープは最小限か
- [ ] 不要な中間変数はないか

### 型
- [ ] any を使っていないか
- [ ] Union型で状態を表現しているか
- [ ] 型エイリアスで意図を明確にしているか

### コメント
- [ ] 「なぜ」を説明しているか
- [ ] 自明なコメントはないか
- [ ] TODO/FIXME には Issue 番号があるか

---

**最終更新**: 2026-01-11
