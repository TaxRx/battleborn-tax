#!/bin/bash

# Environment Setup Script for Development vs Production
# Run this script to set up your environment configuration

echo "🚀 Setting up Development vs Production Environment Configuration"
echo "=============================================================="

# Create .env.example for reference
cat > .env.example << 'EOF'
# Environment Configuration Template
# Copy this to .env and fill in your actual values

# Environment (development | production)
NODE_ENV=development
VITE_APP_ENV=development

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# API Configuration
VITE_API_BASE_URL=http://localhost:5174
VITE_API_TIMEOUT=30000

# Feature Flags
VITE_ENABLE_DEBUG_LOGS=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_TEST_FEATURES=true

# External Services
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
VITE_OPENAI_API_KEY=your_openai_key_here

# Security
VITE_ENABLE_STRICT_CSP=false

# Analytics
VITE_ENABLE_ANALYTICS=false
VITE_ANALYTICS_ID=""

# Client Portal
VITE_CLIENT_PORTAL_BASE_URL=http://localhost:5174/client
VITE_ENABLE_CLIENT_PREVIEW=true
EOF

# Create development environment template
cat > .env.development.template << 'EOF'
# Development Environment
NODE_ENV=development
VITE_APP_ENV=development

# Development Supabase (separate instance recommended)
VITE_SUPABASE_URL=your_dev_supabase_url
VITE_SUPABASE_ANON_KEY=your_dev_supabase_key

# Development API
VITE_API_BASE_URL=http://localhost:5174
VITE_API_TIMEOUT=30000

# Development Features
VITE_ENABLE_DEBUG_LOGS=true
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_TEST_FEATURES=true
VITE_ENABLE_STRICT_CSP=false
VITE_ENABLE_ANALYTICS=false

# Development Services
VITE_GOOGLE_MAPS_API_KEY=your_dev_google_maps_key
VITE_OPENAI_API_KEY=your_dev_openai_key

# Development Client Portal
VITE_CLIENT_PORTAL_BASE_URL=http://localhost:5174/client
VITE_ENABLE_CLIENT_PREVIEW=true
EOF

# Create production environment template
cat > .env.production.template << 'EOF'
# Production Environment
NODE_ENV=production
VITE_APP_ENV=production

# Production Supabase
VITE_SUPABASE_URL=your_prod_supabase_url
VITE_SUPABASE_ANON_KEY=your_prod_supabase_key

# Production API
VITE_API_BASE_URL=https://your-domain.com
VITE_API_TIMEOUT=30000

# Production Features
VITE_ENABLE_DEBUG_LOGS=false
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_TEST_FEATURES=false
VITE_ENABLE_STRICT_CSP=true
VITE_ENABLE_ANALYTICS=true

# Production Services
VITE_GOOGLE_MAPS_API_KEY=your_prod_google_maps_key
VITE_OPENAI_API_KEY=your_prod_openai_key

# Production Client Portal
VITE_CLIENT_PORTAL_BASE_URL=https://your-domain.com/client
VITE_ENABLE_CLIENT_PREVIEW=false

# Production Analytics
VITE_ANALYTICS_ID=your_analytics_id
EOF

echo "✅ Environment templates created!"
echo ""
echo "📋 Next Steps:"
echo "1. Copy .env.development.template to .env for local development"
echo "2. Fill in your actual API keys and URLs in .env"
echo "3. Set up Netlify environment variables for production"
echo "4. Use the development branch for new features"
echo "5. Use pull requests to merge to main for production deployments"
echo ""
echo "📁 Files created:"
echo "- .env.example (reference template)"
echo "- .env.development.template (development config)"
echo "- .env.production.template (production config)"
echo ""
echo "🔒 Remember: Never commit .env files to git!"

# Make this script executable
chmod +x setup-environments.sh 