# 資料・コード・Issue差分レポート

**作成日**: 2026-01-04
**目的**: ドキュメント・実装コード・GitHub Issuesの整合性確認

---

## 📊 エグゼクティブサマリー

資料・コード・Issueを比較した結果、以下の差分・不足が確認されました：

| カテゴリ | 差分件数 | 重要度 |
|---------|---------|--------|
| **ドキュメントの陳腐化** | 5件 | 🔴 高 |
| **未ドキュメント化ページ** | 9件 | 🟡 中 |
| **未ドキュメント化API** | 15件以上 | 🟡 中 |
| **未実装ドキュメント記載ページ** | 9件 | 🟢 低（設計変更で統合済み） |
| **Issue vs ドキュメント不整合** | 2件 | 🔴 高 |
| **DB設計書の未記載モデル** | 5件 | 🟡 中 |

---

## 🔴 1. ドキュメントの陳腐化（要更新）

### 1.1 機能一覧とページ設計.md

**ファイル**: `documents/basic/機能一覧とページ設計.md`

| 項目 | 記載内容 | 実際の状態 | 対応 |
|------|---------|-----------|------|
| **Phase 1完了率** | 85%完了 | 100%完了 | 要更新 |
| **分析・レポート機能** | 0%完了 | ✅ 100%実装済み | 要更新 |
| **Issue #26, #27** | 未実装マーク | CLOSED（実装済み） | 要更新 |

**修正箇所**:
- L10: `実装進捗: Phase 1 コア機能 **85%完了**` → `**100%完了**`
- L88-94: 分析・レポート機能のセクションを `100%完了 ✅` に更新

### 1.2 データベース設計書.md

**ファイル**: `documents/spec/データベース設計書.md`

**最終更新**: 2025-12-31 → 2026-01-04に要更新

**未記載モデル（5件）**:

| モデル名 | 用途 | Prisma実装場所 |
|---------|------|---------------|
| `BookingStaffShift` | スタッフシフト管理 | schema.prisma:139-156 |
| `BookingStaffVacation` | スタッフ休暇管理 | schema.prisma:158-174 |
| `FeatureFlag` | 機能フラグ管理 | schema.prisma:180-200 |
| `BookingBlockedTimeSlot` | 予約ブロック時間管理 | schema.prisma:236-254 |
| `SecurityLog` | セキュリティ監査ログ | schema.prisma:260-276 |

### 1.3 ルート設計書.md

**ファイル**: `documents/basic/ルート設計書.md`

**最終更新**: 2026-01-01 → 要更新

**未記載ページルート（9件）**:

| ルート | 実装ファイル | 用途 |
|-------|-------------|------|
| `/help` | `src/app/help/page.tsx` | ヘルプページ |
| `/maintenance` | `src/app/maintenance/page.tsx` | メンテナンスモード |
| `/privacy` | `src/app/privacy/page.tsx` | プライバシーポリシー |
| `/terms` | `src/app/terms/page.tsx` | 利用規約 |
| `/admin/blocked-times` | `src/app/admin/blocked-times/page.tsx` | 予約ブロック管理 |
| `/super-admin/login` | `src/app/super-admin/login/page.tsx` | スーパー管理者ログイン |
| `/super-admin/dashboard` | `src/app/super-admin/dashboard/page.tsx` | スーパー管理者ダッシュボード |
| `/super-admin/feature-flags` | `src/app/super-admin/feature-flags/page.tsx` | 機能フラグ管理 |
| `/admin/analytics` | `src/app/admin/analytics/page.tsx` | 分析レポート |

**未記載APIルート（15件以上）**:

| エンドポイント | メソッド | 用途 |
|--------------|---------|------|
| `/api/admin/analytics` | GET | 分析データ取得 |
| `/api/admin/analytics/repeat-rate` | GET | リピート率分析 |
| `/api/admin/blocked-times` | GET, POST | ブロック時間管理 |
| `/api/admin/blocked-times/[id]` | DELETE | ブロック時間削除 |
| `/api/admin/customers` | GET | 顧客一覧取得 |
| `/api/admin/customers/[id]` | GET, PATCH | 顧客詳細・更新 |
| `/api/admin/customers/[id]/memo` | PATCH | 顧客メモ更新 |
| `/api/admin/dashboard` | GET | ダッシュボードデータ |
| `/api/admin/menus` | GET, POST | メニュー管理 |
| `/api/admin/menus/[id]` | PATCH, DELETE | メニュー編集・削除 |
| `/api/admin/settings` | GET, PATCH | 店舗設定管理 |
| `/api/auth/super-admin/login` | POST | スーパー管理者ログイン |
| `/api/cron/send-reminders` | GET | リマインダー送信Cron |
| `/api/feature-flags` | GET | 機能フラグ取得 |
| `/api/super-admin/feature-flags` | GET, PUT | 機能フラグ管理 |
| `/api/internal/public-status` | GET | システム公開状態 |

---

## 🟡 2. 設計変更による差分（対応不要）

### 2.1 ドキュメント記載だが未実装のページ

以下のページは設計変更により**統合・省略**されたと判断：

