# コード品質ツール 品質重視設定ガイド

AI生成コードの品質を保つための各ツール設定を網羅的にまとめました。

---

## 目次

1. [ESLint（厳格設定）](#1-eslint厳格設定)
2. [TypeScript（厳格設定）](#2-typescript厳格設定)
3. [jscpd（重複コード検出）](#3-jscpd重複コード検出)
4. [Knip（デッドコード検出）](#4-knipデッドコード検出)
5. [Madge（循環依存検出）](#5-madge循環依存検出)
6. [Dependency Cruiser（依存関係検証）](#6-dependency-cruiser依存関係検証)
7. [npm audit / audit-ci（セキュリティ）](#7-npm-audit--audit-ciセキュリティ)
8. [Husky + lint-staged（Gitフック）](#8-husky--lint-stagedgitフック)
9. [統合package.json設定](#9-統合packagejson設定)
10. [CLAUDE.md推奨設定](#10-claudemd推奨設定)

---

## 1. ESLint（厳格設定）

### インストール

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-sonarjs
```

### 設定ファイル: `eslint.config.mjs`

```javascript
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import sonarjs from 'eslint-plugin-sonarjs';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  sonarjs.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ===== 複雑性制御 =====
      // サイクロマティック複雑度: 分岐が多すぎる関数を禁止
      'complexity': ['error', { max: 5 }],
      
      // ネスト深度: 深すぎるネストを禁止
      'max-depth': ['error', { max: 3 }],
      
      // コールバックネスト: コールバック地獄を防止
      'max-nested-callbacks': ['error', { max: 2 }],
      
      // 認知的複雑度 (SonarJS): 理解しにくいコードを検出
      'sonarjs/cognitive-complexity': ['error', 10],

      // ===== サイズ制限 =====
      // ファイル行数: 大きすぎるファイルを禁止
      'max-lines': ['error', {
        max: 300,
        skipBlankLines: true,
        skipComments: true
      }],
      
      // 関数行数: 長すぎる関数を禁止
      'max-lines-per-function': ['error', {
        max: 50,
        skipBlankLines: true,
        skipComments: true,
        IIFEs: true
      }],
      
      // 関数内ステートメント数
      'max-statements': ['error', { max: 15 }],
      
      // 関数パラメータ数: 多すぎるパラメータを禁止
      'max-params': ['error', { max: 3 }],
      
      // 行の長さ
      'max-len': ['error', {
        code: 100,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreRegExpLiterals: true
      }],

      // ===== 可読性 =====
      // ネストした三項演算子を禁止
      'no-nested-ternary': 'error',
      
      // マジックナンバーを禁止（定数に名前をつける）
      'no-magic-numbers': ['error', {
        ignore: [0, 1, -1, 2],
        ignoreArrayIndexes: true,
        ignoreDefaultValues: true,
        enforceConst: true
      }],

      // ===== ベストプラクティス =====
      // 厳密等価演算子を強制
      'eqeqeq': ['error', 'always'],
      
      // varを禁止
      'no-var': 'error',
      
      // 再代入しない変数はconstを使用
      'prefer-const': 'error',
      
      // コンソール出力を警告（本番コード用）
      'no-console': 'warn',
      
      // 未使用変数をエラー
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],

      // ===== SonarJS 追加ルール =====
      // 重複した条件分岐を禁止
      'sonarjs/no-duplicated-branches': 'error',
      
      // 同一式を禁止
      'sonarjs/no-identical-expressions': 'error',
      
      // 同一関数を禁止
      'sonarjs/no-identical-functions': 'error',
      
      // コレクションサイズの誤用を検出
      'sonarjs/no-collection-size-mischeck': 'error',
    }
  },
  {
    // テストファイル用の緩和設定
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**'],
    rules: {
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
);
```

### 設定値の意味

| ルール | 値 | 意味 |
|--------|-----|------|
| `complexity` | 5 | 関数内の分岐（if/switch/ループ）が5個まで |
| `max-depth` | 3 | ネストは3段階まで（if内のif内のifまで） |
| `max-lines-per-function` | 50 | 1関数は50行まで |
| `max-params` | 3 | 関数の引数は3つまで |
| `cognitive-complexity` | 10 | 認知的複雑度10まで |

---

## 2. TypeScript（厳格設定）

### 設定ファイル: `tsconfig.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    // ===== 基本設定 =====
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "rootDir": "src",
    "outDir": "dist",
    
    // ===== 厳格な型チェック（すべて有効化推奨） =====
    "strict": true,
    // strict: true は以下を含む:
    // - noImplicitAny: 暗黙のany型を禁止
    // - noImplicitThis: 暗黙のthis型を禁止
    // - strictNullChecks: null/undefinedの厳格チェック
    // - strictFunctionTypes: 関数型の厳格チェック
    // - strictBindCallApply: bind/call/applyの厳格チェック
    // - strictPropertyInitialization: プロパティ初期化チェック
    // - useUnknownInCatchVariables: catchのエラーをunknown型に
    // - alwaysStrict: "use strict"を出力
    
    // ===== 追加の厳格オプション =====
    // 配列/オブジェクトアクセス時にundefinedチェックを強制
    "noUncheckedIndexedAccess": true,
    
    // overrideキーワードを強制
    "noImplicitOverride": true,
    
    // switch文のフォールスルーを禁止
    "noFallthroughCasesInSwitch": true,
    
    // 到達不能コードをエラー
    "allowUnreachableCode": false,
    
    // 未使用ラベルをエラー
    "allowUnusedLabels": false,
    
    // オプショナルプロパティの厳格チェック
    "exactOptionalPropertyTypes": true,
    
    // 関数の全パスでreturnを強制
    "noImplicitReturns": true,
    
    // ===== 相互運用性 =====
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    
    // ===== 出力 =====
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    
    // ===== その他 =====
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 重要な設定の説明

| オプション | 効果 |
|------------|------|
| `strict: true` | 基本的な厳格チェックをすべて有効化 |
| `noUncheckedIndexedAccess` | `arr[0]`が`T \| undefined`になる（実行時エラー防止） |
| `exactOptionalPropertyTypes` | `prop?: string`と`prop: string \| undefined`を区別 |
| `noImplicitReturns` | すべてのコードパスでreturnを強制 |

---

## 3. jscpd（重複コード検出）

### インストール

```bash
npm install -D jscpd
```

### 設定ファイル: `.jscpd.json`

```json
{
  "$schema": "https://json.schemastore.org/jscpd.json",
  
  // ===== 検出感度（品質重視で厳しめに設定） =====
  "threshold": 0,
  "minLines": 3,
  "minTokens": 25,
  "maxLines": 1000,
  "maxSize": "100kb",
  
  // ===== 検出モード =====
  // strict: 全シンボルをトークンとして使用（最も厳格）
  // mild: 空行・空白をスキップ
  // weak: コメントもスキップ
  "mode": "strict",
  
  // ===== 対象フォーマット =====
  "format": [
    "typescript",
    "javascript",
    "tsx",
    "jsx"
  ],
  
  // ===== 除外パターン =====
  "ignore": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/*.min.js",
    "**/*.d.ts",
    "**/__snapshots__/**",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/coverage/**",
    "**/.git/**"
  ],
  
  // ===== レポート設定 =====
  "reporters": [
    "console",
    "html",
    "json"
  ],
  "output": "./reports/jscpd",
  
  // ===== その他 =====
  "gitignore": true,
  "absolute": false,
  "blame": true,
  "silent": false,
  
  // ===== インポート文を除外（オプション） =====
  "skipLocal": false,
  "noSymlinks": true
}
```

### 設定値の意味

| 設定 | 推奨値 | 意味 |
|------|--------|------|
| `threshold` | 0 | 重複が1つでもあればエラー（CI用） |
| `minLines` | 3-5 | 最小検出行数（小さいほど厳格） |
| `minTokens` | 25-50 | 最小トークン数（小さいほど厳格） |
| `mode` | strict | 最も厳格な検出モード |

### コード内で特定ブロックを除外

```typescript
/* jscpd:ignore-start */
// このコードは重複チェックから除外される
const config = {
  // 設定など、重複が許容されるコード
};
/* jscpd:ignore-end */
```

---

## 4. Knip（デッドコード検出）

### インストール

```bash
npm install -D knip
```

### 設定ファイル: `knip.json`

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  
  // ===== エントリーポイント =====
  // !マークは本番モード用（--production時のみ使用）
  "entry": [
    "src/index.ts!",
    "src/main.ts!"
  ],
  
  // ===== プロジェクトファイル =====
  "project": [
    "src/**/*.ts!",
    "src/**/*.tsx!"
  ],
  
  // ===== 無視設定（極力使わない） =====
  // ignore: 特定ファイルの全問題を無視
  "ignore": [
    "src/generated/**"
  ],
  
  // ===== 依存関係の無視 =====
  "ignoreDependencies": [
    // 実行時に動的に使用される依存関係
    "tsconfig-paths"
  ],
  
  // ===== バイナリの無視 =====
  "ignoreBinaries": [
    "docker"
  ],
  
  // ===== ワークスペース内で使用されるエクスポートを無視 =====
  "ignoreExportsUsedInFile": true,
  
  // ===== ルール設定 =====
  "rules": {
    // error: エラーとしてカウント
    // warn: 警告として表示（エラーカウントに含まない）
    // off: 無視
    
    "files": "error",
    "dependencies": "error",
    "devDependencies": "warn",
    "optionalPeerDependencies": "warn",
    "unlisted": "error",
    "binaries": "error",
    "unresolved": "error",
    "exports": "error",
    "nsExports": "error",
    "types": "error",
    "nsTypes": "error",
    "enumMembers": "warn",
    "classMembers": "warn",
    "duplicates": "error"
  },
  
  // ===== プラグイン設定 =====
  "eslint": {
    "config": ["eslint.config.mjs"]
  },
  "typescript": {
    "config": ["tsconfig.json"]
  },
  
  // ===== 設定ヒントをエラーとして扱う =====
  "treatConfigHintsAsErrors": true
}
```

### CLIオプション

```bash
# 基本実行
npx knip

# 本番モード（より厳格）
npx knip --production

# 本番 + 厳格モード（最も厳格）
npx knip --production --strict

# 特定の問題タイプのみ表示
npx knip --include files,dependencies,exports

# 自動修正（未使用エクスポートを削除）
npx knip --fix

# JSON出力
npx knip --reporter json > knip-report.json
```

### JSDocタグでエクスポートを除外

```typescript
/**
 * @public
 * このエクスポートは公開APIとしてマーク
 */
export function publicApi() {}

/**
 * @internal
 * 内部使用としてマーク（--exclude-tagsで除外可能）
 */
export function internalHelper() {}
```

---

## 5. Madge（循環依存検出）

### インストール

```bash
npm install -D madge

# 可視化用（オプション）
# macOS: brew install graphviz
# Ubuntu: sudo apt-get install graphviz
```

### 設定ファイル: `.madgerc`

```json
{
  "fileExtensions": ["ts", "tsx", "js", "jsx"],
  "excludeRegExp": [
    ".*\\.test\\.ts$",
    ".*\\.spec\\.ts$",
    ".*\\.d\\.ts$",
    "node_modules"
  ],
  "tsConfig": "./tsconfig.json",
  "webpackConfig": null,
  "detectiveOptions": {
    "ts": {
      "skipTypeImports": true,
      "skipAsyncImports": false
    },
    "tsx": {
      "skipTypeImports": true,
      "skipAsyncImports": false
    }
  },
  "dependencyFilter": null
}
```

### package.json内の設定（代替）

```json
{
  "madge": {
    "fileExtensions": ["ts", "tsx"],
    "excludeRegExp": [".*\\.test\\.ts$"],
    "tsConfig": "./tsconfig.json",
    "detectiveOptions": {
      "ts": {
        "skipTypeImports": true
      }
    }
  }
}
```

### CLIコマンド

```bash
# 循環依存チェック
npx madge --circular --extensions ts,tsx src/

# TypeScript設定を使用
npx madge --circular --ts-config ./tsconfig.json src/

# 依存関係グラフを画像で出力
npx madge --image graph.svg --extensions ts,tsx src/

# 循環依存のみのグラフ
npx madge --circular --image circular.svg --extensions ts,tsx src/

# 孤立ファイル（どこからも参照されない）を検出
npx madge --orphans --extensions ts,tsx src/

# JSON出力
npx madge --json --extensions ts,tsx src/ > deps.json
```

### CI用スクリプト

```bash
#!/bin/bash
# scripts/check-circular-deps.sh

THRESHOLD=${1:-0}  # デフォルトは0（循環依存を許可しない）

result=$(npx madge --circular --ts-config ./tsconfig.json --extensions ts,tsx src/ 2>&1)

if echo "$result" | grep -q "Found [0-9]\+ circular"; then
  count=$(echo "$result" | grep -o "Found [0-9]\+ circular" | grep -o "[0-9]\+")
  echo "循環依存数: $count"
  
  if [ "$count" -gt "$THRESHOLD" ]; then
    echo "エラー: 循環依存数 ($count) が閾値 ($THRESHOLD) を超えています"
    echo "$result"
    exit 1
  fi
else
  echo "循環依存なし"
fi
```

---

## 6. Dependency Cruiser（依存関係検証）

### インストール

```bash
npm install -D dependency-cruiser
```

### 初期設定

```bash
npx depcruise --init
```

### 設定ファイル: `.dependency-cruiser.js`

```javascript
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ===== 循環依存を禁止 =====
    {
      name: 'no-circular',
      severity: 'error',
      comment: '循環依存は禁止です',
      from: {},
      to: {
        circular: true
      }
    },
    
    // ===== 孤立ファイルを警告 =====
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'どこからも参照されないファイルです',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$',  // 設定ファイル
          '\\.d\\.ts$',  // 型定義
          '(^|/)index\\.[jt]sx?$'  // インデックスファイル
        ]
      },
      to: {}
    },
    
    // ===== 本番コードからdevDependenciesへの依存を禁止 =====
    {
      name: 'no-dev-deps-in-production',
      severity: 'error',
      comment: '本番コードはdevDependenciesに依存できません',
      from: {
        path: '^src/',
        pathNot: '\\.test\\.ts$|\\.spec\\.ts$'
      },
      to: {
        dependencyTypes: ['npm-dev']
      }
    },
    
    // ===== テストコードから本番コードの内部実装への依存を制限 =====
    {
      name: 'no-test-to-internal',
      severity: 'warn',
      comment: 'テストは公開APIのみをテストすべきです',
      from: {
        path: '\\.test\\.ts$|\\.spec\\.ts$'
      },
      to: {
        path: '^src/internal/'
      }
    },
    
    // ===== 相対パスの親ディレクトリ参照を制限 =====
    {
      name: 'no-deep-relative-imports',
      severity: 'warn',
      comment: '深い相対パスは避けてください',
      from: {},
      to: {
        path: '^\\.\\./\\.\\./\\.\\.'  // ../../../ 以上
      }
    },
    
    // ===== 特定のディレクトリ構造を強制 =====
    {
      name: 'no-cross-feature-imports',
      severity: 'error',
      comment: 'feature間の直接参照は禁止です',
      from: {
        path: '^src/features/([^/]+)/'
      },
      to: {
        path: '^src/features/([^/]+)/',
        pathNot: '^src/features/$1/'  // 同じfeature内は許可
      }
    },
    
    // ===== utilsからビジネスロジックへの依存を禁止 =====
    {
      name: 'utils-no-business-logic',
      severity: 'error',
      comment: 'utilsはビジネスロジックに依存できません',
      from: {
        path: '^src/utils/'
      },
      to: {
        path: '^src/(features|services|domain)/'
      }
    }
  ],
  
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    
    tsPreCompilationDeps: true,
    
    tsConfig: {
      fileName: './tsconfig.json'
    },
    
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    },
    
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(@[^/]+/[^/]+|[^/]+)',
        theme: {
          graph: {
            splines: 'ortho'
          },
          modules: [
            {
              criteria: { source: '^src/features/' },
              attributes: { fillcolor: '#ccffcc' }
            },
            {
              criteria: { source: '^src/utils/' },
              attributes: { fillcolor: '#ffcccc' }
            }
          ],
          dependencies: [
            {
              criteria: { circular: true },
              attributes: { color: 'red', penwidth: 2 }
            }
          ]
        }
      }
    },
    
    progress: { type: 'performance-log' }
  }
};
```

### CLIコマンド

```bash
# 検証実行
npx depcruise src/

