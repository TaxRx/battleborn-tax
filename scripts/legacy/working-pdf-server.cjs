const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = 3001;

// Middleware with minimal configuration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'ok', 
    service: 'Working PDF Server with Puppeteer', 
    timestamp: new Date().toISOString() 
  });
});

// PDF generation endpoint
app.post('/api/generate-pdf', async (req, res) => {
  let browser = null;
  
  try {
    console.log('🚀 [PDF SERVER] PDF generation request received');
    
    const { html, filename = 'document.pdf', options = {} } = req.body;

    if (!html) {
      console.error('❌ [PDF SERVER] No HTML content provided');
      return res.status(400).json({ error: 'HTML content is required' });
    }

    console.log(`📄 [PDF SERVER] Generating PDF: ${filename}`);
    console.log(`📊 [PDF SERVER] HTML content size: ${html.length} characters`);
    console.log(`🔍 [PDF SERVER] HTML preview: ${html.substring(0, 200)}...`);

    // Launch Puppeteer
    console.log('📱 [PDF SERVER] Launching Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();
    console.log('📄 [PDF SERVER] Created new page');

    // Set viewport and content
    await page.setViewport({ width: 1200, height: 1600 });
    await page.setContent(html, { 
      waitUntil: ['domcontentloaded', 'networkidle0'],
      timeout: 30000
    });

    console.log('📝 [PDF SERVER] Content set, waiting for fonts and render...');
    
    // Wait for Google Fonts to load
    await page.evaluateHandle(() => document.fonts.ready);
    console.log('✅ [PDF SERVER] Fonts loaded');
    
    // Additional wait for any dynamic content and styling
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.75in',
        right: '0.5in',
        bottom: '0.75in',
        left: '0.5in'
      },
      printBackground: true,
      preferCSSPageSize: false
    });

    await browser.close();
    browser = null;

    console.log(`✅ [PDF SERVER] PDF generated successfully - ${pdfBuffer.length} bytes`);

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ [PDF SERVER] Error:', error.message);
    console.error('❌ [PDF SERVER] Stack:', error.stack);
    
    if (browser) {
      try {
        await browser.close();
      } catch (e) {
        console.error('❌ [PDF SERVER] Browser cleanup error:', e.message);
      }
    }

    res.status(500).json({ 
      error: 'PDF generation failed',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Working PDF Server started!');
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📄 PDF endpoint: http://localhost:${PORT}/api/generate-pdf`);
  console.log('');
});