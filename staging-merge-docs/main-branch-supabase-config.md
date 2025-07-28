# Main Branch Supabase Configuration Documentation
## Main Branch Database State Analysis

**Date**: 2025-07-28  
**Branch**: main  
**Purpose**: Documentation for strategic merge with epic3/staging branch

---

## Critical Discovery: Different Database Architecture

### Main Branch Structure
- **Database Path**: `/supabase/` (ROOT level, NOT `/db/bba/`)
- **Migration Count**: **61 migration files** (vs. epic3's 58 in different location)
- **Last Update**: Recent commits show active R&D Tax Credit development
- **Architecture**: Single Supabase project at root level

### Epic3/Staging Structure  
- **Database Path**: `/db/bba/supabase/` (nested structure)
- **Migration Count**: **58 migration files** 
- **Architecture**: Isolated BBA (Battle Born Advisors) project structure

---

## Main Branch Configuration Analysis

### Environment Configuration (.env)
```bash
# Currently set to LOCAL development (same as epic3)
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Available Remote Databases (commented out):
# Battle Born Advisors: https://ufxwqddayrydbgwaysfw.supabase.co
# Tax RX Database: https://kiogxpdjhopdlxhttprg.supabase.co
```

### Database Project Structure Comparison

#### Main Branch: Root-Level Supabase
```
taxapp/
├── supabase/
│   ├── config.sql
│   ├── migrations/ (61 files)
│   └── supabase/
└── [no db/bba directory]
```

#### Epic3: Nested BBA Structure  
```
taxapp/
├── db/bba/
│   └── supabase/
│       ├── config.toml
│       ├── migrations/ (58 files)
│       └── functions/
└── supabase/ (legacy?)
```

---

## Migration Analysis

### Main Branch Migrations (61 files)
- **Date Range**: 2024-03-17 to 2025-04-15
- **Focus Areas**: R&D Tax Credit system, client management, strategy workflows
- **Recent Activity**: Business year fixes, allocation modals, employee management
- **Architecture**: Traditional single-project Supabase structure

### Key Main Branch Features
- **R&D Tax Credit System**: Comprehensive R&D credit calculations and workflows
- **Client Management**: Centralized client management with business relationships
- **Strategy Workflows**: Tax strategy proposal and tracking system
- **Commission Tracking**: Advisor commission and tracking functionality

---

## Database Schema Implications

### Likely Schema Differences

#### User Management
- **Main Branch**: Likely uses `public.users` table (traditional approach)
- **Epic3**: Migrated to `auth.users` only (modern approach)
- **Conflict**: Major structural difference requiring reconciliation

#### Account Structure
- **Main Branch**: Separate `clients`, `user_profiles` tables
- **Epic3**: Unified `accounts` table with consolidated management
- **Conflict**: Different relationship models

#### Advanced Features
- **Main Branch**: R&D Tax Credit focus, traditional structure
- **Epic3**: Multi-user access, tool management, document storage, billing
- **Opportunity**: Combine R&D features with Epic3 enhancements

---

## Remote Database Connection Strategy

### Production Database Identification
Based on environment configuration, main branch likely connects to:
- **Primary**: Battle Born Advisors (`ufxwqddayrydbgwaysfw.supabase.co`)
- **Alternative**: Tax RX Database (`kiogxpdjhopdlxhttprg.supabase.co`)

### Connection Approach for Database Dump
1. **Switch environment** to remote Battle Born Advisors database
2. **Use Supabase CLI** with remote project connection
3. **Dump main branch database** for schema comparison
4. **Document differences** between remote prod and epic3 local development

---

## Merge Complexity Assessment

### High Complexity Areas
1. **Structural Differences**: Different directory structures (`/supabase` vs `/db/bba/supabase`)
2. **Migration Conflicts**: Different migration files and histories
3. **User Management**: Different user table structures
4. **Database Location**: Different Supabase projects and connection strings

### Strategic Decisions Required
1. **Database Project**: Which Supabase project becomes the unified target?
2. **Directory Structure**: Root level vs. nested BBA structure?
3. **Migration Strategy**: How to merge 61 + 58 migration histories?
4. **Feature Integration**: How to preserve both R&D features and Epic3 enhancements?

---

## Next Steps for Database Dump

### Remote Connection Required
- **Update .env**: Switch to Battle Born Advisors remote database
- **Connect Remotely**: Use Supabase CLI to connect to production database  
- **Dump Schema**: Capture main branch production schema state
- **Compare**: Comprehensive diff analysis between main (remote) vs epic3 (local)

### Expected Findings
- **Production Data**: Real production data vs. development data
- **Schema Maturity**: Production-tested schema vs. development iterations
- **Performance Optimizations**: Production indexes and optimizations
- **Data Volume**: Significant data vs. minimal development data

---

## Risk Mitigation Strategy

### Before Remote Connection
- ✅ **Epic3 Database Backed Up**: Complete local state preserved
- ✅ **Staging Branch Created**: Safe merge workspace established
- ✅ **Git State Secured**: All code changes committed and pushed

### Remote Access Safety
- **Read-Only Operations**: Only database dumps, no modifications
- **Connection Validation**: Verify connection to correct production database  
- **Backup Verification**: Ensure we have complete backup before proceeding
- **Rollback Plan**: Clear rollback to epic3 local development if needed

---

**Status**: Main branch configuration analyzed ✅  
**Discovery**: Different database architectures requiring strategic reconciliation  
**Next Task**: Connect to remote production database for schema dump  
**Risk Level**: HIGH - Production database access required