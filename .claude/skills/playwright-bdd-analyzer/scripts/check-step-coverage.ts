#!/usr/bin/env ts-node
/**
 * ステップ定義のカバレッジと再利用性を分析
 *
 * 使用方法:
 *   npx ts-node .claude/skills/playwright-bdd-analyzer/scripts/check-step-coverage.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface StepDefinition {
  pattern: string;
  usageCount: number;
  locations: string[]; // 使用されているFeatureファイル
}

interface StepCoverageReport {
  totalStepDefinitions: number;
  totalStepUsages: number;
  reuseRate: number;
  mostUsedSteps: StepDefinition[];
  unusedSteps: StepDefinition[];
  duplicateCandidates: string[][];
}

/**
 * Featureファイルからステップを抽出
 */
function extractStepsFromFeature(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const steps: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\s*(Given|When|Then|And|But)\s/.test(trimmed)) {
      // Given/When/Then/And/Butを除いた本文のみを抽出
      const stepText = trimmed.replace(/^(Given|When|Then|And|But)\s+/, '');
      steps.push(stepText);
    }
  }

  return steps;
}

/**
 * Featureファイルを再帰的に検索
 */
function findFeatureFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...findFeatureFiles(filePath));
    } else if (file.endsWith('.feature')) {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * テストファイルからステップ定義パターンを抽出
 */
function extractStepDefinitions(testDir: string): string[] {
  const stepPatterns: string[] = [];

  if (!fs.existsSync(testDir)) {
    return stepPatterns;
  }

  const files = fs.readdirSync(testDir);

  for (const file of files) {
    const filePath = path.join(testDir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && (file.endsWith('.spec.ts') || file.endsWith('.steps.ts'))) {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Given/When/Then パターンを抽出
      const regex = /(Given|When|Then)\(['"`](.+?)['"`]/g;
      let match;

      while ((match = regex.exec(content)) !== null) {
        stepPatterns.push(match[2]);
      }
    }
  }

  return stepPatterns;
}

/**
 * ステップとステップ定義のマッチングを行い、カバレッジを計算
 */
function analyzeStepCoverage(
  featureSteps: Map<string, string[]>,
  stepDefinitions: string[]
): StepCoverageReport {
  // ステップ定義ごとの使用回数をカウント
  const stepUsage = new Map<string, StepDefinition>();

  for (const pattern of stepDefinitions) {
    stepUsage.set(pattern, {
      pattern,
      usageCount: 0,
      locations: [],
    });
  }

  // 各Featureファイルのステップをステップ定義とマッチング
  for (const [featurePath, steps] of featureSteps.entries()) {
    for (const step of steps) {
      for (const pattern of stepDefinitions) {
        if (matchesPattern(step, pattern)) {
          const usage = stepUsage.get(pattern)!;
          usage.usageCount++;
          if (!usage.locations.includes(featurePath)) {
            usage.locations.push(featurePath);
          }
        }
      }
    }
  }

  const totalStepDefinitions = stepDefinitions.length;
  const allSteps = Array.from(stepUsage.values());

  // 再利用率の計算（2回以上使われているステップの割合）
  const reusedSteps = allSteps.filter(s => s.usageCount >= 2).length;
  const reuseRate = totalStepDefinitions > 0 ? (reusedSteps / totalStepDefinitions) * 100 : 0;

  // 総使用回数
  const totalStepUsages = allSteps.reduce((sum, s) => sum + s.usageCount, 0);

  // 最も使われているステップ（Top 10）
  const mostUsedSteps = allSteps
    .filter(s => s.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10);

  // 未使用のステップ
  const unusedSteps = allSteps.filter(s => s.usageCount === 0);

  // 重複候補の検出（類似パターン）
  const duplicateCandidates = findDuplicateCandidates(stepDefinitions);

  return {
    totalStepDefinitions,
    totalStepUsages,
    reuseRate,
    mostUsedSteps,
    unusedSteps,
    duplicateCandidates,
  };
}

/**
 * ステップがステップ定義パターンにマッチするか判定（簡易版）
 */
function matchesPattern(step: string, pattern: string): boolean {
  // {string}, {int} などのパラメータをワイルドカードに変換
  const regexPattern = pattern
    .replace(/\{string\}/g, '.+')
    .replace(/\{int\}/g, '\\d+')
    .replace(/\{float\}/g, '[\\d.]+');

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(step);
}

/**
 * 重複候補のステップ定義を検出
 */
function findDuplicateCandidates(patterns: string[]): string[][] {
  const candidates: string[][] = [];

  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const similarity = calculateSimilarity(patterns[i], patterns[j]);
      if (similarity > 0.7) {
        candidates.push([patterns[i], patterns[j]]);
      }
    }
  }

  return candidates;
}

/**
 * 2つの文字列の類似度を計算（簡易版）
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);

  const commonWords = words1.filter(w => words2.includes(w)).length;
  const totalWords = Math.max(words1.length, words2.length);

  return totalWords > 0 ? commonWords / totalWords : 0;
}

/**
 * Markdownレポートを生成
 */
function generateMarkdownReport(report: StepCoverageReport): string {
  const now = new Date().toLocaleString('ja-JP');

  let md = `# ステップ定義カバレッジレポート\n\n`;
  md += `生成日時: ${now}\n\n`;
  md += `## サマリー\n\n`;
  md += `| 項目 | 値 | 目標 | 状態 |\n`;
  md += `|-----|-----|------|------|\n`;
  md += `| 総ステップ定義数 | ${report.totalStepDefinitions} | - | - |\n`;
  md += `| 総使用回数 | ${report.totalStepUsages} | - | - |\n`;
  md += `| ステップ再利用率 | ${report.reuseRate.toFixed(1)}% | 60% | ${report.reuseRate >= 60 ? '✅' : '⚠️'} |\n`;
  md += `| 未使用ステップ数 | ${report.unusedSteps.length} | 0 | ${report.unusedSteps.length === 0 ? '✅' : '⚠️'} |\n`;
  md += `| 重複候補数 | ${report.duplicateCandidates.length} | 0 | ${report.duplicateCandidates.length === 0 ? '✅' : '⚠️'} |\n\n`;

  // 最も使われているステップ
  md += `## 最も使われているステップ（Top 10）\n\n`;
  if (report.mostUsedSteps.length > 0) {
    md += `| # | ステップパターン | 使用回数 | 使用場所数 |\n`;
    md += `|---|---------------|---------|----------|\n`;
    report.mostUsedSteps.forEach((step, index) => {
      md += `| ${index + 1} | ${step.pattern} | ${step.usageCount} | ${step.locations.length} |\n`;
    });
    md += `\n`;
  } else {
    md += `（なし）\n\n`;
  }

  // 未使用のステップ
  md += `## 未使用のステップ定義\n\n`;
  if (report.unusedSteps.length > 0) {
    md += `以下のステップ定義は一度も使われていません：\n\n`;
    report.unusedSteps.forEach((step, index) => {
      md += `${index + 1}. \`${step.pattern}\`\n`;
    });
    md += `\n推奨: 未使用のステップ定義を削除するか、対応するシナリオを追加してください。\n\n`;
  } else {
    md += `✅ すべてのステップ定義が使用されています。\n\n`;
  }

  // 重複候補
  md += `## 重複候補のステップ定義\n\n`;
  if (report.duplicateCandidates.length > 0) {
    md += `以下のステップ定義は統合可能かもしれません：\n\n`;
    report.duplicateCandidates.forEach((pair, index) => {
      md += `${index + 1}. \n`;
      md += `   - \`${pair[0]}\`\n`;
      md += `   - \`${pair[1]}\`\n\n`;
    });
    md += `推奨: パラメータ化して1つのステップ定義に統合することを検討してください。\n\n`;
  } else {
    md += `✅ 重複候補は検出されませんでした。\n\n`;
  }

  return md;
}

/**
 * メイン処理
 */
function main() {
  const featuresDir = path.join(process.cwd(), 'reserve-app', 'features');
  const testDir = path.join(process.cwd(), 'reserve-app', 'src', '__tests__', 'e2e');

  console.log('🔍 Featureファイルを検索中...');
  const featureFiles = findFeatureFiles(featuresDir);
  console.log(`✅ ${featureFiles.length}個のFeatureファイルを発見`);

  console.log('\n📊 ステップを抽出中...');
  const featureSteps = new Map<string, string[]>();
  for (const file of featureFiles) {
    const steps = extractStepsFromFeature(file);
    featureSteps.set(file, steps);
  }

  console.log('\n🔍 ステップ定義を検索中...');
  const stepDefinitions = extractStepDefinitions(testDir);
  console.log(`✅ ${stepDefinitions.length}個のステップ定義を発見`);

  console.log('\n📊 カバレッジを分析中...');
  const report = analyzeStepCoverage(featureSteps, stepDefinitions);

  console.log('\n📝 レポート生成中...');
  const markdown = generateMarkdownReport(report);

  const outputPath = path.join(process.cwd(), 'step-coverage-report.md');
  fs.writeFileSync(outputPath, markdown);

  console.log(`\n✅ レポートを生成しました: ${outputPath}`);
  console.log('\n--- サマリー ---');
  console.log(`総ステップ定義数: ${report.totalStepDefinitions}`);
  console.log(`ステップ再利用率: ${report.reuseRate.toFixed(1)}%`);
  console.log(`未使用ステップ数: ${report.unusedSteps.length}`);
}

// スクリプト実行
if (require.main === module) {
  main();
}

export { analyzeStepCoverage, generateMarkdownReport };