| ドキュメント記載 | 実際の状態 | 判断理由 |
|----------------|-----------|---------|
| `/booking/menu` | ❌ 未実装 | `/booking` に統合 |
| `/booking/staff` | ❌ 未実装 | `/booking` に統合 |
| `/booking/datetime` | ❌ 未実装 | `/booking` に統合 |
| `/booking/confirm` | ❌ 未実装 | `/booking` に統合 |
| `/booking/complete` | ❌ 未実装 | `/booking` に統合 |
| `/mypage/profile` | ❌ 未実装 | `/mypage` に統合 |
| `/reset-password` | ❌ 未実装 | Phase 2予定 |
| `/admin/reservations/[id]` | ❌ 未実装 | モーダル編集に変更 |
| `/admin/reservations/list` | ❌ 未実装 | `/admin/reservations` に統合 |
| `/admin/profile` | ❌ 未実装 | 将来実装予定 |

**推奨対応**: ドキュメントを現状に合わせて更新（統合済みの旨を明記）

---

## 🔴 3. Issue vs ドキュメント不整合

### 3.1 GitHub-Issues一覧.md vs 機能一覧とページ設計.md

| Issue | GitHub-Issues一覧 | 機能一覧 | 実際の実装 |
|-------|------------------|---------|-----------|
| **#26 分析レポート** | ✅ CLOSED | 0%完了 ⚠️ | ✅ 実装済み |
| **#27 リピート率分析** | ✅ CLOSED | 0%完了 ⚠️ | ✅ 実装済み |

**問題**: 機能一覧の進捗率が古い情報のまま

---

## 📋 4. 現在のOPEN Issues確認

GitHub-Issues一覧.mdより、OPEN状態のIssue（3件）:

| Issue# | タイトル | 状態 | 対応方針 |
|--------|---------|------|---------|
| **#29** | コンポーネント整理 | OPEN | Phase 2で対応（技術的負債） |
| **#70** | トランザクションの実装 | OPEN | `/api/admin/reservations`で未実装 |
| **#71** | 検索フィルターのDB最適化 | OPEN | 検索フィルターがJS側で処理中 |

---

## 📁 5. E2Eテストとドキュメントの対応

**E2Eテストファイル数**: 42件

**主要テストカテゴリ**:
- 認証系: `auth.spec.ts`, `session-management.spec.ts`, `super-admin-login.spec.ts`
- 予約系: `booking.spec.ts`, `booking-cancel.spec.ts`, `booking-update.spec.ts`
- 管理系: `admin-*.spec.ts` (複数)
- セキュリティ系: `security-headers.spec.ts`, `xss-csrf.spec.ts`, `api-rate-limit.spec.ts`
- 機能フラグ系: `feature-flag-*.spec.ts`

**テストドキュメント状況**:
- `documents/testing/gherkin網羅性.md`: テスト方針のみ（具体的シナリオなし）
- `documents/testing/gherkin網羅性評価レポート.md`: 詳細評価あり

---

## ✅ 6. 推奨アクション

### 優先度: 高 🔴

1. **機能一覧とページ設計.md の更新**
   - Phase 1完了率を100%に更新
   - 分析・レポート機能を100%完了に更新
   - 実装完了マークを正確に反映

2. **GitHub-Issues一覧.md との整合性確保**
   - CLOSED Issueの完了状態を他ドキュメントに反映

### 優先度: 中 🟡

3. **データベース設計書.md の更新**
   - 新規追加5モデルのテーブル定義を追記
   - ER図を更新

4. **ルート設計書.md の更新**
   - 未記載ページルート9件を追記
   - 未記載APIルート15件以上を追記
   - SUPER_ADMINセクションを新設

5. **API設計書.md の更新確認**
   - 新規APIの仕様追記

### 優先度: 低 🟢

6. **設計変更の明記**
   - 予約フロー統合（/booking/*→/booking）の設計判断を記録
   - 管理画面のモーダル編集方式への変更を記録

---

## 📊 7. 実装状況サマリー

### ページ実装状況

| カテゴリ | ドキュメント記載 | 実装済み | カバー率 |
|---------|-----------------|---------|---------|
| 公開ページ | 5 | 5 | 100% |
| 認証ページ | 2 | 2 | 100% |
| ユーザーページ | 8 | 4 | 50%（統合による減少） |
| 管理者ページ | 12 | 10 | 83% |
| **追加ページ（未記載）** | 0 | 9 | - |

### API実装状況

| カテゴリ | ドキュメント記載 | 実装済み | 差分 |
|---------|-----------------|---------|------|
| 認証API | 3 | 4 | +1 |
| 予約API | 5 | 5 | 0 |
| 管理者API | 11 | 20+ | +9以上 |
| ユーティリティAPI | 2 | 5 | +3 |

---

## 🔗 関連ドキュメント

- `documents/実装状況差分レポート.md` - 実装進捗の詳細
- `documents/GitHub-Issues一覧.md` - Issue管理
- `documents/basic/機能一覧とページ設計.md` - 機能仕様
- `documents/basic/ルート設計書.md` - ルート設計
- `documents/spec/データベース設計書.md` - DB設計

---

**作成者**: Claude Code
**レビュー**: 未
