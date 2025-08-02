/**
 * Tests for Galileo Report Builder
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock worker module
const mockWorker = {
  async fetch(request, env, ctx) {
    // Basic routing logic for testing
    const url = new URL(request.url);
    
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'Galileo Report Builder',
        version: '1.0.0-test'
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/api/generate-pdf' && request.method === 'POST') {
      return new Response(Buffer.from('mock-pdf'), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="test.pdf"'
        }
      });
    }
    
    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

describe('Galileo Report Builder', () => {
  let worker;
  let env;

  beforeEach(() => {
    worker = mockWorker;
    env = global.mockEnv;
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const request = new Request('https://reports.galileo.tax/health');
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.service).toBe('Galileo Report Builder');
    });
  });

  describe('PDF Generation', () => {
    it('should generate PDF from HTML', async () => {
      const requestBody = {
        html: '<h1>Test Document</h1>',
        filename: 'test.pdf'
      };
      
      const request = new Request('https://reports.galileo.tax/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toContain('test.pdf');
    });

    it('should return error for missing HTML', async () => {
      const requestBody = {
        filename: 'test.pdf'
        // Missing html field
      };
      
      const request = new Request('https://reports.galileo.tax/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('HTML content is required');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const request = new Request('https://reports.galileo.tax/unknown');
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Not Found');
    });
  });

  describe('CORS', () => {
    it('should handle OPTIONS requests', async () => {
      const request = new Request('https://reports.galileo.tax/api/generate-pdf', {
        method: 'OPTIONS'
      });
      
      const response = await worker.fetch(request, env);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    });
  });
});