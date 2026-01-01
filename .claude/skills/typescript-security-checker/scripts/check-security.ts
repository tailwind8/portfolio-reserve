#!/usr/bin/env ts-node
/**
 * セキュリティ診断スクリプト
 *
 * 使用方法:
 *   npx ts-node .claude/skills/typescript-security-checker/scripts/check-security.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface SecurityIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  filePath: string;
  lineNumber: number;
  code: string;
  recommendation: string;
}

interface SecurityReport {
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  issues: SecurityIssue[];
}

/**
 * ファイルを再帰的に検索
 */
function findFiles(dir: string, extensions: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      results.push(...findFiles(filePath, extensions));
    } else if (extensions.some(ext => file.endsWith(ext))) {
      results.push(filePath);
    }
  }

  return results;
}

/**
 * セキュリティ問題を検出
 */
function detectSecurityIssues(filePath: string): SecurityIssue[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const issues: SecurityIssue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // Pattern 1: eval() または new Function()
    if (line.match(/\beval\s*\(|new\s+Function\s*\(/)) {
      issues.push({
        severity: 'critical',
        type: 'Code Injection',
        filePath,
        lineNumber,
        code: line.trim(),
        recommendation: 'eval() と new Function() は使用しないでください。コードインジェクションのリスクがあります。',
      });
    }

    // Pattern 2: dangerouslySetInnerHTML without sanitization
    if (line.includes('dangerouslySetInnerHTML') && !line.includes('DOMPurify')) {
      issues.push({
        severity: 'high',
        type: 'XSS',
        filePath,
        lineNumber,
        code: line.trim(),
        recommendation: 'dangerouslySetInnerHTML を使用する場合は DOMPurify でサニタイズしてください。',
      });
    }

    // Pattern 3: process.env in client components
    if (line.includes("'use client'")) {
      // 次の数行でprocess.env使用をチェック
      for (let j = i + 1; j < Math.min(i + 50, lines.length); j++) {
        if (lines[j].includes('process.env') && !lines[j].includes('NEXT_PUBLIC_')) {
          issues.push({
            severity: 'high',
            type: 'Environment Variable Leak',
            filePath,
            lineNumber: j + 1,
            code: lines[j].trim(),
            recommendation: 'クライアントコンポーネントでは process.env を使用しないでください。NEXT_PUBLIC_ プレフィックス付きの環境変数のみ使用可能です。',
          });
        }
      }
    }

    // Pattern 4: バリデーションなしのAPI Route
    if (line.includes('export async function POST') || line.includes('export async function PATCH')) {
      let hasValidation = false;
      // 次の30行でバリデーションをチェック
      for (let j = i; j < Math.min(i + 30, lines.length); j++) {
        if (lines[j].includes('.safeParse') || lines[j].includes('.parse(')) {
          hasValidation = true;
          break;
        }
      }

      if (!hasValidation) {
        issues.push({
          severity: 'high',
          type: 'Missing Validation',
          filePath,
          lineNumber,
          code: line.trim(),
          recommendation: 'API Routes では必ず入力バリデーションを実装してください（Zod推奨）。',
        });
      }
    }

    // Pattern 5: Prismaクエリでtenant_id フィルタなし（API Routes内）
    if (filePath.includes('/api/') && line.match(/prisma\.\w+\.find/)) {
      let hasTenantFilter = false;
      // 前後10行でtenant_idチェック
      for (let j = Math.max(0, i - 10); j < Math.min(i + 10, lines.length); j++) {
        if (lines[j].includes('tenant_id') || lines[j].includes('tenantId')) {
          hasTenantFilter = true;
          break;
        }
      }

      if (!hasTenantFilter) {
        issues.push({
          severity: 'critical',
          type: 'Missing Tenant Isolation',
          filePath,
          lineNumber,
          code: line.trim(),
          recommendation: '必ず tenant_id でフィルタリングしてください。マルチテナント分離が必須です。',
        });
      }
    }

    // Pattern 6: 認証チェックなしのAPI Route
    if (line.includes('export async function GET') ||
        line.includes('export async function POST') ||
        line.includes('export async function PATCH') ||
        line.includes('export async function DELETE')) {

      let hasAuthCheck = false;
      // 次の20行で認証チェック
      for (let j = i; j < Math.min(i + 20, lines.length); j++) {
        if (lines[j].includes('requireAuth') || lines[j].includes('getSession') || lines[j].includes('session')) {
          hasAuthCheck = true;
          break;
        }
      }

      if (!hasAuthCheck && !filePath.includes('/api/auth/')) {
        issues.push({
          severity: 'high',
          type: 'Missing Authentication',
          filePath,
          lineNumber,
          code: line.trim(),
          recommendation: 'API Routes では必ず認証チェックを実装してください。',
        });
      }
    }

    // Pattern 7: プレーンテキストパスワード
    if (line.match(/password\s*[:=]\s*['"`]/) && !line.includes('process.env')) {
      issues.push({
        severity: 'critical',
        type: 'Hardcoded Password',
        filePath,
        lineNumber,
        code: line.trim(),
        recommendation: 'パスワードをコードにハードコードしないでください。環境変数を使用してください。',
      });
    }

    // Pattern 8: SQLインジェクション（$queryRawUnsafe）
    if (line.includes('$queryRawUnsafe')) {
      issues.push({
        severity: 'critical',
        type: 'SQL Injection',
        filePath,
        lineNumber,
        code: line.trim(),
        recommendation: '$queryRawUnsafe を使用しないでください。パラメータ化クエリ ($queryRaw) を使用してください。',
      });
    }
  }

  return issues;
}

/**
 * レポートを生成
 */
function generateReport(allIssues: SecurityIssue[]): SecurityReport {
  const totalIssues = allIssues.length;
  const criticalCount = allIssues.filter(i => i.severity === 'critical').length;
  const highCount = allIssues.filter(i => i.severity === 'high').length;
  const mediumCount = allIssues.filter(i => i.severity === 'medium').length;
  const lowCount = allIssues.filter(i => i.severity === 'low').length;

  return {
    totalIssues,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    issues: allIssues,
  };
}

/**
 * Markdownレポートを生成
 */
function generateMarkdownReport(report: SecurityReport): string {
  const now = new Date().toLocaleString('ja-JP');

  let md = `# セキュリティ診断レポート\n\n`;
  md += `生成日時: ${now}\n\n`;
  md += `## サマリー\n\n`;
  md += `| 重大度 | 件数 | 状態 |\n`;
  md += `|--------|------|------|\n`;
  md += `| 🔴 Critical | ${report.criticalCount} | ${report.criticalCount === 0 ? '✅' : '⚠️'} |\n`;
  md += `| 🟠 High | ${report.highCount} | ${report.highCount === 0 ? '✅' : '⚠️'} |\n`;
  md += `| 🟡 Medium | ${report.mediumCount} | ${report.mediumCount === 0 ? '✅' : '💡'} |\n`;
  md += `| 🔵 Low | ${report.lowCount} | ${report.lowCount === 0 ? '✅' : '💡'} |\n`;
  md += `| **合計** | **${report.totalIssues}** | ${report.totalIssues === 0 ? '✅' : '⚠️'} |\n\n`;

  if (report.totalIssues === 0) {
    md += `## 結果\n\n`;
    md += `✅ セキュリティ問題は検出されませんでした。\n\n`;
    return md;
  }

  // 重大度別に問題をグループ化
  const criticalIssues = report.issues.filter(i => i.severity === 'critical');
  const highIssues = report.issues.filter(i => i.severity === 'high');
  const mediumIssues = report.issues.filter(i => i.severity === 'medium');
  const lowIssues = report.issues.filter(i => i.severity === 'low');

  // Critical
  if (criticalIssues.length > 0) {
    md += `## 🔴 Critical (${criticalIssues.length}件)\n\n`;
    criticalIssues.forEach((issue, index) => {
      md += `### ${index + 1}. ${issue.type}\n\n`;
      md += `**ファイル**: \`${issue.filePath}:${issue.lineNumber}\`\n\n`;
      md += `**コード**:\n\`\`\`typescript\n${issue.code}\n\`\`\`\n\n`;
      md += `**推奨**: ${issue.recommendation}\n\n`;
    });
  }

  // High
  if (highIssues.length > 0) {
    md += `## 🟠 High (${highIssues.length}件)\n\n`;
    highIssues.forEach((issue, index) => {
      md += `### ${index + 1}. ${issue.type}\n\n`;
      md += `**ファイル**: \`${issue.filePath}:${issue.lineNumber}\`\n\n`;
      md += `**コード**:\n\`\`\`typescript\n${issue.code}\n\`\`\`\n\n`;
      md += `**推奨**: ${issue.recommendation}\n\n`;
    });
  }

  // Medium
  if (mediumIssues.length > 0) {
    md += `## 🟡 Medium (${mediumIssues.length}件)\n\n`;
    mediumIssues.forEach((issue, index) => {
      md += `### ${index + 1}. ${issue.type}\n\n`;
      md += `**ファイル**: \`${issue.filePath}:${issue.lineNumber}\`\n\n`;
      md += `**コード**:\n\`\`\`typescript\n${issue.code}\n\`\`\`\n\n`;
      md += `**推奨**: ${issue.recommendation}\n\n`;
    });
  }

  return md;
}

/**
 * メイン処理
 */
function main() {
  const appDir = path.join(process.cwd(), 'reserve-app', 'src', 'app');

  console.log('🔍 ファイルを検索中...');
  const files = findFiles(appDir, ['.ts', '.tsx']);
  console.log(`✅ ${files.length}個のファイルを発見`);

  console.log('\n🔒 セキュリティ問題を検出中...');
  const allIssues: SecurityIssue[] = [];

  for (const file of files) {
    const issues = detectSecurityIssues(file);
    allIssues.push(...issues);
  }

  const report = generateReport(allIssues);

  console.log('\n📝 レポート生成中...');
  const markdown = generateMarkdownReport(report);

  const outputPath = path.join(process.cwd(), 'security-report.md');
  fs.writeFileSync(outputPath, markdown);

  console.log(`\n✅ レポートを生成しました: ${outputPath}`);
  console.log('\n--- サマリー ---');
  console.log(`総問題数: ${report.totalIssues}`);
  console.log(`Critical: ${report.criticalCount}件`);
  console.log(`High: ${report.highCount}件`);
  console.log(`Medium: ${report.mediumCount}件`);

  if (report.criticalCount > 0) {
    console.log('\n⚠️ 重大度Criticalの問題が検出されました。早急に修正してください。');
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

export { detectSecurityIssues, generateReport, generateMarkdownReport };
