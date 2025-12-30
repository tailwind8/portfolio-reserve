# ATDD/BDD環境セットアップガイド

## 🎯 目的

このガイドでは、受入テスト駆動開発（ATDD）と振る舞い駆動開発（BDD）の環境をセットアップします。

---

## 📦 セットアップ手順

### Step 1: 必要なパッケージのインストール

```bash
cd reserve-app

# テスト関連パッケージ
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @playwright/test
npm install -D jest jest-environment-jsdom
npm install -D msw

# TypeScript型定義
npm install -D @types/jest

# コード品質ツール
npm install -D eslint-plugin-testing-library eslint-plugin-jest-dom
npm install -D prettier eslint-config-prettier
npm install -D husky lint-staged

# バリデーション
npm install zod

# Prisma
npm install @prisma/client
npm install -D prisma
```

---

### Step 2: Jest設定

#### `jest.config.js`
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### `jest.setup.js`
```javascript
import '@testing-library/jest-dom'

// MSW設定
import { server } from './src/__tests__/mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

#### `package.json` にスクリプト追加
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

### Step 3: React Testing Library設定

#### サンプルテスト: `src/__tests__/unit/Button.test.tsx`
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '@/components/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

---

### Step 4: MSW（Mock Service Worker）設定

#### `src/__tests__/mocks/handlers.ts`
```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  // 予約一覧取得のモック
  http.get('/api/reservations', () => {
    return HttpResponse.json([
      {
        id: '1',
        userId: 'user-1',
        date: '2025-01-20',
        time: '14:00',
        menuId: 'menu-1',
        status: 'confirmed',
      },
    ]);
  }),

  // 予約作成のモック
  http.post('/api/reservations', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        id: '2',
        ...body,
        status: 'confirmed',
      },
      { status: 201 }
    );
  }),
];
```

#### `src/__tests__/mocks/server.ts`
```typescript
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

---

### Step 5: Playwright設定

#### `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### サンプルE2Eテスト: `src/__tests__/e2e/booking.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('予約機能', () => {
  test('ユーザーは予約を作成できる', async ({ page }) => {
    // Given: ユーザーがログインしている
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // When: 予約ページにアクセスする
    await page.goto('/booking');

    // And: 日付を選択する
    await page.click('button:has-text("20")');

    // And: 時間を選択する
    await page.click('button:has-text("14:00")');

    // And: メニューを選択する
    await page.selectOption('select[name="menu"]', 'カット');

    // And: スタッフを選択する
    await page.selectOption('select[name="staff"]', '田中');

    // And: 予約を確定する
    await page.click('button:has-text("予約を確定する")');

    // Then: 予約完了画面が表示される
    await expect(page).toHaveURL('/booking/complete');
    await expect(page.locator('h1')).toContainText('予約が完了しました');
  });

  test('ユーザーは予約済み時間を選択できない', async ({ page }) => {
    await page.goto('/booking');
    await page.click('button:has-text("20")');

    // 予約済みの時間はdisabled
    const disabledSlot = page.locator('button:has-text("11:00")[disabled]');
    await expect(disabledSlot).toBeVisible();
  });
});
```

---

### Step 6: Prisma設定

#### Prismaインストール・初期化
```bash
cd reserve-app
npx prisma init
```

#### `prisma/schema.prisma`
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ユーザー
model RestaurantUser {
  id            String              @id @default(uuid())
  tenantId      String              @default("demo-restaurant") @map("tenant_id")
  email         String
  name          String?
  phone         String?
  createdAt     DateTime            @default(now()) @map("created_at")
  reservations  RestaurantReservation[]

  @@unique([tenantId, email])
  @@map("restaurant_users")
}

// 予約
model RestaurantReservation {
  id        String   @id @default(uuid())
  tenantId  String   @default("demo-restaurant") @map("tenant_id")
  userId    String   @map("user_id")
  user      RestaurantUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      DateTime
  time      String
  menuId    String   @map("menu_id")
  menu      RestaurantMenu @relation(fields: [menuId], references: [id])
  staffId   String?  @map("staff_id")
  staff     RestaurantStaff? @relation(fields: [staffId], references: [id])
  status    String   @default("pending")
  notes     String?
  createdAt DateTime @default(now()) @map("created_at")

  @@map("restaurant_reservations")
}

// メニュー
model RestaurantMenu {
  id           String   @id @default(uuid())
  tenantId     String   @default("demo-restaurant") @map("tenant_id")
  name         String
  description  String?
  price        Decimal  @db.Decimal(10, 2)
  durationMin  Int      @map("duration_minutes")
  category     String?
  available    Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  reservations RestaurantReservation[]

  @@map("restaurant_menus")
}

// スタッフ
model RestaurantStaff {
  id           String   @id @default(uuid())
  tenantId     String   @default("demo-restaurant") @map("tenant_id")
  name         String
  email        String?
  phone        String?
  role         String?
  available    Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  reservations RestaurantReservation[]

  @@map("restaurant_staff")
}

// 店舗設定
model RestaurantSettings {
  id                String   @id @default(uuid())
  tenantId          String   @unique @default("demo-restaurant") @map("tenant_id")
  businessHours     Json?    @map("business_hours")
  closedDays        String[]
  maxPartySize      Int      @default(10) @map("max_party_size")
  bookingWindowDays Int      @default(30) @map("booking_window_days")
  updatedAt         DateTime @updatedAt @map("updated_at")

  @@map("restaurant_settings")
}
```

