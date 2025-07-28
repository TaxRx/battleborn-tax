// Vite plugin to generate Cloudflare Worker script
import { Plugin } from 'vite';
import { writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export function cloudflareWorkerPlugin(): Plugin {
  return {
    name: 'cloudflare-worker',
    generateBundle(options, bundle) {
      // Generate the worker script in the output directory
      const workerScript = `
// Auto-generated Cloudflare Worker for Battle Born Tax App
// This file is generated during build - do not edit directly

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;

    // Security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY', 
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;"
    };

    // Handle static assets
    if (pathname.match(/\\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|xml|txt|map)$/)) {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 200) {
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        Object.entries(securityHeaders).forEach(([key, value]) => {
          if (key !== 'Content-Security-Policy') headers.set(key, value);
        });
        return new Response(response.body, { status: response.status, headers });
      }
    }

    // SPA routing - serve index.html for app routes
    const spaRoutes = ['/admin', '/operator', '/affiliate', '/expert', '/client', '/partner', '/login', '/register', '/dashboard'];
    const isSpaRoute = spaRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) || pathname === '/';
    
    if (isSpaRoute) {
      const indexRequest = new Request(new URL('/', request.url), request);
      const response = await env.ASSETS.fetch(indexRequest);
      
      if (response.status === 200) {
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
        Object.entries(securityHeaders).forEach(([key, value]) => headers.set(key, value));
        return new Response(response.body, { status: response.status, headers });
      }
    }

    // Fallback
    const response = await env.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    Object.entries(securityHeaders).forEach(([key, value]) => {
      if (!(pathname === '/' || pathname === '/index.html') && key === 'Content-Security-Policy') return;
      headers.set(key, value);
    });
    return new Response(response.body, { status: response.status, headers });
  }
};
`;

      // Write the worker script to the output directory
      this.emitFile({
        type: 'asset',
        fileName: '_worker.js',
        source: workerScript
      });

      // Create .assetsignore file to prevent _worker.js from being uploaded as a static asset
      this.emitFile({
        type: 'asset',
        fileName: '.assetsignore',
        source: '_worker.js\n'
      });
    }
  };
}

export default cloudflareWorkerPlugin;