# Supabase Migration Operations Guide

## Overview
This document defines the strict operational procedures for managing Supabase database migrations, including when and how to execute migrations, modify schema, and sync between environments.

---

## ⚠️ CRITICAL RULES - NEVER VIOLATE THESE

### 1. **NO DIRECT DATABASE STRUCTURE CHANGES WITHOUT PERMISSION**
- **NEVER** run any DDL commands (CREATE, ALTER, DROP) without explicit user approval
- **NEVER** modify database schema directly via psql
- **NEVER** create, modify, or delete tables, columns, indexes, or functions without permission
- **ALWAYS** ask for permission before making any structural changes

### 2. **MIGRATION FILE IMMUTABILITY**
- **NEVER** modify an existing migration file that has been applied
- **NEVER** rename or delete migration files
- **NEVER** change the content of a migration file after it has been run
- **ALWAYS** create a new migration file for changes

### 3. **ENVIRONMENT SAFETY**
- **NEVER** run migrations against production without explicit approval
- **NEVER** sync local changes to remote without permission
- **NEVER** reset or drop production databases
- **ALWAYS** work on local development environment first

### 4. **LOCAL DATABASE PROTECTION**
- **NEVER** run `supabase db reset` without explicit permission
- **NEVER** overwrite local data without checking with user first
- **ALWAYS** request permission before resetting local database
- **ALWAYS** warn that reset will destroy local data

---

## Migration Execution Process

### Step 1: Check Current Migration Status
```bash
# Check what migrations have been applied
supabase migration list

# Check local database status
supabase status

# Connect to local database for inspection (if needed)
psql "postgresql://postgres:postgres@localhost:54322/postgres"
```

### Step 2: Request Permission for Database Changes
**Before creating any migration:**
1. Describe what database changes you want to make
2. Explain why the changes are needed
3. Wait for explicit user approval
4. Only proceed after receiving permission

### Step 3: Create New Migration File
```bash
# Create a new migration file
supabase migration new descriptive_name_here

# This creates: supabase/migrations/TIMESTAMP_descriptive_name_here.sql
```

### Step 4: Write Migration Content
- Write SQL in the new migration file
- Follow the schema guidelines
- Include proper error handling
- Add rollback comments if needed

### Step 5: Apply Migration to Local Database
```bash
# Apply migration to local database
supabase migration up

# Verify the migration was applied
supabase migration list
```

### Step 6: Test Migration Locally
- Test all functionality affected by the migration
- Verify data integrity
- Check that application code works with new schema
- Confirm no breaking changes

### Step 7: Request Permission to Deploy
**Before deploying to remote:**
1. Confirm migration works locally
2. Request permission to deploy to remote
3. Wait for explicit approval
4. Only proceed after receiving permission

### Step 8: Deploy to Remote (With Permission Only)
```bash
# Deploy migration to remote Supabase
supabase db push

# Verify deployment
supabase migration list --remote
```

---

## When You CAN Use Direct Database Access

### Read-Only Operations (psql allowed)
```bash
# Connect to local database for inspection
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Safe read-only commands:
\d                    # List tables
\d table_name        # Describe table structure
SELECT * FROM table; # Query data
EXPLAIN ANALYZE ...  # Analyze query performance
\df                  # List functions
\dp                  # List permissions
```

### Data-Only Operations (with caution)
```sql
-- Safe data operations (no schema changes):
INSERT INTO table VALUES (...);
UPDATE table SET column = value WHERE ...;
DELETE FROM table WHERE ...;

-- NEVER use these without permission:
CREATE TABLE ...
ALTER TABLE ...
DROP TABLE ...
CREATE INDEX ...
DROP INDEX ...
CREATE FUNCTION ...
DROP FUNCTION ...
```

---

## When You CANNOT Use Direct Database Access

### Prohibited Operations
- **ANY** DDL commands (CREATE, ALTER, DROP)
- **ANY** schema modifications
- **ANY** structural changes
- **ANY** operations on production database
- **ANY** operations that bypass migration system

### Must Use Migration System For:
- Creating tables
- Modifying table structure
- Adding/removing columns
- Creating/dropping indexes
- Creating/modifying functions
- Changing constraints
- Creating/modifying triggers
- Any schema changes whatsoever

---

## Environment Synchronization Rules

### Local to Remote Sync
```bash
# ❌ NEVER do this without permission:
supabase db push

# ✅ ONLY after explicit approval:
# 1. Request permission to deploy
# 2. Wait for approval
# 3. Then run: supabase db push
```

### Remote to Local Sync
```bash
# ✅ ALLOWED for getting updates:
supabase db pull

# ⚠️ REQUIRES PERMISSION - May overwrite local data:
supabase db reset
```

### When to Sync Remote to Local
- **REQUEST PERMISSION** before running `supabase db reset` (may overwrite local data)
- **DO** sync when starting work on a new feature (with permission)
- **DO** sync when you need latest schema from remote (with permission)
- **DO** sync when your local database is corrupted (with permission)
- **DO** sync when instructed by user

### When NOT to Sync Local to Remote
- **DON'T** sync experimental changes
- **DON'T** sync without testing thoroughly
- **DON'T** sync without explicit permission
- **DON'T** sync during active development by others

---

## Migration File Management

### Creating Migration Files
```bash
# ✅ CORRECT: Create new migration for changes
supabase migration new add_document_tables

# ❌ WRONG: Modify existing migration
# nano supabase/migrations/20250101000000_existing.sql
```

