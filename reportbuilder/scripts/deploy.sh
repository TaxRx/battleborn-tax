#!/bin/bash

# Galileo Report Builder Deployment Script
# Usage: ./scripts/deploy.sh [environment]
# Environment: development, staging, production (default: staging)

set -e  # Exit on any error

ENVIRONMENT=${1:-staging}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Deploying Galileo Report Builder to $ENVIRONMENT..."

# Validate environment
case $ENVIRONMENT in
  development|staging|production)
    echo "✅ Environment: $ENVIRONMENT"
    ;;
  *)
    echo "❌ Invalid environment: $ENVIRONMENT"
    echo "Valid options: development, staging, production"
    exit 1
    ;;
esac

# Change to project directory
cd "$PROJECT_DIR"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "❌ Wrangler CLI is not installed"
  echo "Install with: npm install -g wrangler"
  exit 1
fi

# Check if user is logged in to Cloudflare
if ! wrangler whoami &> /dev/null; then
  echo "❌ Not logged in to Cloudflare"
  echo "Login with: wrangler login"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Run linting
echo "🔍 Running linter..."
npm run lint

# Build check
echo "🏗️  Running build check..."
npm run build

# Deploy to specified environment
echo "🚀 Deploying to $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "production" ]; then
  wrangler deploy --env production
elif [ "$ENVIRONMENT" = "staging" ]; then
  wrangler deploy --env staging
else
  wrangler deploy --env development
fi

echo "✅ Deployment completed successfully!"

# Show deployment info
echo ""
echo "📊 Deployment Information:"
echo "Environment: $ENVIRONMENT"
echo "Service: galileo-reportbuilder-$ENVIRONMENT"
echo "URL: https://galileo-reportbuilder-$ENVIRONMENT.your-subdomain.workers.dev"

if [ "$ENVIRONMENT" = "production" ]; then
  echo "Custom Domain: https://reports.galileo.tax"
fi

echo ""
echo "🔗 Useful commands:"
echo "  View logs: wrangler tail --env $ENVIRONMENT"
echo "  Check status: curl https://reports.galileo.tax/health"
echo ""