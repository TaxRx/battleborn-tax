# RLS Policy Creation Guide

This guide explains how Row Level Security (RLS) policies work in the Battle Born Capital Advisors system and provides patterns for creating new policies.

## Overview

Our RLS system uses account-based access control through the `can_access_account` function and helper functions like `get_account_id`, `get_account_id_by_client`, and `get_client_id`.

## Core Functions

### can_access_account(user_id, target_account_id, permission_level)

The primary function for all access control decisions.

**Parameters:**
- `user_id`: The UUID of the user requesting access (typically `auth.uid()`)
- `target_account_id`: The UUID of the account being accessed
- `permission_level`: Either `'view'` or `'admin'`

**Returns:** `boolean` - true if access is allowed

**Usage in RLS:**
- SELECT operations: Use `'view'` permission level
- INSERT/UPDATE/DELETE operations: Use `'admin'` permission level

### Helper Functions

- `get_account_id(table_name, record_id, join_table, foreign_key)` - Gets account_id from any table
- `get_account_id_by_client(client_id)` - Gets account_id directly from client_id
- `get_client_id(table_name, record_id, join_table, foreign_key)` - Gets client_id from any table

## RLS Policy Patterns

### Pattern 1: Direct account_id column

For tables with an `account_id` column:

```sql
-- SELECT policy
CREATE POLICY "table_name_select" ON public.table_name
    FOR SELECT 
    USING (can_access_account(auth.uid(), account_id, 'view'));

-- INSERT/UPDATE/DELETE policy  
CREATE POLICY "table_name_insert_update_delete" ON public.table_name
    FOR ALL 
    USING (can_access_account(auth.uid(), account_id, 'admin'));
```

### Pattern 2: client_id column (resolve to account_id)

For tables with a `client_id` column but no `account_id`:

```sql
-- SELECT policy
CREATE POLICY "table_name_select" ON public.table_name
    FOR SELECT 
    USING (can_access_account(auth.uid(), get_account_id('clients', client_id), 'view'));

-- INSERT/UPDATE/DELETE policy
CREATE POLICY "table_name_insert_update_delete" ON public.table_name
    FOR ALL 
    USING (can_access_account(auth.uid(), get_account_id('clients', client_id), 'admin'));
```

### Pattern 3: business_id column (resolve via rd_businesses)

For tables with a `business_id` column:

```sql
-- SELECT policy
CREATE POLICY "table_name_select" ON public.table_name
    FOR SELECT 
    USING (can_access_account(auth.uid(), get_account_id('rd_businesses', business_id), 'view'));

-- INSERT/UPDATE/DELETE policy
CREATE POLICY "table_name_insert_update_delete" ON public.table_name
    FOR ALL 
    USING (can_access_account(auth.uid(), get_account_id('rd_businesses', business_id), 'admin'));
```

### Pattern 4: business_year_id column (resolve via rd_business_years -> rd_businesses)

For tables with a `business_year_id` column:

```sql
-- SELECT policy
CREATE POLICY "table_name_select" ON public.table_name
    FOR SELECT 
    USING (can_access_account(auth.uid(), get_account_id('rd_business_years', business_year_id, 'rd_businesses'), 'view'));

-- INSERT/UPDATE/DELETE policy
CREATE POLICY "table_name_insert_update_delete" ON public.table_name
    FOR ALL 
    USING (can_access_account(auth.uid(), get_account_id('rd_business_years', business_year_id, 'rd_businesses'), 'admin'));
```

### Pattern 5: user_id column (resolve via profiles.account_id)

For tables with a `user_id` column:

```sql
-- SELECT policy
CREATE POLICY "table_name_select" ON public.table_name
    FOR SELECT 
    USING (
        can_access_account(
            auth.uid(), 
            (SELECT account_id FROM profiles WHERE id = user_id), 
            'view'
        )
    );

-- INSERT/UPDATE/DELETE policy
CREATE POLICY "table_name_insert_update_delete" ON public.table_name
    FOR ALL 
    USING (
        can_access_account(
            auth.uid(), 
            (SELECT account_id FROM profiles WHERE id = user_id), 
            'admin'
        )
    );
```

## Column Prioritization

When tables have multiple access control columns, we use this priority order:

1. **`account_id`** (highest priority - direct access)
2. **`client_id`** (high priority - common access path)
3. **`business_id`** (medium priority - business-level access)
4. **`business_year_id`** (low priority - year-specific access)
5. **`user_id`** (lowest priority - user-level access via profiles)