### Naming Conventions
```bash
# Good examples:
supabase migration new add_user_preferences
supabase migration new update_billing_schema
supabase migration new fix_index_performance

# Bad examples:
supabase migration new changes
supabase migration new update
supabase migration new fix
```

### Migration File Rules
1. **One purpose per migration** - Don't mix unrelated changes
2. **Descriptive names** - Clearly indicate what the migration does
3. **Never modify existing** - Always create new migration for changes
4. **Include rollback comments** - Document how to reverse changes
5. **Test before committing** - Ensure migration works locally

---

## Database Reset and Recovery

### Local Database Reset (REQUIRES PERMISSION)
```bash
# ⚠️ MUST REQUEST PERMISSION FIRST - This will overwrite local data
# Reset local database to match remote
supabase db reset

# This will:
# 1. Drop local database (DESTROYS LOCAL DATA)
# 2. Recreate from remote
# 3. Apply all migrations
```

### Recovery from Migration Issues
```bash
# If migration fails locally:
# 1. Request permission first:
echo "Migration failed locally. May I reset local database to clean state?"
# 2. After approval:
supabase db reset          # Reset to clean state
supabase migration up      # Re-apply migrations

# If you need to fix a migration:
# 1. Create new migration to fix the issue
# 2. DO NOT modify the original migration
```

### Backup Before Major Changes
```bash
# Create backup before major changes
pg_dump "postgresql://postgres:postgres@localhost:54322/postgres" > backup.sql

# Restore from backup if needed
psql "postgresql://postgres:postgres@localhost:54322/postgres" < backup.sql
```

---

## Pre-Migration Checklist

### Before Creating Migration
- [ ] Have I received permission to make database changes?
- [ ] Do I understand what changes are needed?
- [ ] Have I planned the migration structure?
- [ ] Is my local database in sync with remote?

### Before Writing Migration
- [ ] Have I checked current schema structure?
- [ ] Have I considered existing data?
- [ ] Have I planned for rollback scenario?
- [ ] Have I considered performance implications?

### Before Running Migration
- [ ] Have I reviewed the migration SQL?
- [ ] Have I checked for syntax errors?
- [ ] Have I tested on sample data?
- [ ] Have I verified migration file naming?

### Before Deploying to Remote
- [ ] Have I tested migration locally?
- [ ] Have I received permission to deploy?
- [ ] Have I backed up current state?
- [ ] Have I verified no one else is deploying?

---

## Error Handling and Troubleshooting

### Common Migration Errors
```bash
# Error: Migration already applied
# Solution: Check migration list, create new migration

# Error: Permission denied
# Solution: Check RLS policies, verify user permissions

# Error: Table already exists
# Solution: Use IF NOT EXISTS, check existing schema

# Error: Function already exists
# Solution: Use CREATE OR REPLACE, check function list
```

### Recovery Procedures
```bash
# If migration fails:
1. Check error message
2. Fix issue in new migration
3. Apply fix migration
4. Never modify original migration

# If database is corrupted:
1. supabase db reset
2. supabase migration up
3. Verify all data is correct
```

---

## Command Reference

### Essential Commands
```bash
# Database status
supabase status
psql "postgresql://postgres:postgres@localhost:54322/postgres"

# Migration management
supabase migration list
supabase migration new <name>
supabase migration up
supabase db push        # REQUIRES PERMISSION
supabase db pull
supabase db reset       # REQUIRES PERMISSION

# Database inspection (inside psql)
\d                  # List tables
\d table_name      # Describe table
\df                # List functions
\dp                # List permissions
```

### Dangerous Commands (Use with Caution)
```bash
# These require explicit permission:
supabase db push           # Deploy to remote
supabase db reset          # Reset local database (DESTROYS LOCAL DATA)
supabase db reset --remote # Reset remote database
supabase migration repair  # Fix migration issues
```

---

## Workflow Examples

### Example 1: Adding New Feature Tables
```bash
# 1. Get permission
echo "I need to add document storage tables for Epic 4.1"
echo "This includes: document_files, document_folders, document_shares"
echo "May I proceed with creating this migration?"

# 2. Wait for approval, then:
supabase migration new add_document_storage_tables

# 3. Write migration SQL
# 4. Test locally
supabase migration up

# 5. Request deployment permission
echo "Migration tested locally and working. May I deploy to remote?"

# 6. Deploy (only after approval)
supabase db push
```

### Example 2: Fixing Migration Issue
```bash
# 1. Identify problem
echo "Migration 20250101000000_add_users.sql has a constraint error"
echo "I need to create a fix migration to adjust the constraint"

# 2. Create fix migration
supabase migration new fix_user_constraint_error

# 3. Write fix in new migration
# 4. Test locally
supabase migration up

# 5. Deploy fix
supabase db push
```

---

## Summary of Key Rules

1. **🚫 NEVER** modify database schema without permission
2. **🚫 NEVER** modify existing migration files
3. **🚫 NEVER** deploy to remote without approval
4. **✅ ALWAYS** ask permission before structural changes
5. **✅ ALWAYS** test migrations locally first
6. **✅ ALWAYS** create new migrations for changes
7. **✅ ALWAYS** use migration system for schema changes
8. **✅ ALWAYS** sync from remote when starting work
9. **✅ ALWAYS** verify migration success before deploying
10. **✅ ALWAYS** document what the migration does

---

*This document defines the strict operational procedures that must be followed for all database operations.*