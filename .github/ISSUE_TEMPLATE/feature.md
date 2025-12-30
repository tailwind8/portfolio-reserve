---
name: Feature Request
about: 新機能の実装
title: '[FEATURE] '
labels: ['feature', 'priority-medium']
assignees: ''
---

## 📋 機能概要
<!-- 何を実装するか簡潔に記載 -->


## 🎯 ユーザーストーリー
```
As a [ユーザー種別: customer/admin/staff]
I want to [やりたいこと]
So that [目的・価値]
```

## ✅ 受入基準（BDD Scenario）
```gherkin
Feature: [機能名]

  Scenario: [シナリオ名]
    Given [前提条件]
    When [アクション]
    Then [期待結果]
    And [追加の期待結果]
```

## 🔧 実装タスク
- [ ] BDDシナリオ作成
- [ ] E2Eテスト実装（Playwright）
- [ ] 単体テスト実装（Jest + RTL）
- [ ] 機能実装
- [ ] リファクタリング
- [ ] ドキュメント更新

## 🗄️ データベース変更
<!-- Prismaスキーマの変更が必要な場合 -->
- [ ] 新規テーブル作成
- [ ] 既存テーブル変更
- [ ] マイグレーション作成

## 🔗 API仕様
<!-- 新規APIエンドポイントがある場合 -->
```
POST /api/xxx
Request: { ... }
Response: { ... }
```

## 📦 関連Issue
- Depends on: #XX
- Blocks: #XX
- Related to: #XX

## 🧪 テストケース
<!-- 追加で考慮すべきテストケースがあれば記載 -->
1.
2.
3.

## 📸 UIモック（あれば）
<!-- Figma、スクリーンショット、手描きなど -->


## 📝 実装メモ
<!-- 実装時の注意点、技術的な検討事項など -->


## ⚠️ 技術的負債・懸念事項
<!-- 実装により発生しうる技術的負債や懸念があれば -->
