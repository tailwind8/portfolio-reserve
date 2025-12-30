#!/bin/bash

# GitHub Labels作成スクリプト

echo "🏷️  GitHubラベルを作成します..."

# ラベル作成（既に存在する場合はスキップ）
gh label create "feature" --color "10B981" --description "新機能実装" --force 2>/dev/null || true
gh label create "bug" --color "EF4444" --description "バグ修正" --force 2>/dev/null || true
gh label create "refactor" --color "F59E0B" --description "リファクタリング" --force 2>/dev/null || true
gh label create "test" --color "3B82F6" --description "テスト追加" --force 2>/dev/null || true
gh label create "docs" --color "9CA3AF" --description "ドキュメント" --force 2>/dev/null || true
gh label create "tech-debt" --color "F97316" --description "技術的負債" --force 2>/dev/null || true
gh label create "priority-high" --color "DC2626" --description "高優先度" --force 2>/dev/null || true
gh label create "priority-medium" --color "FBBF24" --description "中優先度" --force 2>/dev/null || true
gh label create "priority-low" --color "34D399" --description "低優先度" --force 2>/dev/null || true
gh label create "sprint-1" --color "6366F1" --description "Sprint 1" --force 2>/dev/null || true
gh label create "sprint-2" --color "8B5CF6" --description "Sprint 2" --force 2>/dev/null || true
gh label create "sprint-3" --color "EC4899" --description "Sprint 3" --force 2>/dev/null || true
gh label create "sprint-4" --color "14B8A6" --description "Sprint 4" --force 2>/dev/null || true

echo "✅ ラベル作成完了"