**Examples**: 
- A table with both `client_id` and `business_id` will use only the `client_id` for RLS policies
- A table with both `user_id` and `business_id` will use only the `business_id` for RLS policies
- This simplifies the logic and avoids complex OR conditions

## Account Access Rules

The `can_access_account` function implements these access rules:

1. **Admin accounts**: Unrestricted access to all accounts
2. **Self-access**: Users can access their own account (with role validation for admin permissions)
3. **Account linking**: Access granted through `account_links` table based on:
   - **Operator accounts**: Can link to client, affiliate, expert accounts
   - **Affiliate/Expert accounts**: Can link to client accounts only
   - **Client accounts**: Cannot be source of links (only targets)

## Permission Levels

- **`'view'`**: Read-only access (SELECT operations)
- **`'admin'`**: Full access (INSERT/UPDATE/DELETE operations)
  - Requires admin role for self-access
  - Requires admin-level link for linked accounts

## Creating RLS Policies for New Tables

### Step 1: Identify Access Columns
Check which of these columns your table has (in priority order):
- `account_id` (direct access - highest priority)
- `client_id` (resolve to account via clients table - high priority)
- `business_id` (resolve to account via rd_businesses -> clients - medium priority)
- `business_year_id` (resolve to account via rd_business_years -> rd_businesses -> clients - low priority)
- `user_id` (resolve to account via profiles.account_id - lowest priority)

**Use the highest priority column found** - ignore lower priority columns if multiple are present.

### Step 2: Enable RLS
```sql
ALTER TABLE public.your_table_name ENABLE ROW LEVEL SECURITY;
```

### Step 3: Create Policies
Use the appropriate pattern from above based on your access columns.

### Step 4: Drop Existing Policies (if re-running)
```sql
DROP POLICY IF EXISTS "your_policy_name" ON public.your_table_name;
```

## Testing RLS Policies

### Test with Different User Types
1. **Admin user**: Should have access to all records
2. **Operator user**: Should have access to linked client/affiliate/expert accounts
3. **Affiliate user**: Should have access to linked client accounts only
4. **Client user**: Should have access to their own account only

### Sample Test Queries
```sql
-- Test as specific user (replace with actual user ID)
SET LOCAL "request.jwt.claims" = '{"sub": "user-uuid-here"}';

-- Test SELECT access
SELECT * FROM your_table_name LIMIT 5;

-- Test INSERT access (should work for admin level access)
INSERT INTO your_table_name (...) VALUES (...);
```

## Common Patterns in Migration Files

### Batch Policy Creation
```sql
DO $$ 
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name LIKE 'rd_%'
    LOOP
        EXECUTE format('CREATE POLICY "%I_select" ON public.%I ...', 
                      table_record.table_name, table_record.table_name);
    END LOOP;
END $$;
```

### Policy Cleanup
```sql
-- Drop all policies for a table
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'your_table'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.your_table', 
                      policy_record.policyname);
    END LOOP;
END $$;
```

## Migration Naming Convention

Use descriptive migration names:
- `create_rls_policies_for_new_feature`
- `update_rls_policies_comprehensive`
- `fix_rls_access_control_table_name`

## Performance Considerations

1. **Index relevant columns**: Ensure access control columns have indexes
2. **Avoid complex OR conditions**: When possible, simplify access logic
3. **Test policy performance**: Use EXPLAIN ANALYZE on queries with RLS

## Security Best Practices

1. **Always enable RLS** on tables with sensitive data
2. **Use consistent patterns** across similar tables
3. **Test with real user accounts** before deploying
4. **Document special cases** in migration comments
5. **Prefer deny-by-default** - only grant access when explicitly allowed

## Troubleshooting Common Issues

### Policy Not Working
- Check if RLS is enabled: `SELECT relname FROM pg_class WHERE relname = 'your_table' AND relrowsecurity = true;`
- Verify policy exists: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
- Test with known good user ID

### Performance Issues
- Check if access control columns are indexed
- Consider simplifying complex OR conditions
- Use EXPLAIN ANALYZE to identify bottlenecks

### Access Denied Errors
- Verify user has appropriate account links
- Check account and profile status (must be 'active')
- Ensure permission level matches operation (view vs admin)

## Future Enhancements

When adding new access patterns:
1. Update this documentation
2. Add to the helper functions if needed
3. Test thoroughly with all user types
4. Consider backward compatibility