# 依存関係グラフを生成
npx depcruise src/ --include-only "^src" --output-type dot | dot -T svg > deps.svg

# HTML形式のレポート
npx depcruise src/ --output-type html > deps.html

# メトリクス表示
npx depcruise src/ --output-type metrics
```

---

## 7. npm audit / audit-ci（セキュリティ）

### audit-ci インストール

```bash
npm install -D audit-ci
```

### 設定ファイル: `audit-ci.json`

```json
{
  "$schema": "https://github.com/IBM/audit-ci/raw/main/docs/schema.json",
  
  // 指定した重大度以上でエラー終了
  // low, moderate, high, critical, none
  "high": true,
  
  // スキップするアドバイザリID（既知の問題で対応不可の場合）
  "allowlist": [
    // "GHSA-xxxx-xxxx-xxxx"
  ],
  
  // devDependenciesの脆弱性を無視するか
  "skip-dev": false,
  
  // 出力形式
  "output-format": "text",
  
  // レポートタイプ
  "report-type": "full",
  
  // package-lockが古い場合にエラー
  "package-lock-only": true,
  
  // レジストリURL（プライベートレジストリの場合）
  "registry": null,
  
  // 余分な引数
  "extra-args": []
}
```

### CLIオプション

```bash
# 基本実行（高以上でエラー）
npx audit-ci --high

