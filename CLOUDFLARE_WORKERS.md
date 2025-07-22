# Cloudflare Workers Deployment

This document outlines the Cloudflare Workers deployment configuration for the Battle Born Tax App.

## Configuration Files

- **`wrangler.jsonc`** - Main Cloudflare Workers configuration with JSONC format
- **`vite-worker-plugin.ts`** - Custom Vite plugin to generate Worker script during build
- **`.env.workers.example`** - Example environment variables for Workers

## Build Process

The build process is configured in `package.json`:

```bash
# Build for Cloudflare Workers
npm run build:workers

# Local development with Wrangler
npm run dev:workers
```

## Project Structure

```
dist/
├── _worker.js          # Generated Cloudflare Worker script
├── index.html          # SPA entry point
├── assets/             # Static assets (JS, CSS, images)
└── ...
```

## Worker Features

- **SPA Routing**: Serves `index.html` for all app routes
- **Static Assets**: Efficient caching for JS, CSS, and images
- **Security Headers**: CSP, CSRF protection, XSS prevention
- **Asset Management**: Automatic handling of static resources

## Environment Configuration

### Development
```json
{
  "name": "battleborn-taxapp-dev",
  "vars": {
    "ENVIRONMENT": "development",
    "NODE_ENV": "development"
  }
}
```

### Staging
```json
{
  "name": "battleborn-taxapp-staging",
  "vars": {
    "ENVIRONMENT": "staging",
    "NODE_ENV": "production"
  }
}
```

### Production
```json
{
  "name": "battleborn-taxapp-prod",
  "vars": {
    "ENVIRONMENT": "production",
    "NODE_ENV": "production"
  },
  "routes": [
    {
      "pattern": "app.battleborncapital.com/*",
      "zone_name": "battleborncapital.com"
    }
  ]
}
```

## Security Features

- **Content Security Policy (CSP)**
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **HTTPS Only**: All connections enforced over HTTPS
- **Asset Integrity**: Long-term caching for static assets

## SPA Route Handling

The Worker automatically handles these SPA routes:
- `/admin/*` - Admin dashboard
- `/operator/*` - Operator dashboard  
- `/affiliate/*` - Affiliate dashboard
- `/expert/*` - Expert dashboard
- `/client/*` - Client dashboard
- `/login`, `/register` - Authentication pages

## GitHub Deployment

Deployment is handled automatically via GitHub Actions when code is committed. The build process:

1. **Build**: `npm run build:workers` generates the dist folder
2. **Deploy**: Cloudflare automatically deploys from GitHub
3. **Routing**: Custom domains and routes are configured in `wrangler.jsonc`

## Local Development

```bash
# Start local development server with Wrangler
npm run dev:workers

# This will start the worker at http://localhost:8787
# with hot reloading and full Worker functionality
```

## Environment Variables

Copy `.env.workers.example` to `.env.workers` and configure:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous key  
- `ENVIRONMENT` - Current environment (dev/staging/production)
- Custom domain settings for production

## Performance Optimization

- **Asset Caching**: Static assets cached for 1 year
- **HTML Caching**: SPA HTML cached with revalidation
- **Chunk Splitting**: Vendor, UI, and utility code split for optimal loading
- **Compression**: All assets served with compression

## Monitoring

- **Analytics**: Built-in Cloudflare Analytics
- **Performance**: Core Web Vitals tracking
- **Error Tracking**: Worker error logging and monitoring