#### `.env.local`
```bash
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
```

#### マイグレーション実行
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

### Step 7: ESLint + Prettier設定

#### `.eslintrc.json`
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "plugin:testing-library/react",
    "plugin:jest-dom/recommended",
    "prettier"
  ],
  "plugins": ["testing-library", "jest-dom"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

#### `.prettierrc`
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

### Step 8: Husky + lint-staged設定

#### Huskyインストール
```bash
npx husky-init && npm install
```

#### `.husky/pre-commit`
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

#### `package.json` に追加
```json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

---

### Step 9: GitHub Actions設定

#### `.github/workflows/test.yml`
```yaml
name: Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: reserve-app/package-lock.json

      - name: Install dependencies
        run: cd reserve-app && npm ci

      - name: Run unit tests
        run: cd reserve-app && npm run test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./reserve-app/coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: reserve-app/package-lock.json

      - name: Install dependencies
        run: cd reserve-app && npm ci

      - name: Install Playwright
        run: cd reserve-app && npx playwright install --with-deps

      - name: Run E2E tests
        run: cd reserve-app && npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: reserve-app/playwright-report/
```

#### `.github/workflows/lint.yml`
```yaml
name: Lint

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: reserve-app/package-lock.json

      - name: Install dependencies
        run: cd reserve-app && npm ci

      - name: Run ESLint
        run: cd reserve-app && npm run lint

      - name: Run TypeScript check
        run: cd reserve-app && npx tsc --noEmit
```

---

## 🧪 BDD開発フロー例

### 1. Gherkinシナリオ作成
`documents/BDDシナリオ/予約機能.feature`
```gherkin
Feature: 予約機能
  As a customer
  I want to book a reservation
  So that I can visit the store at my preferred time

  Background:
    Given ユーザー "yamada@example.com" がログインしている

  Scenario: 予約成功
    Given 予約ページにアクセスしている
    When "2025年1月20日" を選択する
    And "14:00" の時間帯を選択する
    And "カット" メニューを選択する
    And "田中" スタッフを選択する
    And "予約を確定する" ボタンをクリックする
    Then 予約完了画面が表示される
    And 確認メールが送信される
```

### 2. E2Eテスト実装（Red）
Playwrightテストを実装（上記サンプル参照）

### 3. 単体テスト実装（Red）
各コンポーネントの単体テストを実装

### 4. 機能実装（Green）
テストが通るように最小限の実装

### 5. リファクタリング（Refactor）
コードを整理・最適化

---

## ✅ セットアップ確認チェックリスト

- [ ] Jest が動作する（`npm run test`）
- [ ] React Testing Library が動作する
- [ ] Playwright が動作する（`npm run test:e2e`）
- [ ] MSW でAPIモックができる
- [ ] Prisma Client が生成される
- [ ] ESLint が動作する（`npm run lint`）
- [ ] Prettier が動作する
- [ ] Husky pre-commit フックが動作する
- [ ] GitHub Actions が動作する（PR作成時）

---

## 🚀 次のステップ

1. **Sprint 1のIssue #1を開始**: テスト環境セットアップ
2. **サンプルテストを作成**: Button, Card コンポーネントのテスト
3. **CI/CD動作確認**: PR作成してGitHub Actionsが動くか確認
4. **Issue #2へ**: Prisma + Supabase接続

セットアップが完了したら、Issue #5（ユーザー新規登録機能）から実装を開始します！