# moderate以上でエラー
npx audit-ci --moderate

# 本番依存のみチェック
npx audit-ci --high --skip-dev

# JSON出力
npx audit-ci --high --output-format json
```

---

## 8. Husky + lint-staged（Gitフック）

### インストール

```bash
npm install -D husky lint-staged
npx husky init
```

### 設定ファイル: `.husky/pre-commit`

```bash
#!/bin/sh
npx lint-staged
```

### 設定ファイル: `.husky/pre-push`

```bash
#!/bin/sh
npm run typecheck
npm run lint
npm run knip
npm run circular
npm run test
```

### lint-staged設定: `lint-staged.config.js`

```javascript
module.exports = {
  // TypeScript/JavaScriptファイル
  '*.{ts,tsx,js,jsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write'
  ],
  
  // JSON/YAML/Markdownファイル
  '*.{json,yaml,yml,md}': [
    'prettier --write'
  ],
  
  // package.jsonが変更された場合
  'package.json': [
    'npx sort-package-json'
  ]
};
```

### package.json内の設定（代替）

```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",
      "prettier --write"
    ]
  }
}
```

---

## 9. 統合package.json設定

```json
{
  "name": "quality-focused-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "// === ビルド ===": "",
    "build": "tsc",
    "dev": "tsc --watch",
    
    "// === 品質チェック ===": "",
    "lint": "eslint src/ --max-warnings 0",
    "lint:fix": "eslint src/ --fix --max-warnings 0",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json}\"",
    
    "// === デッドコード・依存関係 ===": "",
    "knip": "knip",
    "knip:strict": "knip --production --strict",
    "knip:fix": "knip --fix",
    
    "// === 重複コード ===": "",
    "jscpd": "jscpd src/ --config .jscpd.json",
    "jscpd:report": "jscpd src/ --reporters html,json --output ./reports/jscpd",
    
    "// === 循環依存 ===": "",
    "circular": "madge --circular --extensions ts,tsx --ts-config ./tsconfig.json src/",
    "circular:image": "madge --circular --image ./reports/circular.svg --extensions ts,tsx src/",
    "deps:image": "madge --image ./reports/deps.svg --extensions ts,tsx src/",
    
    "// === 依存関係検証 ===": "",
    "depcruise": "depcruise src/",
    "depcruise:graph": "depcruise src/ --include-only '^src' --output-type dot | dot -T svg > ./reports/deps-full.svg",
    
    "// === セキュリティ ===": "",
    "audit": "audit-ci --high",
    "audit:report": "npm audit --json > ./reports/audit.json",
    
    "// === テスト ===": "",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    
    "// === 統合チェック ===": "",
    "quality": "npm run typecheck && npm run lint && npm run knip && npm run jscpd && npm run circular && npm run depcruise",
    "quality:full": "npm run quality && npm run test && npm run audit",
    
    "// === CI用 ===": "",
    "ci": "npm run quality:full",
    
    "// === Gitフック ===": "",
    "prepare": "husky"
  },
  "devDependencies": {
    "@eslint/js": "^9.0.0",
    "audit-ci": "^7.0.0",
    "dependency-cruiser": "^16.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-sonarjs": "^2.0.0",
    "husky": "^9.0.0",
    "jscpd": "^4.0.0",
    "knip": "^5.0.0",
    "lint-staged": "^15.0.0",
    "madge": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0",
    "typescript-eslint": "^8.0.0",
    "vitest": "^2.0.0"
  }
}
```

---

## 10. CLAUDE.md推奨設定

Claude Code用の最適化されたCLAUDE.mdファイル:

```markdown
# プロジェクト設定

