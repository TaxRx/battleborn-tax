# Galileo Report Builder

A scalable PDF generation service built on Cloudflare Workers with Browser Rendering capabilities. This service replaces the local `pdf-server.cjs` with a cloud-native solution hosted at `reports.galileo.tax`.

## 🚀 Features

- **Cloudflare Browser Rendering**: Uses Cloudflare's hosted Puppeteer environment
- **Scalable**: Automatically scales with demand, no server management
- **Fast**: Edge-deployed for minimal latency
- **Reliable**: Built-in redundancy and error handling
- **Cost-effective**: Pay-per-use pricing model
- **Secure**: No local dependencies or security vulnerabilities

## 📋 API Endpoints

### Health Check
```
GET /health
```
Returns service status and capabilities.

### Generate PDF
```
POST /api/generate-pdf
Content-Type: application/json

{
  "html": "<html>...</html>",
  "filename": "report.pdf",
  "options": {
    "format": "Letter",
    "margin": {
      "top": "0.25in",
      "right": "0.1in",
      "bottom": "0.4in", 
      "left": "0.1in"
    }
  }
}
```

### Service Info
```
GET /
```
Returns service information and available endpoints.

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Main App      │    │  Report Builder  │    │  Cloudflare     │
│  (console....)  │───▶│  (reports....)   │───▶│  Browser API    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📦 Technology Stack

- **Runtime**: Cloudflare Workers (V8 JavaScript Engine)
- **Router**: itty-router for lightweight routing
- **Browser**: Cloudflare Browser Rendering (Puppeteer-based)
- **Deployment**: Wrangler CLI
- **Monitoring**: Cloudflare Analytics Engine

## 🛠️ Development

### Prerequisites
- Node.js 18.17.0 or higher
- npm 9.6.7 or higher
- Cloudflare account with Workers plan
- Wrangler CLI installed globally

### Local Development

1. **Clone and setup**:
   ```bash
   cd reportbuilder
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server**:
   ```bash
   # Local development (limited browser rendering support)
   npm run dev
   
   # Remote development (full browser rendering support)
   npm run dev:remote
   ```
   Access at: http://localhost:8789

### Deployment

1. **Development environment**:
   ```bash
   npm run deploy:staging
   ```

2. **Production environment**:
   ```bash
   npm run deploy:production
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENVIRONMENT` | Environment name | `production` |
| `LOG_LEVEL` | Logging level | `info` |
| `SERVICE_NAME` | Service identifier | `galileo-reportbuilder` |
| `VERSION` | Service version | `1.0.0` |

### PDF Options

The service supports all standard Puppeteer PDF options:

- `format`: Page format (Letter, A4, A3, Legal, Tabloid)
- `width/height`: Custom dimensions
- `margin`: Page margins (top, right, bottom, left)
- `printBackground`: Include background graphics
- `landscape`: Orientation
- `displayHeaderFooter`: Show header/footer
- `headerTemplate/footerTemplate`: Custom header/footer HTML
- `scale`: Rendering scale (0.1 to 2.0)

## 📊 Monitoring

### Analytics
- Request volume and latency
- Error rates and types
- Geographic distribution
- Browser rendering performance

### Logging
- Structured JSON logs
- Configurable log levels
- Request/response tracing
- Error stack traces

## 🔒 Security

- **CORS**: Configurable cross-origin policies
- **Rate Limiting**: Prevent abuse (optional)
- **Input Validation**: HTML content sanitization
- **Error Handling**: Safe error responses without data leakage

## 🚀 Performance

- **Cold Start**: ~50-100ms (Worker startup)
- **Browser Launch**: ~500-1000ms (Browser initialization)
- **PDF Generation**: 1-5s (depending on content complexity)
- **Total Latency**: Typically 2-6s end-to-end

### Optimization Tips

1. **Minimize HTML size**: Reduce content and inline assets
2. **Optimize fonts**: Use web fonts sparingly
3. **Reduce images**: Compress or use external CDN links
4. **Cache resources**: Enable browser caching for assets

## 🧪 Testing

### Local Testing
```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Lint code
npm run lint
```

### Manual Testing
```bash
# Health check
curl https://reports.galileo.tax/health

# Generate PDF
curl -X POST https://reports.galileo.tax/api/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{"html":"<h1>Test</h1>","filename":"test.pdf"}' \
  --output test.pdf
```

## 🐛 Troubleshooting

### Common Issues

1. **Browser launch timeout**: Increase timeout in options
2. **Font loading issues**: Ensure Google Fonts URLs are accessible
3. **Large HTML content**: Consider pagination or optimization
4. **CORS errors**: Check origin configuration

### Debug Mode
Set `LOG_LEVEL=debug` to enable verbose logging.

## 📚 Related Documentation

- [Cloudflare Browser Rendering](https://developers.cloudflare.com/browser-rendering/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Puppeteer PDF API](https://pptr.dev/api/puppeteer.page.pdf)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -m "Add new feature"`
6. Push to branch: `git push origin feature/new-feature`
7. Submit a pull request

## 📄 License

This project is proprietary and confidential. All rights reserved.

---

**Battle Born Capital Advisors** • Galileo Tax Platform