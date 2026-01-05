/**
 * sanitize.ts のユニットテスト
 *
 * XSS攻撃、SQLインジェクション、オープンリダイレクト、
 * パストラバーサル攻撃を防ぐためのサニタイズ関数のテスト
 */

import {
  escapeHtml,
  stripHtmlTags,
  escapeSql,
  isSafeInput,
  isSafeUrl,
  isSafeRedirect,
  sanitizeFilename,
} from '@/lib/sanitize';

describe('sanitize', () => {
  describe('escapeHtml', () => {
    it('should escape < and > characters', () => {
      expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    });

    it('should escape & character', () => {
      expect(escapeHtml('foo & bar')).toBe('foo &amp; bar');
    });

    it('should escape double quotes', () => {
      expect(escapeHtml('"quoted"')).toBe('&quot;quoted&quot;');
    });

    it('should escape single quotes', () => {
      expect(escapeHtml("'single'")).toBe('&#x27;single&#x27;');
    });

    it('should escape forward slashes', () => {
      expect(escapeHtml('path/to/file')).toBe('path&#x2F;to&#x2F;file');
    });

    it('should escape XSS attack patterns', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
    });

    it('should return empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });

    it('should not modify safe text', () => {
      expect(escapeHtml('Hello World')).toBe('Hello World');
    });

    it.each([
      ['&', '&amp;'],
      ['<', '&lt;'],
      ['>', '&gt;'],
      ['"', '&quot;'],
      ["'", '&#x27;'],
      ['/', '&#x2F;'],
    ])('should escape %s to %s', (input, expected) => {
      expect(escapeHtml(input)).toBe(expected);
    });

    it('should escape multiple special characters', () => {
      expect(escapeHtml('<a href="test">link</a>')).toBe(
        '&lt;a href=&quot;test&quot;&gt;link&lt;&#x2F;a&gt;'
      );
    });
  });

  describe('stripHtmlTags', () => {
    it('should remove simple HTML tags', () => {
      expect(stripHtmlTags('<p>Hello</p>')).toBe('Hello');
    });

    it('should remove nested HTML tags', () => {
      expect(stripHtmlTags('<p>Hello <b>World</b></p>')).toBe('Hello World');
    });

    it('should remove self-closing tags', () => {
      expect(stripHtmlTags('Hello<br/>World')).toBe('HelloWorld');
    });

    it('should remove tags with attributes', () => {
      expect(stripHtmlTags('<a href="http://example.com">Link</a>')).toBe('Link');
    });

    it('should handle script tags', () => {
      expect(stripHtmlTags('<script>alert("XSS")</script>')).toBe('alert("XSS")');
    });

    it('should return empty string for empty input', () => {
      expect(stripHtmlTags('')).toBe('');
    });

    it('should not modify text without tags', () => {
      expect(stripHtmlTags('Plain text')).toBe('Plain text');
    });

    it('should handle multiple tags in sequence', () => {
      expect(stripHtmlTags('<div><span>Content</span></div>')).toBe('Content');
    });

    it('should preserve text between tags', () => {
      expect(stripHtmlTags('Before <span>middle</span> after')).toBe(
        'Before middle after'
      );
    });
  });

  describe('escapeSql', () => {
    it('should escape single quotes', () => {
      expect(escapeSql("O'Brien")).toBe("O''Brien");
    });

    it('should escape multiple single quotes', () => {
      expect(escapeSql("It's John's")).toBe("It''s John''s");
    });

    it('should not modify strings without single quotes', () => {
      expect(escapeSql('Hello World')).toBe('Hello World');
    });

    it('should return empty string for empty input', () => {
      expect(escapeSql('')).toBe('');
    });

    it('should handle SQL injection attempt', () => {
      expect(escapeSql("'; DROP TABLE users; --")).toBe("''; DROP TABLE users; --");
    });
  });

  describe('isSafeInput', () => {
    it('should return true for safe text', () => {
      expect(isSafeInput('Hello World')).toBe(true);
    });

    it('should return false for script tags', () => {
      expect(isSafeInput('<script>alert("XSS")</script>')).toBe(false);
    });

    it('should return false for javascript: protocol', () => {
      expect(isSafeInput('javascript:alert(1)')).toBe(false);
    });

    it('should return false for onclick handlers', () => {
      expect(isSafeInput('<div onclick="alert(1)">')).toBe(false);
    });

    it('should return false for onerror handlers', () => {
      expect(isSafeInput('<img onerror="alert(1)">')).toBe(false);
    });

    it('should return false for onload handlers', () => {
      expect(isSafeInput('<body onload="alert(1)">')).toBe(false);
    });

    it('should return false for iframe tags', () => {
      expect(isSafeInput('<iframe src="http://evil.com">')).toBe(false);
    });

    it('should return false for object tags', () => {
      expect(isSafeInput('<object data="malware.swf">')).toBe(false);
    });

    it('should return false for embed tags', () => {
      expect(isSafeInput('<embed src="malware.swf">')).toBe(false);
    });

    it('should return false for svg tags', () => {
      expect(isSafeInput('<svg onload="alert(1)">')).toBe(false);
    });

    it('should return true for empty string', () => {
      expect(isSafeInput('')).toBe(true);
    });

    it('should return true for HTML entities (already escaped)', () => {
      expect(isSafeInput('&lt;script&gt;')).toBe(true);
    });

    it.each([
      ['<script>alert(1)</script>', false],
      ['javascript:void(0)', false],
      ['<div onclick=alert(1)>', false],
      ['<img onerror=alert(1)>', false],
      ['<iframe>', false],
      ['<object>', false],
      ['<embed>', false],
      ['<svg>', false],
      ['Normal text', true],
      ['<p>Paragraph</p>', true],
      ['<div>Content</div>', true],
    ])('isSafeInput(%s) should return %s', (input, expected) => {
      expect(isSafeInput(input)).toBe(expected);
    });
  });

  describe('isSafeUrl', () => {
    it('should return true for https URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
    });

    it('should return true for http URLs', () => {
      expect(isSafeUrl('http://example.com')).toBe(true);
    });

    it('should return false for javascript: URLs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    });

    it('should return false for data: URLs', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    });

    it('should return false for file: URLs', () => {
      expect(isSafeUrl('file:///etc/passwd')).toBe(false);
    });

    it('should return false for ftp: URLs', () => {
      expect(isSafeUrl('ftp://ftp.example.com')).toBe(false);
    });

    it('should return false for invalid URLs', () => {
      expect(isSafeUrl('not a url')).toBe(false);
    });

    it('should return false for relative URLs', () => {
      expect(isSafeUrl('/path/to/page')).toBe(false);
    });

    it('should return false for protocol-relative URLs', () => {
      expect(isSafeUrl('//example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isSafeUrl('')).toBe(false);
    });

    it.each([
      ['https://example.com', true],
      ['https://example.com/path', true],
      ['https://example.com:8080', true],
      ['http://localhost:3000', true],
      ['javascript:alert(1)', false],
      ['data:text/html,test', false],
      ['file:///etc/passwd', false],
      ['ftp://ftp.example.com', false],
      ['mailto:test@example.com', false],
      ['tel:+1234567890', false],
      ['', false],
      ['invalid', false],
    ])('isSafeUrl(%s) should return %s', (url, expected) => {
      expect(isSafeUrl(url)).toBe(expected);
    });
  });

  describe('isSafeRedirect', () => {
    describe('relative paths', () => {
      it('should allow relative paths starting with /', () => {
        expect(isSafeRedirect('/dashboard')).toBe(true);
      });

      it('should allow nested relative paths', () => {
        expect(isSafeRedirect('/admin/settings')).toBe(true);
      });

      it('should block protocol-relative URLs (//)', () => {
        expect(isSafeRedirect('//evil.com')).toBe(false);
      });

      it('should block absolute URLs without allowedOrigins', () => {
        expect(isSafeRedirect('https://evil.com')).toBe(false);
      });
    });

    describe('with allowedOrigins', () => {
      const allowedOrigins = ['https://example.com', 'https://app.example.com'];

      it('should allow URLs from allowed origins', () => {
        expect(isSafeRedirect('https://example.com/path', allowedOrigins)).toBe(true);
      });

      it('should allow URLs from allowed subdomain origins', () => {
        expect(isSafeRedirect('https://app.example.com/dashboard', allowedOrigins)).toBe(
          true
        );
      });

      it('should block URLs from non-allowed origins', () => {
        expect(isSafeRedirect('https://evil.com', allowedOrigins)).toBe(false);
      });

      it('should block URLs with different protocol', () => {
        expect(isSafeRedirect('http://example.com', allowedOrigins)).toBe(false);
      });

      it('should still allow relative paths with allowedOrigins', () => {
        expect(isSafeRedirect('/dashboard', allowedOrigins)).toBe(true);
      });
    });

    describe('edge cases', () => {
      it('should return false for empty string', () => {
        expect(isSafeRedirect('')).toBe(false);
      });

      it('should return false for invalid URLs', () => {
        expect(isSafeRedirect('not-a-url')).toBe(false);
      });

      it('should return false for empty allowedOrigins array', () => {
        expect(isSafeRedirect('https://example.com', [])).toBe(false);
      });

      it('should handle URLs with query parameters', () => {
        expect(isSafeRedirect('/search?q=test')).toBe(true);
      });

      it('should handle URLs with hash fragments', () => {
        expect(isSafeRedirect('/page#section')).toBe(true);
      });
    });

    it.each([
      ['/dashboard', undefined, true],
      ['/admin/settings', undefined, true],
      ['//evil.com', undefined, false],
      ['https://evil.com', undefined, false],
      ['https://example.com', ['https://example.com'], true],
      ['https://evil.com', ['https://example.com'], false],
      ['', undefined, false],
      ['not-a-url', undefined, false],
    ])('isSafeRedirect(%s, %s) should return %s', (url, origins, expected) => {
      expect(isSafeRedirect(url, origins)).toBe(expected);
    });
  });

  describe('sanitizeFilename', () => {
    it('should remove path traversal patterns (../)', () => {
      expect(sanitizeFilename('../../../etc/passwd')).toBe('etc/passwd');
    });

    it('should remove path traversal patterns (..\\)', () => {
      // 実装は ../ と ..\\ のみを除去、単体の \\ は保持される
      expect(sanitizeFilename('..\\..\\windows\\system32')).toBe('windows\\system32');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeFilename('file<name>.txt')).toBe('filename.txt');
    });

    it('should remove colon character', () => {
      expect(sanitizeFilename('file:name.txt')).toBe('filename.txt');
    });

    it('should remove double quotes', () => {
      expect(sanitizeFilename('file"name".txt')).toBe('filename.txt');
    });

    it('should remove pipe character', () => {
      expect(sanitizeFilename('file|name.txt')).toBe('filename.txt');
    });

    it('should remove question mark', () => {
      expect(sanitizeFilename('file?name.txt')).toBe('filename.txt');
    });

    it('should remove asterisk', () => {
      expect(sanitizeFilename('file*name.txt')).toBe('filename.txt');
    });

    it('should remove control characters', () => {
      expect(sanitizeFilename('file\x00name.txt')).toBe('filename.txt');
    });

    it('should trim leading dots', () => {
      expect(sanitizeFilename('.hidden')).toBe('hidden');
    });

    it('should trim trailing dots', () => {
      expect(sanitizeFilename('file.txt.')).toBe('file.txt');
    });

    it('should trim leading spaces', () => {
      expect(sanitizeFilename('  file.txt')).toBe('file.txt');
    });

    it('should trim trailing spaces', () => {
      expect(sanitizeFilename('file.txt  ')).toBe('file.txt');
    });

    it('should handle safe filenames', () => {
      expect(sanitizeFilename('document.pdf')).toBe('document.pdf');
    });

    it('should handle filenames with underscores and hyphens', () => {
      expect(sanitizeFilename('my-file_name.txt')).toBe('my-file_name.txt');
    });

    it('should handle empty string', () => {
      expect(sanitizeFilename('')).toBe('');
    });

    it.each([
      ['../secret.txt', 'secret.txt'],
      ['..\\secret.txt', 'secret.txt'],
      ['<script>.js', 'script.js'],
      ['file:name.txt', 'filename.txt'],
      ['.hidden', 'hidden'],
      ['  spaces  ', 'spaces'],
      ['normal.txt', 'normal.txt'],
      ['path/to/file.txt', 'path/to/file.txt'],
    ])('sanitizeFilename(%s) should return %s', (input, expected) => {
      expect(sanitizeFilename(input)).toBe(expected);
    });
  });
});
