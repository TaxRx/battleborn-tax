# 🚀 Development vs Production Workflow Guide

## Overview

This project now uses a proper development/production environment separation to ensure stable client-facing services while allowing safe feature development.

## 📋 Branch Structure

### `main` Branch (Production)
- **Purpose**: Live client-facing application
- **Deployment**: Automatic to production Netlify site
- **Protection**: Only merge via pull requests
- **Testing**: Full QA required before merge

### `development` Branch (Development)
- **Purpose**: Active feature development and testing
- **Deployment**: Optional staging environment
- **Freedom**: Direct commits allowed for rapid development
- **Testing**: Continuous integration testing

## 🛠️ Environment Setup

### 1. Initial Setup

```bash
# Run the environment setup script
npm run setup:env

# Or manually run:
bash setup-environments.sh
```

### 2. Local Development Environment

```bash
# Copy development template to .env
cp .env.development.template .env

# Fill in your actual values:
# - Supabase URLs and keys
# - Google Maps API key
# - OpenAI API key
# - etc.
```

### 3. Netlify Environment Variables

#### Production Site (main branch)
Set these in Netlify dashboard for your production site:

```env
NODE_ENV=production
VITE_APP_ENV=production
VITE_SUPABASE_URL=your_prod_supabase_url
VITE_SUPABASE_ANON_KEY=your_prod_supabase_key
VITE_GOOGLE_MAPS_API_KEY=your_prod_google_maps_key
VITE_OPENAI_API_KEY=your_prod_openai_key
VITE_ENABLE_DEBUG_LOGS=false
VITE_ENABLE_ANALYTICS=true
VITE_ANALYTICS_ID=your_analytics_id
```

#### Development Site (development branch) - Optional
If you want a staging environment:

```env
NODE_ENV=development
VITE_APP_ENV=development
VITE_SUPABASE_URL=your_dev_supabase_url
VITE_SUPABASE_ANON_KEY=your_dev_supabase_key
VITE_ENABLE_DEBUG_LOGS=true
VITE_ENABLE_TEST_FEATURES=true
VITE_ENABLE_ANALYTICS=false
```

## 🔄 Development Workflow

### 1. Starting New Feature Development

```bash
# Switch to development branch
git checkout development

# Pull latest changes
git pull origin development

# Create feature branch (optional but recommended)
git checkout -b feature/your-feature-name

# Start development server
npm run dev
```

### 2. Development Scripts

```bash
# Regular development
npm run dev

# Development with extra debug logging
npm run dev:debug

# Type checking
npm run type-check

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint and fix issues
npm run lint:fix
```

### 3. Testing Builds

```bash
# Test development build
npm run build:dev
npm run preview

# Test production build
npm run build:prod
npm run preview:prod
```

### 4. Database Changes

```bash
# Test database migration
npm run db:test

# Run database migration
npm run db:migrate
```

## 🚀 Deployment Process

### Development Deployment (Optional Staging)

```bash
# Commit changes to development branch
git add .
git commit -m "feat: your feature description"
git push origin development
```

### Production Deployment

```bash
# 1. Ensure development branch is ready
git checkout development
npm run build:prod  # Test production build
npm run test        # Run all tests

# 2. Create pull request
# Go to GitHub and create PR from development to main

# 3. Review and merge
# Code review → Merge PR → Automatic production deployment
```

## 🔧 Environment-Specific Features

### Development Features
- ✅ Debug logging enabled
- ✅ Test features enabled
- ✅ Relaxed security policies
- ✅ Hot module replacement
- ✅ Source maps
- ❌ Analytics disabled
- ❌ Performance monitoring disabled

### Production Features
- ❌ Debug logging disabled
- ❌ Test features disabled
- ✅ Strict security policies
- ✅ Analytics enabled
- ✅ Performance monitoring
- ✅ Optimized builds
- ✅ Error reporting

## 📊 Monitoring and Debugging

### Development Debugging

```bash
# Enable verbose logging
VITE_ENABLE_DEBUG_LOGS=true npm run dev

# Check specific component logs
console.log('[DEBUG] Component state:', state)
```

### Production Monitoring

- Monitor Netlify deployment logs
- Check browser console for client errors
- Review Supabase database performance
- Monitor user analytics and feedback

## 🔒 Security Considerations

### Environment Variables
- ✅ Never commit `.env` files
- ✅ Use separate Supabase instances for dev/prod
- ✅ Rotate API keys regularly
- ✅ Use different Google Maps quotas for dev/prod

### Database Security
- ✅ Separate development and production databases
- ✅ Test Row Level Security (RLS) policies in development
- ✅ Backup production data regularly
- ✅ Monitor for unusual database activity

## 🚨 Emergency Procedures

### Production Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue

# 2. Make minimal fix
# Edit files...

# 3. Test thoroughly
npm run build:prod
npm run test

# 4. Deploy immediately
git add .
git commit -m "hotfix: critical issue description"
git push origin hotfix/critical-issue

# 5. Create emergency PR to main
# Merge immediately after review

# 6. Merge back to development
git checkout development
git merge main
git push origin development
```

### Rollback Production

1. Go to Netlify dashboard
2. Find previous working deployment
3. Click "Publish deploy"
4. Investigate issue in development environment

## 📝 Best Practices

### Code Quality
- ✅ Use TypeScript strict mode
- ✅ Write tests for critical features
- ✅ Use ESLint and fix warnings
- ✅ Review code before merging to main

### Database Changes
- ✅ Test migrations in development first
- ✅ Backup before running production migrations
- ✅ Use reversible migrations when possible
- ✅ Document schema changes

### Performance
- ✅ Test with production data volumes
- ✅ Monitor bundle sizes
- ✅ Optimize images and assets
- ✅ Use React profiler for performance issues

## 🆘 Common Issues

### Environment Variables Not Loading
```bash
# Check if .env file exists
ls -la .env

# Verify environment variables in code
console.log('ENV:', import.meta.env)

# Restart development server
npm run dev
```

### Build Failures
```bash
# Clear cache and rebuild
npm run clean
npm install
npm run build:prod
```

### Database Connection Issues
```bash
# Test database connection
npm run db:test

# Check Supabase status
# Verify environment variables
```

---

## 📞 Support

For questions about this workflow:
1. Check this documentation first
2. Review recent commit messages
3. Check GitHub issues
4. Ask team members

**Remember**: Always test in development before deploying to production! 🚀 