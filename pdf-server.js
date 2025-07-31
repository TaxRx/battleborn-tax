#!/usr/bin/env node

/**
 * Simple Express server for Puppeteer PDF generation
 * Run this alongside your Vite development server
 * 
 * Usage: node pdf-server.js
 * 
 * This will start a server on port 3001 that handles PDF generation
 */

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PDF_SERVER_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PDF Generation Server', timestamp: new Date().toISOString() });
});

// PDF generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
  let browser = null;
  
  try {
    console.log('🚀 [PDF SERVER] Starting Puppeteer PDF generation...');
    
    const { html, filename, options = {} } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log(`📄 [PDF SERVER] Generating PDF: ${filename || 'document.pdf'}`);
    console.log(`📊 [PDF SERVER] HTML size: ${html.length} characters`);

    // Launch Puppeteer browser
    console.log('📱 [PDF SERVER] Launching Puppeteer browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ]
    });

    const page = await browser.newPage();
    console.log('📄 [PDF SERVER] Created new page');

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1200, height: 1600 });

    // Set content and wait for it to load
    console.log('📝 [PDF SERVER] Setting HTML content...');
    await page.setContent(html, { 
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 30000
    });

    // Wait for fonts and any dynamic content to render
    await page.waitForTimeout(3000);

    // Ensure all images are loaded
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(images.map(img => {
        if (img.complete) return;
        return new Promise((resolve, reject) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', reject);
        });
      }));
    });

    // Configure PDF options
    const pdfOptions = {
      format: options.format || 'Letter',
      margin: {
        top: options.margin?.top || '0.75in',
        right: options.margin?.right || '0.5in',
        bottom: options.margin?.bottom || '0.75in',
        left: options.margin?.left || '0.5in'
      },
      printBackground: options.printBackground !== false,
      preferCSSPageSize: options.preferCSSPageSize !== false,
      displayHeaderFooter: false,
      timeout: 60000 // 60 second timeout
    };

    console.log('🎨 [PDF SERVER] Generating PDF with options:', pdfOptions);

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);
    
    console.log('✅ [PDF SERVER] PDF generated successfully');
    console.log(`📊 [PDF SERVER] PDF size: ${pdfBuffer.length} bytes`);

    // Close browser
    await browser.close();
    browser = null;
    console.log('🔒 [PDF SERVER] Browser closed');

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'document.pdf'}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ [PDF SERVER] Error generating PDF:', error);
    
    // Ensure we close the browser even if there's an error
    if (browser) {
      try {
        await browser.close();
        console.log('🔒 [PDF SERVER] Browser closed after error');
      } catch (cleanupError) {
        console.error('❌ [PDF SERVER] Error during cleanup:', cleanupError);
      }
    }

    res.status(500).json({ 
      error: 'Failed to generate PDF',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ [PDF SERVER] Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 PDF Generation Server started!');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📄 PDF endpoint: http://localhost:${PORT}/api/generate-pdf`);
  console.log('');
  console.log('💡 To use with your Vite app:');
  console.log('   1. Keep this server running');
  console.log('   2. Start your Vite app: npm run dev');
  console.log('   3. PDF generation will work automatically');
  console.log('');
});