#!/usr/bin/env ts-node
/**
 * フレーキーテストになりやすいパターンを検出
 *
 * 使用方法:
 *   npx ts-node .claude/skills/playwright-bdd-analyzer/scripts/detect-flaky-patterns.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface FlakyPattern {
  type: 'waitForTimeout' | 'textSelector' | 'nestedWait' | 'hardcodedDelay';
  severity: 'high' | 'medium' | 'low';
  filePath: string;
  lineNumber: number;
  code: string;
  recommendation: string;
}

interface FlakyReport {
  totalIssues: number;
  highSeverity: number;
  mediumSeverity: number;
  lowSeverity: number;
  patterns: FlakyPattern[];
}

/**
 * テストファイルを再帰的に検索
 */
function findTestFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results.push(...findTestFiles(filePath));
    } else if (file.endsWith('.spec.ts') || file.endsWith('.steps.ts')) {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * ファイルからフレーキーパターンを検出
 */
function detectFlakyPatterns(filePath: string): FlakyPattern[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const patterns: FlakyPattern[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Pattern 1: page.waitForTimeout()
    if (line.includes('waitForTimeout')) {
      patterns.push({
        type: 'waitForTimeout',
        severity: 'high',
        filePath,
        lineNumber,
        code: line.trim(),
        recommendation: 'waitForTimeout() を waitForSelector() または waitFor({ state: ... }) に置き換えてください。',
      });
    }

    // Pattern 2: テキストセレクタ（:has-text, text=）
    if (line.match(/['"](button|a|div):has-text\(|text=/)) {
      patterns.push({
        type: 'textSelector',
        severity: 'medium',
        filePath,
        lineNumber,
        code: line.trim(),
        recommendation: 'テキストセレクタを data-testid に置き換えてください。',
      });
    }

    // Pattern 3: ネストした待機処理
    if (
      i > 0 &&
      lines[i - 1].includes('waitFor') &&
      line.includes('waitFor')
    ) {
      patterns.push({
        type: 'nestedWait',
        severity: 'medium',
        filePath,
        lineNumber,
        code: `${lines[i - 1].trim()}\n${line.trim()}`,
        recommendation: '複数の待機処理を1つにまとめるか、より明確な待機条件に置き換えてください。',
      });
    }

    // Pattern 4: ハードコードされた遅延（setTimeout, delay）
    if (line.match(/setTimeout|delay\(/)) {
      patterns.push({
        type: 'hardcodedDelay',
        severity: 'high',
        filePath,
        lineNumber,
        code: line.trim(),
        recommendation: 'setTimeout/delay を waitForSelector() などの明示的な待機に置き換えてください。',
      });
    }
  }

  return patterns;
}

/**
 * レポートを生成
 */
function generateReport(allPatterns: FlakyPattern[]): FlakyReport {
  const totalIssues = allPatterns.length;
  const highSeverity = allPatterns.filter(p => p.severity === 'high').length;
  const mediumSeverity = allPatterns.filter(p => p.severity === 'medium').length;
  const lowSeverity = allPatterns.filter(p => p.severity === 'low').length;

  return {
    totalIssues,
    highSeverity,
    mediumSeverity,
    lowSeverity,
    patterns: allPatterns,
  };
}

/**
 * Markdownレポートを生成
 */
function generateMarkdownReport(report: FlakyReport): string {
  const now = new Date().toLocaleString('ja-JP');

  let md = `# フレーキーパターン検出レポート\n\n`;
  md += `生成日時: ${now}\n\n`;
  md += `## サマリー\n\n`;
  md += `| 項目 | 値 | 目標 | 状態 |\n`;
  md += `|-----|-----|------|------|\n`;
  md += `| 総問題数 | ${report.totalIssues} | 0 | ${report.totalIssues === 0 ? '✅' : '⚠️'} |\n`;
  md += `| 重大度: 高 | ${report.highSeverity} | 0 | ${report.highSeverity === 0 ? '✅' : '🔴'} |\n`;
  md += `| 重大度: 中 | ${report.mediumSeverity} | 0 | ${report.mediumSeverity === 0 ? '✅' : '⚠️'} |\n`;
  md += `| 重大度: 低 | ${report.lowSeverity} | 0 | ${report.lowSeverity === 0 ? '✅' : '⚠️'} |\n\n`;

  if (report.totalIssues === 0) {
    md += `## 結果\n\n`;
    md += `✅ フレーキーパターンは検出されませんでした。テストは安定しています。\n\n`;
    return md;
  }

  // 重大度別に問題をグループ化
  const highPatterns = report.patterns.filter(p => p.severity === 'high');
  const mediumPatterns = report.patterns.filter(p => p.severity === 'medium');
  const lowPatterns = report.patterns.filter(p => p.severity === 'low');

  // 重大度: 高
  if (highPatterns.length > 0) {
    md += `## 🔴 重大度: 高（${highPatterns.length}件）\n\n`;
    md += `以下の問題は早急に修正が必要です：\n\n`;

    highPatterns.forEach((pattern, index) => {
      md += `### ${index + 1}. ${pattern.type}\n\n`;
      md += `**ファイル**: \`${pattern.filePath}:${pattern.lineNumber}\`\n\n`;
      md += `**コード**:\n\`\`\`typescript\n${pattern.code}\n\`\`\`\n\n`;
      md += `**推奨**: ${pattern.recommendation}\n\n`;
    });
  }

  // 重大度: 中
  if (mediumPatterns.length > 0) {
    md += `## ⚠️ 重大度: 中（${mediumPatterns.length}件）\n\n`;
    md += `以下の問題は改善を推奨します：\n\n`;

    mediumPatterns.forEach((pattern, index) => {
      md += `### ${index + 1}. ${pattern.type}\n\n`;
      md += `**ファイル**: \`${pattern.filePath}:${pattern.lineNumber}\`\n\n`;
      md += `**コード**:\n\`\`\`typescript\n${pattern.code}\n\`\`\`\n\n`;
      md += `**推奨**: ${pattern.recommendation}\n\n`;
    });
  }

  // 重大度: 低
  if (lowPatterns.length > 0) {
    md += `## 💡 重大度: 低（${lowPatterns.length}件）\n\n`;
    md += `以下の問題は余裕があれば改善してください：\n\n`;

    lowPatterns.forEach((pattern, index) => {
      md += `### ${index + 1}. ${pattern.type}\n\n`;
      md += `**ファイル**: \`${pattern.filePath}:${pattern.lineNumber}\`\n\n`;
      md += `**コード**:\n\`\`\`typescript\n${pattern.code}\n\`\`\`\n\n`;
      md += `**推奨**: ${pattern.recommendation}\n\n`;
    });
  }

  // 改善例
  md += `## 改善例\n\n`;
  md += `### waitForTimeout → waitForSelector\n\n`;
  md += `❌ Before:\n\`\`\`typescript\n`;
  md += `await page.click('[data-testid="submit"]');\n`;
  md += `await page.waitForTimeout(2000);\n`;
  md += `const message = await page.locator('[data-testid="success"]').textContent();\n`;
  md += `\`\`\`\n\n`;
  md += `✅ After:\n\`\`\`typescript\n`;
  md += `await page.click('[data-testid="submit"]');\n`;
  md += `const message = page.locator('[data-testid="success"]');\n`;
  md += `await message.waitFor({ state: 'visible' });\n`;
  md += `await expect(message).toBeVisible();\n`;
  md += `\`\`\`\n\n`;

  md += `### テキストセレクタ → data-testid\n\n`;
  md += `❌ Before:\n\`\`\`typescript\n`;
  md += `await page.click('button:has-text("ログイン")');\n`;
  md += `\`\`\`\n\n`;
  md += `✅ After:\n\`\`\`typescript\n`;
  md += `await page.click('[data-testid="login-button"]');\n`;
  md += `\`\`\`\n\n`;

  return md;
}

/**
 * メイン処理
 */
function main() {
  const testDir = path.join(process.cwd(), 'reserve-app', 'src', '__tests__', 'e2e');

  console.log('🔍 テストファイルを検索中...');
  const testFiles = findTestFiles(testDir);
  console.log(`✅ ${testFiles.length}個のテストファイルを発見`);

  console.log('\n📊 フレーキーパターンを検出中...');
  const allPatterns: FlakyPattern[] = [];

  for (const file of testFiles) {
    const patterns = detectFlakyPatterns(file);
    allPatterns.push(...patterns);
  }

  const report = generateReport(allPatterns);

  console.log('\n📝 レポート生成中...');
  const markdown = generateMarkdownReport(report);

  const outputPath = path.join(process.cwd(), 'flaky-patterns-report.md');
  fs.writeFileSync(outputPath, markdown);

  console.log(`\n✅ レポートを生成しました: ${outputPath}`);
  console.log('\n--- サマリー ---');
  console.log(`総問題数: ${report.totalIssues}`);
  console.log(`重大度: 高: ${report.highSeverity}件`);
  console.log(`重大度: 中: ${report.mediumSeverity}件`);
  console.log(`重大度: 低: ${report.lowSeverity}件`);

  if (report.highSeverity > 0) {
    console.log('\n⚠️ 重大度の高い問題が検出されました。早急に修正してください。');
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

export { detectFlakyPatterns, generateReport, generateMarkdownReport };
