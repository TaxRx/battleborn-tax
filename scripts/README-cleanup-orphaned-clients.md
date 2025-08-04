# Database Cleanup Script: Orphaned Clients

This script fixes database integrity issues by ensuring all clients in the `clients` table have valid `account_id` references to the `accounts` table.

## Problem

Over time, the database may accumulate clients that:
1. Have `NULL` or empty `account_id` values
2. Have `account_id` values that reference non-existent accounts

This breaks the new account-based client relationship model and can cause application errors.

## Solution

The script performs the following operations:

1. **Identifies orphaned clients** - Finds all clients with missing or invalid `account_id`
2. **Validates account references** - Checks if `account_id` values exist in the `accounts` table
3. **Creates missing accounts** - Creates new client-type accounts for orphaned clients
4. **Updates client records** - Links clients to their new accounts
5. **Verifies results** - Confirms all clients now have valid account references

## Usage

### Prerequisites

The script is configured to connect to your local Supabase instance with hardcoded connection details:
- **URL**: `http://127.0.0.1:54321` (local Supabase)
- **Key**: Uses the default local anon key

Since RLS is currently disabled for the `clients` and `accounts` tables, the anon key has sufficient permissions to perform the cleanup operations.

### Running the Script

```bash
cd taxapp
npx tsx scripts/cleanup-orphaned-clients.ts
```

### What the Script Does

The script will:

1. **Find orphaned clients**:
   ```
   📋 Step 1: Finding clients with missing or invalid account_id...
   ⚠️  Found 5 clients with missing account_id:
      1. John Doe (john@example.com) - ID: abc123
      2. Jane Smith (jane@example.com) - ID: def456
   ```

2. **Create accounts**:
   ```
   📋 Step 3: Creating accounts for orphaned clients...
      🔄 Creating account for: John Doe (john@example.com)
      ✅ Created account: xyz789 for John Doe
      🔄 Updating client John Doe with account_id: xyz789
      ✅ Updated client: John Doe with account_id: xyz789
   ```

3. **Show summary**:
   ```
   📊 Cleanup Summary:
      • Total orphaned clients found: 5
      • Accounts created: 5
      • Clients updated: 5
   ```

4. **Verify results**:
   ```
   📋 Step 5: Verifying cleanup results...
   ✅ Verification complete: All clients now have valid account_id references!
   ```

## Created Account Properties

For each orphaned client, the script creates an account with:

- **name**: Client's full name (or "Client Account" if not available)
- **type**: "client"
- **contact_email**: Client's email address
- **status**: "active"
- **created_at**: Current timestamp

## Safety Features

- **Rollback on failure**: If updating a client fails, the script removes the newly created account
- **Error handling**: Individual client failures don't stop the entire process
- **Verification**: Final step confirms all clients have valid account references
- **Detailed logging**: Shows exactly what operations are performed

## When to Run

Run this script when:

- Setting up the new account-based client relationship model
- After data migrations that may have left orphaned clients
- When encountering "Cannot read properties of undefined" errors related to account access
- As part of database maintenance to ensure referential integrity

## Post-Cleanup

After running the script successfully:

1. All clients will have valid `account_id` references
2. The client portal will work correctly for all users
3. Account-based filtering and permissions will function properly
4. No more TypeError exceptions related to missing account data

## Troubleshooting

### Common Issues

1. **Local Supabase not running**:
   ```
   Error fetching orphaned clients: network error
   ```
   **Solution**: Ensure your local Supabase instance is running:
   ```bash
   cd db/bba
   supabase start
   ```

2. **Permission errors** (if RLS gets re-enabled):
   ```
   Error creating account: insufficient_privilege
   ```
   **Solution**: The script uses anon key and requires RLS to be disabled for `clients` and `accounts` tables

3. **Connection refused**:
   ```
   Error: connect ECONNREFUSED 127.0.0.1:54321
   ```
   **Solution**: Check that Supabase is running on the correct port (54321)

### Verification

To manually verify the cleanup worked:

```sql
-- Check for any remaining orphaned clients
SELECT id, full_name, email, account_id 
FROM clients 
WHERE account_id IS NULL OR account_id = '';

-- Verify account references exist
SELECT c.id, c.full_name, c.account_id, a.name as account_name
FROM clients c
LEFT JOIN accounts a ON c.account_id = a.id
WHERE a.id IS NULL;
```

Both queries should return zero rows after successful cleanup.