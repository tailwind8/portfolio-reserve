#!/usr/bin/env ts-node
/**
 * Featureファイルを解析し、BDD品質レポートを生成
 *
 * 使用方法:
 *   npx ts-node .claude/skills/playwright-bdd-analyzer/scripts/analyze-features.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface FeatureAnalysis {
  filePath: string;
  featureName: string;
  scenarioCount: number;
  stepCount: number;
  hasBackground: boolean;
  hasScenarioOutline: boolean;
  tags: string[];
  scenarios: ScenarioAnalysis[];
}

interface ScenarioAnalysis {
  name: string;
  tags: string[];
  stepCount: number;
  isDeclarative: boolean; // 宣言的スタイルかどうか
}

interface AnalysisReport {
  totalFeatures: number;
  totalScenarios: number;
  totalSteps: number;
  backgroundUsageRate: number;
  scenarioOutlineUsageRate: number;
  declarativeScenarioRate: number;
  tagCoverageRate: number;
  features: FeatureAnalysis[];
}

/**
 * Featureファイルを再帰的に検索
 */
function findFeatureFiles(dir: string): string[] {
  const results: string[] = [];
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
 * Featureファイルを解析
 */
function analyzeFeatureFile(filePath: string): FeatureAnalysis {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let featureName = '';
  let scenarioCount = 0;
  let stepCount = 0;
  let hasBackground = false;
  let hasScenarioOutline = false;
  const tags: Set<string> = new Set();
  const scenarios: ScenarioAnalysis[] = [];

  let currentScenario: Partial<ScenarioAnalysis> | null = null;
  let currentScenarioSteps: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Feature名を抽出
    if (trimmed.startsWith('Feature:')) {
      featureName = trimmed.replace('Feature:', '').trim();
    }

    // Backgroundの検出
    if (trimmed.startsWith('Background:')) {
      hasBackground = true;
    }

    // Scenario/Scenario Outlineの検出
    if (trimmed.startsWith('Scenario:') || trimmed.startsWith('Scenario Outline:')) {
      // 前のシナリオを保存
      if (currentScenario) {
        scenarios.push({
          name: currentScenario.name || '',
          tags: currentScenario.tags || [],
          stepCount: currentScenarioSteps.length,
          isDeclarative: isDeclarativeStyle(currentScenarioSteps),
        });
      }

      scenarioCount++;
      currentScenario = {
        name: trimmed.replace(/Scenario( Outline)?:/, '').trim(),
        tags: [],
      };
      currentScenarioSteps = [];

      if (trimmed.startsWith('Scenario Outline:')) {
        hasScenarioOutline = true;
      }
    }

    // タグの検出
    if (trimmed.startsWith('@')) {
      const scenarioTags = trimmed.split(' ').filter(t => t.startsWith('@'));
      scenarioTags.forEach(tag => {
        tags.add(tag);
        if (currentScenario) {
          currentScenario.tags = currentScenario.tags || [];
          currentScenario.tags.push(tag);
        }
      });
    }

    // ステップの検出
    if (/^\s*(Given|When|Then|And|But)/.test(trimmed)) {
      stepCount++;
      currentScenarioSteps.push(trimmed);
    }
  }

  // 最後のシナリオを保存
  if (currentScenario) {
    scenarios.push({
      name: currentScenario.name || '',
      tags: currentScenario.tags || [],
      stepCount: currentScenarioSteps.length,
      isDeclarative: isDeclarativeStyle(currentScenarioSteps),
    });
  }

  return {
    filePath,
    featureName,
    scenarioCount,
    stepCount,
    hasBackground,
    hasScenarioOutline,
    tags: Array.from(tags),
    scenarios,
  };
}

/**
 * 宣言的スタイルかどうかを判定
 * 命令的なキーワード（「クリック」「入力」「選択」など）が含まれていないか確認
 */
function isDeclarativeStyle(steps: string[]): boolean {
  const imperativeKeywords = [
    'クリック',
    'を入力',
    'フィールド',
    'ボタン',
    'を選択',
    'ドロップダウン',
  ];

  for (const step of steps) {
    for (const keyword of imperativeKeywords) {
      if (step.includes(keyword)) {
        return false; // 命令的
      }
    }
  }

  return true; // 宣言的
}

/**
 * レポートを生成
 */
function generateReport(features: FeatureAnalysis[]): AnalysisReport {
  const totalFeatures = features.length;
  const totalScenarios = features.reduce((sum, f) => sum + f.scenarioCount, 0);
  const totalSteps = features.reduce((sum, f) => sum + f.stepCount, 0);

  const featuresWithBackground = features.filter(f => f.hasBackground).length;
  const backgroundUsageRate = (featuresWithBackground / totalFeatures) * 100;

  const featuresWithScenarioOutline = features.filter(f => f.hasScenarioOutline).length;
  const scenarioOutlineUsageRate = (featuresWithScenarioOutline / totalFeatures) * 100;

  const declarativeScenarios = features.flatMap(f => f.scenarios).filter(s => s.isDeclarative).length;
  const declarativeScenarioRate = (declarativeScenarios / totalScenarios) * 100;

  const scenariosWithTags = features.flatMap(f => f.scenarios).filter(s => s.tags.length > 0).length;
  const tagCoverageRate = (scenariosWithTags / totalScenarios) * 100;

  return {
    totalFeatures,
    totalScenarios,
    totalSteps,
    backgroundUsageRate,
    scenarioOutlineUsageRate,
    declarativeScenarioRate,
    tagCoverageRate,
    features,
  };
}

/**
 * Markdownレポートを生成
 */
