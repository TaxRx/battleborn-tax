// Cloudflare Worker for Galileo Tax Tax App
// Handles SPA routing, static assets, and API proxying

export interface Env {
  ASSETS: any;
  ENVIRONMENT: string;
  NODE_ENV: string;
  ANALYTICS?: any;
  // Add any other environment variables here
}

// Security headers for enhanced protection
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// CSP for production security
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join('; ');

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;

    try {
      // Handle API routes (proxy to Supabase or other APIs)
      if (pathname.startsWith('/api/')) {
        return await handleApiRoute(request, env);
      }

      // Handle static assets
      if (isStaticAsset(pathname)) {
        const response = await env.ASSETS.fetch(request);
        if (response.status === 200) {
          return addSecurityHeaders(response, false);
        }
      }

      // Handle SPA routing - serve index.html for app routes
      if (isSpaRoute(pathname)) {
        const indexRequest = new Request(new URL('/', request.url), request);
        const response = await env.ASSETS.fetch(indexRequest);
        
        if (response.status === 200) {
          return addSecurityHeaders(response, true);
        }
      }

      // Fallback to assets
      const response = await env.ASSETS.fetch(request);
      return addSecurityHeaders(response, pathname === '/' || pathname === '/index.html');

    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: SECURITY_HEADERS
      });
    }
  }
};

// Check if path is a static asset
function isStaticAsset(pathname: string): boolean {
  const staticExtensions = [
    '.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', 
    '.woff', '.woff2', '.ttf', '.eot', '.json', '.xml', '.txt', '.map'
  ];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

// Check if path should be handled by SPA router
function isSpaRoute(pathname: string): boolean {
  const spaRoutes = [
    '/admin', '/operator', '/affiliate', '/expert', '/client', '/partner',
    '/login', '/register', '/verify-email', '/forgot-password', '/reset-password',
    '/dashboard', '/tools', '/proposals', '/clients', '/experts', '/affiliates'
  ];
  
  return spaRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  ) || pathname === '/';
}

// Add security headers to response
function addSecurityHeaders(response: Response, isHtml: boolean): Response {
  const headers = new Headers(response.headers);
  
  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  // Add CSP only for HTML responses
  if (isHtml) {
    headers.set('Content-Security-Policy', CSP_HEADER);
  }

  // Cache control
  if (isHtml) {
    headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  } else {
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

// Handle API routes (future expansion)
async function handleApiRoute(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  
  // Log API calls for analytics
  if (env.ANALYTICS) {
    env.ANALYTICS.writeDataPoint({
      blobs: [url.pathname],
      doubles: [Date.now()],
      indexes: [request.method]
    });
  }

  // For now, return 404 for API routes
  // In the future, this could proxy to Supabase Edge Functions
  return new Response('API endpoint not found', { 
    status: 404,
    headers: SECURITY_HEADERS
  });
}