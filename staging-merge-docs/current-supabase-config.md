# Current Supabase Configuration Documentation
## Epic3/Staging Branch Database State

**Date**: 2025-07-28  
**Branch**: staging (created from epic3)  
**Purpose**: Documentation for strategic merge with main branch

---

## Current Active Configuration

### Primary Database (Epic3 Development)
- **Type**: Local Supabase Development Instance
- **URL**: `http://127.0.0.1:54321`
- **ANON Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0`
- **Service Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU`
- **Functions URL**: `http://127.0.0.1:54321/functions/v1`
- **Database Path**: `/taxapp/db/bba/`

### Available Remote Databases (Commented Out)

#### Battle Born Advisors Remote (Production?)
- **URL**: `https://ufxwqddayrydbgwaysfw.supabase.co`
- **ANON Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmeHdxZGRheXJ5ZGJnd2F5c2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxODE3ODksImV4cCI6MjA2NTc1Nzc4OX0.FRSq5CgQLsaLe4QNBOgvUQFEsXZypZ2Nrg3Mr5Kswpw`
- **Status**: Available but not currently used

#### Tax RX Database (Legacy?)
- **URL**: `https://kiogxpdjhopdlxhttprg.supabase.co`
- **ANON Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpb2d4cGRqaG9wZGx4aHR0cHJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTUzNTEsImV4cCI6MjA1OTc5MTM1MX0.DEIHWFAHfXZrwAwORUjWd-G6fdlyufbgwUfGwW_hZng`
- **Status**: Available but not currently used

---

## Migration History & Database Evolution

### Latest Migrations (Epic3 Branch)
- **Total Migrations**: 58 migration files
- **Date Range**: 2025-06-17 to 2025-07-22
- **Last Migration**: `20250722042034_remove_deprecated_profile_columns.sql`

### Key Structural Changes in Epic3
1. **User Management Overhaul**:
   - Deleted `public.users` table, migrated to `auth.users`
   - Updated all foreign key references
   - Fixed RLS policies for new user structure

2. **Account System Consolidation**:
   - Migrated `partners` table to unified `accounts` table
   - Added `operator` account type (renamed from `platform`)
   - Consolidated account management system

3. **Profile System Simplification**:
   - Cleaned up `profiles` table structure
   - Moved tax profile completion tracking to `clients` table
   - Removed deprecated profile columns

4. **Multi-User Access System**:
   - Enhanced client access with multi-user support
   - Improved RLS policies for affiliate/admin/client access
   - Added client user junction tables

---

## Edge Functions Configuration

### Configured Functions (db/bba/supabase/config.toml)
1. **user-service**: JWT verification disabled, entry point configured
2. **admin-service**: JWT verification enabled, admin operations
3. **partner-service**: JWT verification enabled, partner management
4. **billing-service**: JWT verification enabled, billing operations

### Environment Variables for Functions
- **Stripe Integration**: Test keys configured
- **Local Development**: Functions URL pointing to localhost:54321

---

## Authentication Configuration

### Current Auth Settings
- **Signup Enabled**: True
- **Site URL**: `http://localhost:5174`
- **Redirect URLs**: Local development URLs configured
- **Email Confirmation**: Enabled with double confirmation for changes
- **Email Signup**: Enabled

---

## Database Schema State (Epic3)

### Core Tables
- **accounts**: Unified account management (affiliates, admins, partners, operators)
- **profiles**: User profile information linked to auth.users
- **clients**: Client management with multi-user access support
- **client_users**: Junction table for multi-user client access
- **tax_proposals**: Tax strategy proposals and workflows
- **invitations**: User invitation system

### Authentication Integration
- **Primary Auth**: Supabase auth.users
- **Profile Linking**: profiles.id → auth.users.id
- **RLS Policies**: Comprehensive row-level security across all tables

### Special Features
- **Tool Management System**: Account-based tool access and analytics
- **Activity Logging**: Comprehensive activity tracking
- **Billing Integration**: Stripe integration for payment processing
- **Document Storage**: Prepared document storage system

---

## Integration Points

### External Services
- **SMTP**: Gmail SMTP configured (credentials to be updated)
- **Stripe**: Test environment configured
- **Web3Forms**: Contact form integration
- **Site URL**: https://battleborn.life

### API Structure
- **Local Functions**: http://127.0.0.1:54321/functions/v1
- **Service Architecture**: Microservice-based edge functions
- **Authentication**: JWT-based with role-based access control

---

## Next Steps for Main Branch Merge

### Critical Configuration Questions
1. **Which Supabase project does main branch use?**
   - Battle Born Advisors Remote?
   - Tax RX Database?
   - Different project entirely?

2. **Schema Differences**:
   - Does main branch still use `public.users` table?
   - Does main branch have the account consolidation?
   - What's the state of multi-user access in main?

3. **Migration Conflicts**:
   - How many migrations exist in main branch?
   - Are there conflicting migration files?
   - Do we need to reconcile migration histories?

### Recommended Approach
1. **Switch to main branch** and document its Supabase configuration
2. **Compare database schemas** between epic3 and main
3. **Create unified migration strategy** that preserves epic3 enhancements
4. **Plan configuration merge** for seamless integration

---

## Risk Assessment

### High Risk Areas
- **User Authentication**: Different user table structures between branches
- **Account Management**: Epic3 has consolidated accounts, main may not
- **RLS Policies**: Epic3 has enhanced policies, main may have conflicts
- **Migration History**: Potential for migration file conflicts

### Mitigation Strategies
- **Database Dumps**: Full schema and data dumps before merge
- **Configuration Backup**: All environment and config files backed up
- **Rollback Plan**: Tagged baseline for easy rollback to pre-merge state
- **Incremental Testing**: Test each component after merge resolution

---

**Status**: Epic3/Staging configuration documented ✅  
**Next Task**: Document main branch Supabase configuration for comparison