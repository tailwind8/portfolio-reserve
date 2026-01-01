/**
 * HTMLサニタイゼーションユーティリティ
 *
 * XSS攻撃を防ぐため、ユーザー入力をエスケープする関数を提供します。
 * Reactは自動的にエスケープしますが、明示的にエスケープが必要な場合に使用します。
 */

/**
 * HTMLエスケープ
 *
 * <, >, &, ", ' をHTMLエンティティに変換します。
 *
 * @param text - エスケープする文字列
 * @returns エスケープされた文字列
 *
 * @example
 * escapeHtml('<script>alert("XSS")</script>')
 * // => '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * HTMLタグを除去
 *
 * すべてのHTMLタグを削除します。
 *
 * @param text - HTMLタグを除去する文字列
 * @returns HTMLタグが除去された文字列
 *
 * @example
 * stripHtmlTags('<p>Hello <b>World</b></p>')
 * // => 'Hello World'
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * SQLインジェクション対策用のエスケープ
 *
 * シングルクォートをエスケープします。
 * ただし、Prisma ORMを使用している場合は自動的にエスケープされるため、
 * 通常は使用する必要はありません。
 *
 * @param text - エスケープする文字列
 * @returns エスケープされた文字列
 */
export function escapeSql(text: string): string {
  return text.replace(/'/g, "''");
}

/**
 * ユーザー入力の妥当性チェック
 *
 * 危険なパターン（script, onclick, onerror など）が含まれていないかチェックします。
 *
 * @param text - チェックする文字列
 * @returns 危険なパターンが含まれていない場合はtrue
 */
export function isSafeInput(text: string): boolean {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onerror, onload など
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<svg/gi,
  ];

  return !dangerousPatterns.some((pattern) => pattern.test(text));
}

/**
 * URLのバリデーション
 *
 * 安全なURL（http, httpsプロトコル）であることを確認します。
 * javascript:, data: などの危険なプロトコルを拒否します。
 *
 * @param url - 検証するURL
 * @returns 安全なURLの場合はtrue
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * リダイレクトURLの検証
 *
 * オープンリダイレクト脆弱性を防ぐため、内部URLのみを許可します。
 *
 * @param redirectUrl - リダイレクト先URL
 * @param allowedOrigins - 許可するオリジンのリスト（省略時は相対パスのみ許可）
 * @returns 安全なリダイレクト先の場合はtrue
 */
export function isSafeRedirect(redirectUrl: string, allowedOrigins?: string[]): boolean {
  // 相対パス（/で始まる）の場合は許可
  if (redirectUrl.startsWith('/') && !redirectUrl.startsWith('//')) {
    return true;
  }

  // 絶対URLの場合、許可されたオリジンかチェック
  if (allowedOrigins && allowedOrigins.length > 0) {
    try {
      const url = new URL(redirectUrl);
      return allowedOrigins.includes(url.origin);
    } catch {
      return false;
    }
  }

  // 許可リストがない場合は相対パスのみ許可
  return false;
}

/**
 * ファイル名のサニタイゼーション
 *
 * パストラバーサル攻撃を防ぐため、ファイル名から危険な文字を除去します。
 *
 * @param filename - サニタイズするファイル名
 * @returns サニタイズされたファイル名
 */
export function sanitizeFilename(filename: string): string {
  // パストラバーサル対策: ../や..\ を除去
  let sanitized = filename.replace(/\.\.(\/|\\)/g, '');

  // 危険な文字を除去
  sanitized = sanitized.replace(/[<>:"|?*\x00-\x1f]/g, '');

  // 先頭と末尾のドットとスペースを除去
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '');

  return sanitized;
}
