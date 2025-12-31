import '@testing-library/jest-dom'

// Polyfill Web APIs for Next.js server components in Jest environment
import { ReadableStream, TransformStream } from 'node:stream/web';
import { TextEncoder, TextDecoder } from 'node:util';

// Set up globals for Next.js
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Request and Response for Next.js API routes
if (typeof Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init) {
      this.url = typeof input === 'string' ? input : input.url;
      this.method = init?.method || 'GET';
      this.headers = new Map(Object.entries(init?.headers || {}));
      this.body = init?.body;
    }
  };
}

if (typeof Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this._body = body;
      this.status = init.status || 200;
      this.statusText = init.statusText || '';
      this.headers = new Map(Object.entries(init.headers || {}));
      this.ok = this.status >= 200 && this.status < 300;
    }

    static json(data, init = {}) {
      const body = JSON.stringify(data);
      return new Response(body, {
        status: init.status || 200,
        statusText: init.statusText || '',
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
    }

    async json() {
      if (!this._body) {
        throw new SyntaxError('Unexpected end of JSON input');
      }
      return JSON.parse(this._body);
    }

    async text() {
      return this._body || '';
    }
  };
}

if (typeof Headers === 'undefined') {
  global.Headers = Map;
}

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data, init = {}) => {
      const body = JSON.stringify(data);
      const response = new Response(body, {
        status: init.status || 200,
        statusText: init.statusText || '',
        headers: {
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
      return response;
    },
  },
}));

// Note: MSWはAPIテストが必要な場合のみ、個別のテストファイルでsetupします
