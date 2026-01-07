import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  sonarjs.configs.recommended,

  // グローバル無視設定
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "jest.config.js",
    "jest.setup.js",
    "coverage/**",
    "node_modules/**",
    "prisma/**",
    "sentry.*.config.ts",
    "eslint.config.mjs",
  ]),

  // 全ソースコード共通ルール
  // 新規ファイルは厳格に、既存ファイルは後の設定で上書き
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    ignores: ["src/__tests__/**"],
    rules: {
      // 複雑性制御
      'complexity': ['error', 8],
      'max-depth': ['error', 4],
      'max-params': ['error', 4],
      'max-nested-callbacks': ['error', 3],
      'max-lines-per-function': ['error', {
        max: 60,
        skipBlankLines: true,
        skipComments: true,
      }],
      'max-lines': ['error', {
        max: 400,
        skipBlankLines: true,
        skipComments: true,
      }],

      // 可読性
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
      'max-len': ['error', {
        code: 120,
        ignoreUrls: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: true,
        ignoreRegExpLiterals: true,
      }],

      // ベストプラクティス
      'eqeqeq': ['error', 'always'],
      'curly': 'error',
      'no-eval': 'error',
      'no-return-assign': 'error',
      'array-callback-return': 'error',

      // SonarJS
      'sonarjs/cognitive-complexity': ['error', 12],
      'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
      'sonarjs/todo-tag': 'off',
      'sonarjs/slow-regex': 'warn',
      'sonarjs/concise-regex': 'warn',
      'sonarjs/single-character-alternation': 'warn',
      'sonarjs/use-type-alias': 'off',
      'sonarjs/pseudo-random': 'off',
    },
  },

  // テストファイル用の緩和設定
  {
    files: [
      "src/__tests__/**/*.ts",
      "src/__tests__/**/*.tsx",
      "**/*.spec.ts",
      "**/*.test.ts",
      "**/*.spec.tsx",
      "**/*.test.tsx",
    ],
    rules: {
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'complexity': 'off',
      'max-depth': 'off',
      'max-params': 'off',
      'max-nested-callbacks': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/no-dead-store': 'off',
      'sonarjs/no-unused-vars': 'off',
      'sonarjs/todo-tag': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/concise-regex': 'off',
      'sonarjs/anchor-precedence': 'off',
      'sonarjs/single-character-alternation': 'off',
      'sonarjs/no-hardcoded-credentials': 'off',
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-commented-code': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/no-skipped-tests': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/no-control-regex': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
      'sonarjs/no-hardcoded-ip': 'off',
      'sonarjs/code-eval': 'off',
      'sonarjs/xml-parser-xxe': 'off',
      'sonarjs/sonar-no-regex-spaces': 'off',
    },
  },

  // Page Objectファイル用の緩和設定
  {
    files: ["src/__tests__/e2e/pages/**/*.ts"],
    rules: {
      'max-lines': ['warn', { max: 800, skipBlankLines: true, skipComments: true }],
    },
  },

  // ===================================
  // 既存ファイル用の緩和設定（一時的に警告レベル）
  // 後日リファクタリングが必要なファイル
  // ===================================

  // API Routes - 全て警告レベル
  {
    files: ["src/app/api/**/*.ts"],
    rules: {
      'complexity': 'warn',
      'max-lines-per-function': 'warn',
      'max-lines': 'warn',
      'max-len': 'warn',
      'max-params': 'warn',
      'curly': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
    },
  },

  // Pages - 全て警告レベル
  {
    files: [
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
    ],
    rules: {
      'complexity': 'warn',
      'max-lines-per-function': 'warn',
      'max-lines': 'warn',
      'max-len': 'warn',
      'max-params': 'warn',
      'curly': 'warn',
      'no-nested-ternary': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
    },
  },

  // Components - 全て警告レベル
  {
    files: ["src/components/**/*.tsx", "src/components/**/*.ts"],
    rules: {
      'complexity': 'warn',
      'max-lines-per-function': 'warn',
      'max-lines': 'warn',
      'max-params': 'warn',
      'curly': 'warn',
      'no-nested-ternary': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-nested-conditional': 'warn',
    },
  },

  // Lib - 全て警告レベル
  {
    files: ["src/lib/**/*.ts"],
    rules: {
      'complexity': 'warn',
      'max-lines-per-function': 'warn',
      'max-lines': 'warn',
      'max-params': 'warn',
      'curly': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-duplicate-string': 'warn',
      'sonarjs/no-control-regex': 'warn',
      'sonarjs/anchor-precedence': 'warn',
    },
  },

  // Hooks - 全て警告レベル
  {
    files: ["src/hooks/**/*.ts"],
    rules: {
      'complexity': 'warn',
      'max-lines-per-function': 'warn',
      'max-lines': 'warn',
      'max-params': 'warn',
      'curly': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
    },
  },

  // Middleware - 警告レベル
  {
    files: ["src/middleware.ts"],
    rules: {
      'complexity': 'warn',
      'max-lines-per-function': 'warn',
      'max-lines': 'warn',
      'max-params': 'warn',
      'curly': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
    },
  },

  // Types - 警告レベル（型定義は長くなりがち）
  {
    files: ["src/types/**/*.ts"],
    rules: {
      'max-len': 'warn',
      'max-lines': 'warn',
    },
  },
]);

export default eslintConfig;
