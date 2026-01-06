## 📝 概要
<!-- 変更内容を簡潔に説明してください -->


## 🎯 関連Issue
<!-- 関連するIssue番号を記載（例: Closes #123） -->
Closes #

## ✅ 実装内容
<!-- 実装した内容をチェックリスト形式で記載 -->
- [ ]
- [ ]
- [ ]

## 🧪 テスト方法
<!-- 動作確認の手順を記載 -->
1. `npm run dev` で開発サーバー起動
2.
3.

---

## 📋 コード規約チェックリスト

### 必須項目（PR前に確認）

#### 品質チェック
- [ ] `npm run lint` → エラー0件
- [ ] `npm run build:ci` → ビルド成功
- [ ] `npm test` → テスト通過
- [ ] `npm run test:e2e:smoke` → E2Eスモークテスト通過

#### テスト規約
- [ ] E2Eテストで `data-testid` セレクタを使用（`getByText`/`:has-text`は非推奨）
- [ ] Page Objectパターンを使用（新規E2Eテストの場合）
- [ ] Gherkinシナリオが存在（新機能の場合）

#### API規約（APIルート変更時）
- [ ] Zodバリデーションを実装
- [ ] tenant_idフィルタを追加（Prismaクエリ使用時）
- [ ] エラーハンドリングを実装

#### TypeScript規約
- [ ] `any`型を使用していない
- [ ] 適切な型定義を追加

#### コンポーネント規約（UIコンポーネント変更時）
- [ ] インタラクティブ要素に`data-testid`を追加
- [ ] アクセシビリティ属性（aria-label等）を追加

---

## 💡 レビューポイント
<!-- レビュアーに特に見てほしい点があれば記載 -->


---

## 📚 参考ドキュメント

- [開発プロセスルール](.cursor/rules/開発プロセスルール.mdc)
- [コード品質チェックリスト](documents/コード品質チェックリスト.md)
- [セキュリティチェックリスト](.claude/skills/typescript-security-checker/references/security-checklist.md)
