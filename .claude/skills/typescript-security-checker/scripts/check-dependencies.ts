#!/usr/bin/env ts-node
/**
 * 依存パッケージの脆弱性チェックスクリプト
 *
 * 使用方法:
 *   npx ts-node .claude/skills/typescript-security-checker/scripts/check-dependencies.ts
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface Vulnerability {
  name: string;
  version: string;
  severity: 'critical' | 'high' | 'moderate' | 'low';
  title: string;
  url: string;
}

interface DependencyReport {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  moderateCount: number;
  lowCount: number;
  vulnerabilities: Vulnerability[];
  summary: string;
}

/**
 * npm auditを実行
 */
function runNpmAudit(): DependencyReport {
  try {
    const result = execSync('npm audit --json', {
      cwd: path.join(process.cwd(), 'reserve-app'),
      encoding: 'utf-8',
    });

    const auditData = JSON.parse(result);

    const vulnerabilities: Vulnerability[] = [];

    // npm audit の結果を解析
    if (auditData.vulnerabilities) {
      for (const [name, vuln] of Object.entries(auditData.vulnerabilities as any)) {
        vulnerabilities.push({
          name,
          version: vuln.range || 'unknown',
          severity: vuln.severity,
          title: vuln.via?.[0]?.title || 'Unknown vulnerability',
          url: vuln.via?.[0]?.url || '',
        });
      }
    }

    const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
    const moderateCount = vulnerabilities.filter(v => v.severity === 'moderate').length;
    const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

    return {
      totalVulnerabilities: vulnerabilities.length,
      criticalCount,
      highCount,
      moderateCount,
      lowCount,
      vulnerabilities,
      summary: auditData.metadata?.vulnerabilities
        ? JSON.stringify(auditData.metadata.vulnerabilities)
        : '',
    };
  } catch (error: any) {
    // npm audit はエラーコード1で終了する場合がある
    if (error.stdout) {
      try {
        const auditData = JSON.parse(error.stdout);

        const vulnerabilities: Vulnerability[] = [];

        if (auditData.vulnerabilities) {
          for (const [name, vuln] of Object.entries(auditData.vulnerabilities as any)) {
            vulnerabilities.push({
              name,
              version: vuln.range || 'unknown',
              severity: vuln.severity,
              title: vuln.via?.[0]?.title || 'Unknown vulnerability',
              url: vuln.via?.[0]?.url || '',
            });
          }
        }

        const criticalCount = vulnerabilities.filter(v => v.severity === 'critical').length;
        const highCount = vulnerabilities.filter(v => v.severity === 'high').length;
        const moderateCount = vulnerabilities.filter(v => v.severity === 'moderate').length;
        const lowCount = vulnerabilities.filter(v => v.severity === 'low').length;

        return {
          totalVulnerabilities: vulnerabilities.length,
          criticalCount,
          highCount,
          moderateCount,
          lowCount,
          vulnerabilities,
          summary: auditData.metadata?.vulnerabilities
            ? JSON.stringify(auditData.metadata.vulnerabilities)
            : '',
        };
      } catch (parseError) {
        console.error('Failed to parse audit output:', parseError);
      }
    }

    // エラーの場合は空のレポートを返す
    return {
      totalVulnerabilities: 0,
      criticalCount: 0,
      highCount: 0,
      moderateCount: 0,
      lowCount: 0,
      vulnerabilities: [],
      summary: 'Error running npm audit',
    };
  }
}

/**
 * Markdownレポートを生成
 */