## 技術スタック
- TypeScript 5.x (strict mode)
- Node.js 20.x
- ESLint 9.x (flat config)

## コード品質ルール

### 必須
- 関数は50行以内
- サイクロマティック複雑度 <= 5
- ネスト深度 <= 3
- パラメータ数 <= 3
- 循環依存禁止
- 未使用コード禁止

### コマンド
```bash
npm run lint      # ESLint
npm run knip      # デッドコード検出
npm run circular  # 循環依存チェック
npm run quality   # 全チェック実行
```

### 検証手順
1. コード作成
2. `npm run quality` で品質チェック
3. エラーがあれば修正
4. テスト実行: `npm run test`

## コーディング規約
- 1ファイル1責任
- 深いネストより早期リターン
- マジックナンバー禁止（定数化）
- 型は明示的に記述
```

---

## 厳格度レベル一覧

| ツール/設定 | 緩い | 標準 | 厳格（推奨） |
|-------------|------|------|--------------|
| complexity | 15 | 10 | **5** |
| max-depth | 5 | 4 | **3** |
| max-lines-per-function | 100 | 75 | **50** |
| max-params | 5 | 4 | **3** |
| cognitive-complexity | 20 | 15 | **10** |
| jscpd minTokens | 100 | 50 | **25** |
| jscpd minLines | 10 | 5 | **3** |
| jscpd mode | weak | mild | **strict** |
| Knip mode | default | production | **production --strict** |
| circular deps | 許容 | 警告 | **0件** |

---

## トラブルシューティング

### ESLintが遅い場合
```bash
# キャッシュを使用
eslint src/ --cache --cache-location .eslintcache
```

### Knipの誤検知が多い場合
```bash
# デバッグモードで確認
npx knip --debug
```

### jscpdが多すぎる重複を報告する場合
```json
{
  "minTokens": 50,
  "minLines": 5
}
```

### Madgeが動かない場合
```bash
# TypeScript設定を明示
npx madge --ts-config ./tsconfig.json src/
```