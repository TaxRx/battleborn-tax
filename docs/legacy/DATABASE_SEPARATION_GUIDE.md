# 🛡️ Database Separation Setup Guide

## Current Issue
Your development and production environments currently use the **same Supabase database**. This means any clients or data added during development immediately affects your live production environment.

## Recommended Solution: Separate Supabase Projects

### Step 1: Create Development Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Fill in details:**
   - Organization: (Your existing organization)
   - Name: `your-app-development` (or similar)
   - Database Password: (Generate strong password)
   - Region: (Same as production for consistency)
4. **Click "Create new project"**
5. **Wait for setup to complete** (2-3 minutes)

### Step 2: Copy Database Schema

#### Option A: Export/Import (Recommended)
```sql
-- 1. In PRODUCTION Supabase SQL Editor, run:
-- This exports your schema structure
\copy (SELECT * FROM information_schema.tables WHERE table_schema = 'public') TO '/tmp/tables.csv' WITH CSV HEADER;

-- 2. Get your schema structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
```

#### Option B: Manual Recreation
1. **Copy all migration files** from `supabase/migrations/` 
2. **Run them in development Supabase** SQL editor
3. **Verify all tables and relationships** are created

### Step 3: Update Environment Configuration

#### Update .env for Development
```bash
# Development Database (your local .env file)
VITE_SUPABASE_URL=https://your-dev-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_dev_anon_key
```

#### Set Production Environment Variables in Netlify
1. **Go to Netlify Dashboard**
2. **Site Settings → Environment Variables**
3. **Keep production values:**
```env
VITE_SUPABASE_URL=https://kiogxpdjhopdlxhttprg.supabase.co
VITE_SUPABASE_ANON_KEY=your_prod_anon_key
```

### Step 4: Create Sample Development Data

```sql
-- In DEVELOPMENT Supabase, create test clients
INSERT INTO rd_businesses (id, business_name, business_type) VALUES
('dev-client-1', 'Test Dental Practice', 'dental'),
('dev-client-2', 'Sample Medical Group', 'medical'),
('dev-client-3', 'Demo Veterinary Clinic', 'veterinary');

-- Add sample business years
INSERT INTO rd_business_years (business_id, year, total_revenue) VALUES
('dev-client-1', 2024, 500000),
('dev-client-2', 2024, 750000),
('dev-client-3', 2024, 300000);
```

### Step 5: Configure Row Level Security (RLS)

Make sure both databases have the same RLS policies:

```sql
-- Copy RLS policies from production to development
-- Check existing policies:
SELECT * FROM pg_policies;

-- Example: Recreate business access policy
CREATE POLICY "Users can access their business data" ON rd_businesses
FOR ALL USING (auth.uid() = owner_id);
```

## Benefits of This Setup

### ✅ Complete Safety
- Development changes never affect live clients
- Database schema changes can be tested thoroughly
- Mistakes in development won't impact production

### ✅ Realistic Testing
- Test with sample client data that mirrors production
- Verify calculations and workflows work correctly
- Performance testing without affecting live users

### ✅ Team Collaboration
- Multiple developers can work on same codebase safely
- Database experiments won't conflict
- Easy to reset development data when needed

## Daily Workflow After Setup

### Development Work
```bash
# Your .env file points to development database
npm run dev
# Add test clients, experiment freely
# All changes go to development database
```

### Production Deployment
```bash
# Create PR: development → main
# Netlify environment variables point to production database
# Only tested, approved code affects live clients
```

## Database Migration Workflow

### 1. Test in Development First
```sql
-- Test migration in development Supabase
ALTER TABLE rd_businesses ADD COLUMN new_field TEXT;
```

### 2. If Successful, Apply to Production
```sql
-- After thorough testing, run same migration in production
ALTER TABLE rd_businesses ADD COLUMN new_field TEXT;
```

## Cost Considerations

- **Development Supabase Project**: Free tier is usually sufficient
- **Production Supabase Project**: Pay for what you actually use
- **Total Additional Cost**: Minimal (likely $0-10/month for development)

## Alternative: Single Project with Schemas

If you prefer not to create separate projects:

```sql
-- Create development schema in same project
CREATE SCHEMA development;

-- Create tables in development schema
CREATE TABLE development.rd_businesses (...);
CREATE TABLE development.rd_business_years (...);
-- etc.

-- Update app to use schema based on environment
-- Requires code changes to dynamically set schema
```

## Rollback Plan

If you want to revert to single database:
1. Update .env to point back to production database
2. Delete development Supabase project
3. Continue as before (with code-only separation)

## Security Best Practices

### API Keys
- ✅ Use different API keys for development and production
- ✅ Rotate keys regularly
- ✅ Never commit API keys to git

### Access Control
- ✅ Limit development database access to developers only
- ✅ Production database access should be minimal
- ✅ Use RLS policies in both environments

### Data Privacy
- ✅ Never copy real client PII to development
- ✅ Use anonymized or synthetic data for testing
- ✅ Regular cleanup of development data

## Testing the Separation

After setup, verify separation works:

### 1. Add Test Client in Development
```bash
npm run dev
# Add a client named "TEST CLIENT - DO NOT USE IN PRODUCTION"
```

### 2. Check Production Database
- **Should NOT see** the test client in production
- **Should only see** real clients

### 3. Deploy to Production
```bash
# Create PR: development → main → merge
# Check production app
# Should still only see real clients (not test clients)
```

## Support

If you need help with this setup:
1. Start with Step 1 (create development project)
2. Test schema migration on a simple table first
3. Gradually move to full separation
4. Keep production backup before major changes

**Remember**: This separation provides both deployment AND data safety! 🛡️ 