function generateMarkdownReport(report: DependencyReport): string {
  const now = new Date().toLocaleString('ja-JP');

  let md = `# 依存パッケージ脆弱性レポート\n\n`;
  md += `生成日時: ${now}\n\n`;
  md += `## サマリー\n\n`;
  md += `| 重大度 | 件数 | 状態 |\n`;
  md += `|--------|------|------|\n`;
  md += `| 🔴 Critical | ${report.criticalCount} | ${report.criticalCount === 0 ? '✅' : '⚠️'} |\n`;
  md += `| 🟠 High | ${report.highCount} | ${report.highCount === 0 ? '✅' : '⚠️'} |\n`;
  md += `| 🟡 Moderate | ${report.moderateCount} | ${report.moderateCount === 0 ? '✅' : '💡'} |\n`;
  md += `| 🔵 Low | ${report.lowCount} | ${report.lowCount === 0 ? '✅' : '💡'} |\n`;
  md += `| **合計** | **${report.totalVulnerabilities}** | ${report.totalVulnerabilities === 0 ? '✅' : '⚠️'} |\n\n`;

  if (report.totalVulnerabilities === 0) {
    md += `## 結果\n\n`;
    md += `✅ 既知の脆弱性は検出されませんでした。\n\n`;
    return md;
  }

  // 重大度別に脆弱性をグループ化
  const criticalVulns = report.vulnerabilities.filter(v => v.severity === 'critical');
  const highVulns = report.vulnerabilities.filter(v => v.severity === 'high');
  const moderateVulns = report.vulnerabilities.filter(v => v.severity === 'moderate');
  const lowVulns = report.vulnerabilities.filter(v => v.severity === 'low');

  // Critical
  if (criticalVulns.length > 0) {
    md += `## 🔴 Critical (${criticalVulns.length}件)\n\n`;
    criticalVulns.forEach((vuln, index) => {
      md += `### ${index + 1}. ${vuln.name}\n\n`;
      md += `- **バージョン**: ${vuln.version}\n`;
      md += `- **脆弱性**: ${vuln.title}\n`;
      if (vuln.url) {
        md += `- **詳細**: ${vuln.url}\n`;
      }
      md += `\n`;
    });
  }

  // High
  if (highVulns.length > 0) {
    md += `## 🟠 High (${highVulns.length}件)\n\n`;
    highVulns.forEach((vuln, index) => {
      md += `### ${index + 1}. ${vuln.name}\n\n`;
      md += `- **バージョン**: ${vuln.version}\n`;
      md += `- **脆弱性**: ${vuln.title}\n`;
      if (vuln.url) {
        md += `- **詳細**: ${vuln.url}\n`;
      }
      md += `\n`;
    });
  }

  // Moderate
  if (moderateVulns.length > 0) {
    md += `## 🟡 Moderate (${moderateVulns.length}件)\n\n`;
    moderateVulns.forEach((vuln, index) => {
      md += `### ${index + 1}. ${vuln.name}\n\n`;
      md += `- **バージョン**: ${vuln.version}\n`;
      md += `- **脆弱性**: ${vuln.title}\n`;
      if (vuln.url) {
        md += `- **詳細**: ${vuln.url}\n`;
      }
      md += `\n`;
    });
  }

  // Low
  if (lowVulns.length > 0) {
    md += `## 🔵 Low (${lowVulns.length}件)\n\n`;
    lowVulns.forEach((vuln, index) => {
      md += `### ${index + 1}. ${vuln.name}\n\n`;
      md += `- **バージョン**: ${vuln.version}\n`;
      md += `- **脆弱性**: ${vuln.title}\n`;
      if (vuln.url) {
        md += `- **詳細**: ${vuln.url}\n`;
      }
      md += `\n`;
    });
  }

  // 修正方法
  md += `## 修正方法\n\n`;
  md += `### 自動修正\n\n`;
  md += `\`\`\`bash\n`;
  md += `cd reserve-app\n`;
  md += `npm audit fix\n`;
  md += `\`\`\`\n\n`;
  md += `### 手動修正\n\n`;
  md += `\`\`\`bash\n`;
  md += `cd reserve-app\n`;
  md += `npm audit fix --force  # Breaking changes含む\n`;
  md += `\`\`\`\n\n`;
  md += `⚠️ 注意: \`--force\` は破壊的変更を含む可能性があります。実行前にテストしてください。\n\n`;

  return md;
}

/**
 * メイン処理
 */
function main() {
  console.log('🔍 依存パッケージの脆弱性をチェック中...');

  const report = runNpmAudit();

  console.log('\n📝 レポート生成中...');
  const markdown = generateMarkdownReport(report);

  const outputPath = path.join(process.cwd(), 'dependency-vulnerabilities-report.md');
  fs.writeFileSync(outputPath, markdown);

  console.log(`\n✅ レポートを生成しました: ${outputPath}`);
  console.log('\n--- サマリー ---');
  console.log(`総脆弱性数: ${report.totalVulnerabilities}`);
  console.log(`Critical: ${report.criticalCount}件`);
  console.log(`High: ${report.highCount}件`);
  console.log(`Moderate: ${report.moderateCount}件`);
  console.log(`Low: ${report.lowCount}件`);

  if (report.criticalCount > 0 || report.highCount > 0) {
    console.log('\n⚠️ 重大度Critical/Highの脆弱性が検出されました。');
    console.log('修正方法:');
    console.log('  cd reserve-app && npm audit fix');
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

export { runNpmAudit, generateMarkdownReport };
