/**
 * Galileo Report Builder - Cloudflare Worker
 * PDF generation service using Cloudflare Browser Rendering
 * 
 * This service replaces the local pdf-server.cjs with a scalable
 * Cloudflare Worker solution hosted at reports.galileo.tax
 */

import { Router } from 'itty-router';
import puppeteer from '@cloudflare/puppeteer';

// Initialize router
const router = Router();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Utility function to add CORS headers to responses
function corsResponse(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// Utility function for logging with environment context
function log(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logLevel = globalThis.LOG_LEVEL || 'info';
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  
  if (levels[level] >= levels[logLevel]) {
    console[level](`[${timestamp}] [${level.toUpperCase()}] [ReportBuilder] ${message}`, data);
  }
}

// Health check endpoint
router.get('/health', (request, env) => {
  log('info', 'Health check requested');
  
  const response = new Response(JSON.stringify({
    status: 'ok',
    service: 'Galileo Report Builder',
    version: globalThis.VERSION || '1.0.0',
    environment: globalThis.ENVIRONMENT || 'unknown',
    timestamp: new Date().toISOString(),
    capabilities: {
      browserRendering: !!env?.BROWSER,
      pdfGeneration: !!env?.BROWSER,
      cloudflareWorker: true
    },
    bindings: {
      browser: !!env?.BROWSER,
      browserType: typeof env?.BROWSER
    }
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return corsResponse(response);
});

// PDF generation endpoint
router.post('/api/generate-pdf', async (request, env) => {
  try {
    log('info', 'PDF generation request received');
    
    // Parse request body
    const { html, filename = 'document.pdf', options = {} } = await request.json();
    
    if (!html) {
      log('error', 'No HTML content provided');
      return corsResponse(new Response(JSON.stringify({ 
        error: 'HTML content is required' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    log('info', `Generating PDF: ${filename}`, {
      htmlSize: html.length,
      filename,
      hasOptions: Object.keys(options).length > 0
    });
    
    // Default PDF options matching the original pdf-server.cjs
    const pdfOptions = {
      format: 'Letter',
      margin: {
        top: '0.25in',
        right: '0.1in', 
        bottom: '0.4in',
        left: '0.1in'
      },
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="font-size:11px; text-align:center; width:100%; color:#6b7280; font-family: Plus Jakarta Sans, sans-serif; padding: 0 0.2in;">Page <span class="pageNumber"></span> of <span class="totalPages"></span> • Confidential & Proprietary</div>',
      ...options // Allow custom options to override defaults
    };
    
    // Check if browser binding is available
    if (!env.BROWSER) {
      log('error', 'Browser binding not available');
      return corsResponse(new Response(JSON.stringify({
        error: 'Browser rendering not available',
        message: 'This endpoint requires browser rendering capabilities. Try using --remote flag for testing.',
        details: 'Browser binding (env.BROWSER) is not configured or available in this environment.'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    // Use Cloudflare Browser Rendering to generate PDF
    log('debug', 'Launching browser session');
    
    const browser = await puppeteer.launch(env.BROWSER,{
      headless: 'new',
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    protocolTimeout: 0,
    });
    const page = await browser.newPage();
    
    try {
      // Set viewport and load content
      await page.setViewport({ width: 1200, height: 1600 });
      log('debug', 'Setting page content');
      
      await page.setContent(html, {
        waitUntil: ['domcontentloaded', 'networkidle0'],
        timeout: 300000
      });
      
      log('debug', 'Waiting for fonts and render completion');
      
      // Wait for Google Fonts to load
      await page.evaluateHandle(() => document.fonts.ready);
      
      // Additional wait for dynamic content and styling (matching original behavior)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      log('debug', 'Generating PDF with options', pdfOptions);
      
      // Generate PDF
      const pdfBuffer = await page.pdf({...pdfOptions, timeout: 0});
      
      log('info', `PDF generated successfully`, {
        filename,
        sizeBytes: pdfBuffer.length,
        sizeKB: Math.round(pdfBuffer.length / 1024)
      });
      
      // Return PDF response
      const response = new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
      
      return corsResponse(response);
      
    } finally {
      // Always close the page
      await page.close();
      await browser.close();
      log('debug', 'Browser session closed');
    }
    
  } catch (error) {
    log('error', 'PDF generation failed', {
      error: error.message,
      stack: error.stack
    });
    
    const response = new Response(JSON.stringify({
      error: 'PDF generation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return corsResponse(response);
  }
});

// Root endpoint with service information
router.get('/', () => {
  const response = new Response(JSON.stringify({
    service: 'Galileo Report Builder',
    version: globalThis.VERSION || '1.0.0',
    description: 'PDF generation service using Cloudflare Browser Rendering',
    endpoints: {
      health: '/health',
      generatePdf: 'POST /api/generate-pdf'
    },
    documentation: 'https://docs.galileo.tax/reportbuilder',
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  return corsResponse(response);
});

// Handle OPTIONS requests for CORS
router.options('*', () => {
  return corsResponse(new Response(null, { status: 200 }));
});

// 404 handler
router.all('*', () => {
  const response = new Response(JSON.stringify({
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    availableEndpoints: {
      health: 'GET /health',
      generatePdf: 'POST /api/generate-pdf',
      root: 'GET /'
    }
  }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
  
  return corsResponse(response);
});

// Main fetch handler
export default {
  async fetch(request, env, ctx) {
    try {
      // Set global environment variables for logging
      globalThis.ENVIRONMENT = env.ENVIRONMENT || 'unknown';
      globalThis.VERSION = env.VERSION || '1.0.0';
      globalThis.LOG_LEVEL = env.LOG_LEVEL || 'info';
      
      log('debug', 'Request received', {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('User-Agent')
      });
      
      // Route the request
      return await router.handle(request, env, ctx);
      
    } catch (error) {
      log('error', 'Unhandled error in main fetch handler', {
        error: error.message,
        stack: error.stack
      });
      
      const response = new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString()
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
      
      return corsResponse(response);
    }
  }
};