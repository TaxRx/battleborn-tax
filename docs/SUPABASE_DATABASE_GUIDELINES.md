# Supabase Database Guidelines & Best Practices

## Overview
This document provides guidelines for working with Supabase databases in the Battle Born Capital Advisors tax management platform, based on common challenges and best practices learned during development.

## Table of Contents
1. [Migration Management](#migration-management)
2. [Schema Design](#schema-design)
3. [Row Level Security (RLS)](#row-level-security-rls)
4. [Functions & Procedures](#functions--procedures)
5. [Indexing Strategy](#indexing-strategy)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Testing & Validation](#testing--validation)
8. [Performance Considerations](#performance-considerations)

---

## Migration Management

### Migration File Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name.sql
```
Example: `20250724000010_epic4_document_storage_system.sql`

### Migration Structure Template
```sql
-- Migration Header
-- Epic X Sprint X.X: Feature Name
-- Story X.X.X: Specific Implementation
-- BMad Framework: Description

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tables with proper constraints
-- Create indexes for performance
-- Create RLS policies
-- Create functions
-- Create triggers
-- Grant permissions
-- Add comments for documentation
```

### Key Migration Rules
1. **Always use `IF NOT EXISTS`** for extensions, tables, indexes, and functions
2. **Use descriptive names** that clearly indicate the purpose
3. **Include proper constraints** (PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE)
4. **Add indexes immediately** after table creation
5. **Enable RLS on all tables** that contain user data
6. **Create RLS policies** for proper data access control
7. **Add comments** for documentation purposes

### Example Table Creation
```sql
CREATE TABLE IF NOT EXISTS document_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    
    -- Data fields with proper types
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0),
    CONSTRAINT valid_file_name CHECK (length(original_name) > 0),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## Schema Design

### Column Naming Conventions
- Use `snake_case` for all column names
- Use descriptive names (avoid abbreviations)
- Include `_id` suffix for foreign keys
- Use `_at` suffix for timestamps
- Use boolean column names that read as questions (`is_active`, `has_permission`)

### Data Types Best Practices
- Use `UUID` for primary keys and foreign keys
- Use `TIMESTAMP WITH TIME ZONE` for all timestamps
- Use `VARCHAR(n)` instead of `TEXT` when you have known length limits
- Use `JSONB` for structured data that needs querying
- Use `TEXT[]` for arrays of strings
- Use `BIGINT` for file sizes and large numbers

### Audit Fields Standard
Always include these fields in user-facing tables:
```sql
created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
created_by UUID,
updated_by UUID
```

---

## Row Level Security (RLS)

### RLS Policy Template
```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "policy_name" ON table_name
    FOR ALL USING (client_id = auth.uid());

-- More specific policies
CREATE POLICY "clients_can_read_own_data" ON table_name
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "clients_can_update_own_data" ON table_name
    FOR UPDATE USING (client_id = auth.uid());
```

### RLS Best Practices
1. **Always enable RLS** on tables containing user data
2. **Use descriptive policy names** that explain what they do
3. **Create separate policies** for different operations (SELECT, INSERT, UPDATE, DELETE)
4. **Test policies thoroughly** to ensure they work as expected
5. **Use `auth.uid()`** to reference the current user
6. **Consider admin access** when creating policies

---

## Functions & Procedures

### Function Template
```sql
CREATE OR REPLACE FUNCTION function_name(
    p_param1 UUID,
    p_param2 VARCHAR(255)
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result UUID;
BEGIN
    -- Function logic here
    
    -- Always handle errors
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error in function_name: %', SQLERRM;
END;
$$;
```

### Function Best Practices
1. **Use parameter prefixes** (`p_` for parameters, `v_` for variables)
2. **Use `SECURITY DEFINER`** for functions that need elevated permissions
3. **Include error handling** with meaningful error messages
4. **Use explicit variable declarations** in the `DECLARE` section
5. **Return appropriate data types** based on the function's purpose
6. **Add function comments** for documentation

### Common Function Patterns
```sql
-- Insert with return ID
INSERT INTO table_name (...)
VALUES (...)
RETURNING id INTO v_result;

-- Update with timestamp
UPDATE table_name 
SET field = value, updated_at = NOW()
WHERE id = p_id;

-- Conditional logic
IF condition THEN
    -- logic
ELSIF other_condition THEN
    -- other logic
ELSE
    -- default logic
END IF;
```

---

## Indexing Strategy

### Index Creation Template
```sql
-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_table_column ON table_name(column);
CREATE INDEX IF NOT EXISTS idx_table_multiple ON table_name(col1, col2);

-- Partial indexes
CREATE INDEX IF NOT EXISTS idx_table_active ON table_name(column) WHERE is_active = true;

-- GIN indexes for arrays and JSONB
CREATE INDEX IF NOT EXISTS idx_table_tags ON table_name USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_table_data ON table_name USING gin(data);

-- Text search indexes
CREATE INDEX IF NOT EXISTS idx_table_search ON table_name USING gin(column gin_trgm_ops);
```

### Indexing Best Practices
1. **Index foreign keys** for faster joins
2. **Index frequently queried columns** (client_id, created_at, status)
3. **Use composite indexes** for multi-column queries
4. **Use GIN indexes** for arrays and JSONB columns
5. **Use partial indexes** for filtered queries
6. **Monitor index usage** and remove unused indexes

---

## Common Issues & Solutions

### Issue: Table Already Exists Error
**Problem**: Migration fails because table already exists
**Solution**: Always use `IF NOT EXISTS` in CREATE statements

### Issue: Column Naming Conflicts
**Problem**: Using reserved words or conflicting names
**Solution**: Use descriptive, non-reserved column names and quote when necessary

### Issue: RLS Blocking Data Access
**Problem**: Policies too restrictive, preventing legitimate access
**Solution**: Test policies thoroughly and create appropriate admin policies

### Issue: Function Permission Errors
**Problem**: Functions can't access tables due to RLS
**Solution**: Use `SECURITY DEFINER` and ensure function has proper permissions

### Issue: Index Performance Problems
**Problem**: Queries are slow despite having indexes
**Solution**: Analyze query plans and create appropriate composite indexes

### Issue: Foreign Key Constraint Violations
**Problem**: Trying to reference non-existent records
**Solution**: Ensure referenced records exist and use proper ON DELETE actions

---

## Testing & Validation

### Migration Testing Checklist
- [ ] Migration runs without errors
- [ ] Tables are created with proper structure
- [ ] Indexes are created and functional
- [ ] RLS policies work as expected
- [ ] Functions execute without errors
- [ ] Triggers fire properly
- [ ] Permissions are granted correctly

### Data Validation
```sql
-- Check table structure
\d table_name

-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'table_name';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';

-- Check function definitions
\df function_name

-- Test data insertion
INSERT INTO table_name (...) VALUES (...);
```

### Performance Testing
```sql
-- Explain query plans
EXPLAIN ANALYZE SELECT * FROM table_name WHERE condition;

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE relname = 'table_name';

-- Monitor query performance
SELECT query, calls, mean_time FROM pg_stat_statements WHERE query LIKE '%table_name%';
```

---

## Performance Considerations

### Database Design
1. **Normalize appropriately** - not too much, not too little
2. **Use appropriate data types** - don't use TEXT for everything
3. **Limit column sizes** - use VARCHAR(n) instead of TEXT when possible
4. **Use JSONB instead of JSON** for better performance and indexing

### Query Optimization
1. **Use LIMIT** for pagination instead of OFFSET for large datasets
2. **Use EXISTS** instead of IN for subqueries when possible
3. **Avoid SELECT \*** - specify only needed columns
4. **Use batch operations** for multiple inserts/updates

### Connection Management
1. **Use connection pooling** in production
2. **Close connections properly** to avoid connection leaks
3. **Monitor connection usage** and adjust pool sizes

---

## Development Workflow

### Pre-Migration Checklist
1. **Review existing schema** to understand current structure
2. **Check for naming conflicts** with existing tables/columns
3. **Plan RLS policies** before creating tables
4. **Consider performance implications** of new indexes
5. **Test migration on development environment** first

### Post-Migration Checklist
1. **Verify all objects created** successfully
2. **Test RLS policies** with different user roles
3. **Run performance tests** on critical queries
4. **Update application code** to use new schema
5. **Document changes** in this guideline if needed

### Rollback Strategy
1. **Always have a rollback plan** before running migrations
2. **Test rollback procedures** in development
3. **Keep backups** of database before major changes
4. **Document rollback steps** for each migration

---

## Code Examples

### Complete Migration Example
```sql
-- Epic 4 Sprint 4.1: Document Management System
-- Story 4.1.1: Secure Document Storage System

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create table with all best practices
CREATE TABLE IF NOT EXISTS document_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    
    -- File metadata
    original_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0),
    CONSTRAINT valid_file_name CHECK (length(original_name) > 0),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_files_client_id ON document_files(client_id);
CREATE INDEX IF NOT EXISTS idx_document_files_folder_id ON document_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_files_created_at ON document_files(created_at);

-- Enable RLS
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "clients_can_access_own_files" ON document_files
    FOR ALL USING (client_id = auth.uid());

-- Create functions
CREATE OR REPLACE FUNCTION upload_document(
    p_client_id UUID,
    p_original_name VARCHAR(255),
    p_file_size BIGINT,
    p_mime_type VARCHAR(100)
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_document_id UUID;
BEGIN
    INSERT INTO document_files (client_id, original_name, file_size, mime_type, created_by)
    VALUES (p_client_id, p_original_name, p_file_size, p_mime_type, p_client_id)
    RETURNING id INTO v_document_id;
    
    RETURN v_document_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error uploading document: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comments
COMMENT ON TABLE document_files IS 'Stores client document metadata and file information';
COMMENT ON FUNCTION upload_document IS 'Handles secure document upload with proper validation';
```

---

## Troubleshooting Guide

### Common Error Messages

**Error**: `relation "table_name" does not exist`
**Solution**: Check if table was created properly, ensure migration ran successfully

**Error**: `permission denied for table table_name`
**Solution**: Check RLS policies and ensure user has proper permissions

**Error**: `function function_name does not exist`
**Solution**: Verify function was created and has proper permissions

**Error**: `constraint "constraint_name" already exists`
**Solution**: Use `IF NOT EXISTS` or check if constraint already exists

### Debugging Steps
1. **Check migration logs** for errors
2. **Verify table structure** with `\d table_name`
3. **Test RLS policies** with different user contexts
4. **Check function definitions** with `\df function_name`
5. **Monitor query performance** with `EXPLAIN ANALYZE`

---

## Best Practices Summary

1. **Always use `IF NOT EXISTS`** for idempotent migrations
2. **Enable RLS** on all user data tables
3. **Create proper indexes** for performance
4. **Use descriptive naming** for tables, columns, and functions
5. **Include audit fields** (created_at, updated_at, created_by)
6. **Test thoroughly** before deploying to production
7. **Document everything** with comments
8. **Plan for rollbacks** and error handling
9. **Monitor performance** and optimize as needed
10. **Follow security best practices** for data access

---

*This document should be updated as we encounter new challenges and develop better practices.*