/**
 * Test setup for Vitest
 * Configures global environment for Cloudflare Workers testing
 */

// Mock Cloudflare Workers globals
global.fetch = global.fetch || (() => Promise.resolve(new Response()));
global.Request = global.Request || class Request {};
global.Response = global.Response || class Response {};
global.Headers = global.Headers || class Headers {};

// Mock environment variables
process.env.ENVIRONMENT = 'test';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
process.env.VERSION = '1.0.0-test';

// Mock Cloudflare bindings
global.mockEnv = {
  BROWSER: {
    launch: () => Promise.resolve({
      newPage: () => Promise.resolve({
        setViewport: () => Promise.resolve(),
        setContent: () => Promise.resolve(),
        evaluateHandle: () => Promise.resolve(),
        pdf: () => Promise.resolve(Buffer.from('mock-pdf-content')),
        close: () => Promise.resolve()
      }),
      close: () => Promise.resolve()
    })
  }
};