function generateMarkdownReport(report: AnalysisReport): string {
  const now = new Date().toLocaleString('ja-JP');

  let md = `# Playwright-BDD 品質分析レポート\n\n`;
  md += `生成日時: ${now}\n\n`;
  md += `## サマリー\n\n`;
  md += `| 項目 | 値 | 目標 | 状態 |\n`;
  md += `|-----|-----|------|------|\n`;
  md += `| 総Feature数 | ${report.totalFeatures} | - | - |\n`;
  md += `| 総Scenario数 | ${report.totalScenarios} | - | - |\n`;
  md += `| 総Step数 | ${report.totalSteps} | - | - |\n`;
  md += `| Background活用率 | ${report.backgroundUsageRate.toFixed(1)}% | 50% | ${report.backgroundUsageRate >= 50 ? '✅' : '⚠️'} |\n`;
  md += `| Scenario Outline活用率 | ${report.scenarioOutlineUsageRate.toFixed(1)}% | 30% | ${report.scenarioOutlineUsageRate >= 30 ? '✅' : '⚠️'} |\n`;
  md += `| 宣言的シナリオ率 | ${report.declarativeScenarioRate.toFixed(1)}% | 80% | ${report.declarativeScenarioRate >= 80 ? '✅' : '⚠️'} |\n`;
  md += `| タグ付け率 | ${report.tagCoverageRate.toFixed(1)}% | 90% | ${report.tagCoverageRate >= 90 ? '✅' : '⚠️'} |\n\n`;

  md += `## 詳細分析\n\n`;

  // 優れている点
  md += `### 優れている点 ✅\n\n`;
  const strengths: string[] = [];
  if (report.backgroundUsageRate >= 50) {
    strengths.push(`Backgroundを適切に活用している（${report.backgroundUsageRate.toFixed(1)}%）`);
  }
  if (report.declarativeScenarioRate >= 80) {
    strengths.push(`宣言的スタイルのシナリオが多い（${report.declarativeScenarioRate.toFixed(1)}%）`);
  }
  if (report.tagCoverageRate >= 90) {
    strengths.push(`ほぼすべてのシナリオにタグが付いている（${report.tagCoverageRate.toFixed(1)}%）`);
  }

  if (strengths.length > 0) {
    strengths.forEach((s, i) => {
      md += `${i + 1}. ${s}\n`;
    });
    md += `\n`;
  } else {
    md += `（特になし）\n\n`;
  }

  // 改善が必要な点
  md += `### 改善が必要な点 ⚠️\n\n`;
  const improvements: string[] = [];

  if (report.declarativeScenarioRate < 80) {
    const imperativeCount = report.totalScenarios - Math.floor((report.declarativeScenarioRate / 100) * report.totalScenarios);
    improvements.push(`命令的なシナリオが多い（${imperativeCount}件）`);
    improvements.push(`  推奨: UIの詳細をステップ定義に移動`);
  }

  if (report.backgroundUsageRate < 50) {
    improvements.push(`Backgroundの活用が不足（${report.backgroundUsageRate.toFixed(1)}%）`);
    improvements.push(`  推奨: 共通の前提条件をBackgroundに抽出`);
  }

  if (report.scenarioOutlineUsageRate < 30) {
    improvements.push(`Scenario Outlineの活用が不足（${report.scenarioOutlineUsageRate.toFixed(1)}%）`);
    improvements.push(`  推奨: 類似シナリオをパラメータ化`);
  }

  if (improvements.length > 0) {
    improvements.forEach((s, i) => {
      md += `${Math.floor(i / 2) + 1}. ${s}\n`;
    });
    md += `\n`;
  } else {
    md += `（特になし）\n\n`;
  }

  // Feature別詳細
  md += `## Feature別詳細\n\n`;
  md += `| Feature名 | Scenario数 | Step数 | Background | Scenario Outline | 宣言的率 |\n`;
  md += `|-----------|-----------|--------|-----------|-----------------|--------|\n`;

  for (const feature of report.features) {
    const declarativeCount = feature.scenarios.filter(s => s.isDeclarative).length;
    const declarativeRate = feature.scenarioCount > 0 ? (declarativeCount / feature.scenarioCount) * 100 : 0;

    md += `| ${feature.featureName} | ${feature.scenarioCount} | ${feature.stepCount} | ${feature.hasBackground ? '✅' : '-'} | ${feature.hasScenarioOutline ? '✅' : '-'} | ${declarativeRate.toFixed(0)}% |\n`;
  }

  return md;
}

/**
 * メイン処理
 */
function main() {
  const featuresDir = path.join(process.cwd(), 'reserve-app', 'features');

  if (!fs.existsSync(featuresDir)) {
    console.error(`❌ Featureディレクトリが見つかりません: ${featuresDir}`);
    process.exit(1);
  }

  console.log('🔍 Featureファイルを検索中...');
  const featureFiles = findFeatureFiles(featuresDir);
  console.log(`✅ ${featureFiles.length}個のFeatureファイルを発見`);

  console.log('\n📊 解析中...');
  const features = featureFiles.map(analyzeFeatureFile);

  const report = generateReport(features);

  console.log('\n📝 レポート生成中...');
  const markdown = generateMarkdownReport(report);

  const outputPath = path.join(process.cwd(), 'bdd-quality-report.md');
  fs.writeFileSync(outputPath, markdown);

  console.log(`\n✅ レポートを生成しました: ${outputPath}`);
  console.log('\n--- サマリー ---');
  console.log(`総Feature数: ${report.totalFeatures}`);
  console.log(`総Scenario数: ${report.totalScenarios}`);
  console.log(`宣言的シナリオ率: ${report.declarativeScenarioRate.toFixed(1)}%`);
  console.log(`タグ付け率: ${report.tagCoverageRate.toFixed(1)}%`);
}

// スクリプト実行
if (require.main === module) {
  main();
}

export { analyzeFeatureFile, generateReport, generateMarkdownReport };
