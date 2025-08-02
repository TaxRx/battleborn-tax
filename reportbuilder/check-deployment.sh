#!/bin/bash

# Deployment verification script for Galileo Report Builder
# Usage: ./check-deployment.sh [environment]

ENVIRONMENT=${1:-production}

echo "🔍 Checking Galileo Report Builder deployment..."
echo "Environment: $ENVIRONMENT"
echo ""

# Deploy and check bindings
echo "📦 Deploying to $ENVIRONMENT..."
if [ "$ENVIRONMENT" = "production" ]; then
  wrangler deploy --env production
elif [ "$ENVIRONMENT" = "staging" ]; then
  wrangler deploy --env staging
else
  wrangler deploy --env development
fi

echo ""
echo "🔗 Checking bindings..."
wrangler dev --config wrangler.jsonc --env $ENVIRONMENT --dry-run 2>&1 | grep -E "(Browser|binding|BROWSER)"

echo ""
echo "📋 Important Browser Rendering Requirements:"
echo "1. ✅ Cloudflare Workers Paid plan or higher"
echo "2. ✅ Browser Rendering add-on enabled in dashboard"
echo "3. ✅ Account ID matches: 10bae1566e72e0e3ed64adcb4adfc9a4"
echo "4. ✅ nodejs_compat_v2 compatibility flag enabled"
echo ""

echo "🔧 If Browser Rendering is not available:"
echo "- Check your Cloudflare plan (Workers Paid required)"
echo "- Enable Browser Rendering in your Cloudflare dashboard"
echo "- Verify account permissions for Browser Rendering"
echo ""

echo "📊 Test the deployed service:"
echo "curl -X POST https://galileo-reportbuilder-$ENVIRONMENT.your-subdomain.workers.dev/api/generate-pdf \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"html\":\"<h1>Test</h1>\",\"filename\":\"test.pdf\"}' \\"
echo "  --output test.pdf"
echo ""