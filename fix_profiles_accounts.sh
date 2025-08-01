#!/bin/bash

# Fix profiles-accounts relationship script
# This script ensures every profile has a corresponding account record

set -e  # Exit on any error

# Database connection string
DB_CONNECTION="postgresql://postgres:postgres@localhost:54322/postgres"

echo "🔧 Starting profiles-accounts relationship fix..."
echo "📊 Connecting to database: $DB_CONNECTION"

# Function to execute SQL and return result
execute_sql() {
    local sql="$1"
    psql "$DB_CONNECTION" -t -A -c "$sql"
}

# Function to log with timestamp
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# Step 1: Get all profiles and check their account relationships
log "📋 Analyzing profiles table..."

# Get count of total profiles
total_profiles=$(execute_sql "SELECT COUNT(*) FROM profiles;")
log "Total profiles found: $total_profiles"

# Get count of profiles without account_id
profiles_without_account=$(execute_sql "SELECT COUNT(*) FROM profiles WHERE account_id IS NULL;")
log "Profiles without account_id: $profiles_without_account"

# Get count of profiles with invalid account_id (account doesn't exist)
profiles_with_invalid_account=$(execute_sql "
SELECT COUNT(*) 
FROM profiles p 
WHERE p.account_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = p.account_id);")
log "Profiles with invalid account_id: $profiles_with_invalid_account"

total_to_fix=$((profiles_without_account + profiles_with_invalid_account))
log "Total profiles needing fixes: $total_to_fix"

if [ "$total_to_fix" -eq 0 ]; then
    log "✅ All profiles have valid account relationships. No fixes needed."
    exit 0
fi

# Step 2: Process each profile that needs fixing
log "🔧 Starting fixes..."

# Create a temporary SQL script
temp_sql="/tmp/fix_profiles_accounts_$(date +%s).sql"
cat > "$temp_sql" << 'EOF'
DO $$
DECLARE
    profile_record RECORD;
    new_account_id UUID;
    account_name TEXT;
    account_type TEXT;
    fixed_count INTEGER := 0;
BEGIN
    -- Process profiles without account_id or with invalid account_id
    FOR profile_record IN 
        SELECT p.id, p.email, p.role, p.is_admin, p.account_id,
               CASE WHEN p.account_id IS NOT NULL AND EXISTS(SELECT 1 FROM accounts WHERE id = p.account_id) 
                    THEN false 
                    ELSE true 
               END as needs_fix
        FROM profiles p
        WHERE p.account_id IS NULL 
           OR NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = p.account_id)
    LOOP
        -- Determine account name and type based on profile
        IF profile_record.is_admin = true OR profile_record.role = 'admin' THEN
            account_name := 'Admin Account';
            account_type := 'admin';
        ELSIF profile_record.role = 'partner' THEN
            account_name := COALESCE(profile_record.email, 'Partner Account');
            account_type := 'partner';
        ELSIF profile_record.role = 'operator' THEN
            account_name := COALESCE(profile_record.email, 'Operator Account');
            account_type := 'operator';
        ELSE
            account_name := COALESCE(profile_record.email, 'Client Account');
            account_type := 'client';
        END IF;

        -- Create new account record
        INSERT INTO accounts (name, type, status, created_at, updated_at)
        VALUES (account_name, account_type, 'active', NOW(), NOW())
        RETURNING id INTO new_account_id;

        -- Update profile with new account_id
        UPDATE profiles 
        SET account_id = new_account_id, updated_at = NOW()
        WHERE id = profile_record.id;

        fixed_count := fixed_count + 1;
        
        RAISE NOTICE 'Fixed profile % (%) - Created account % with type %', 
            profile_record.email, profile_record.id, new_account_id, account_type;
    END LOOP;

    RAISE NOTICE 'Total profiles fixed: %', fixed_count;
END $$;
EOF

# Step 3: Execute the fix
log "🚀 Executing database fixes..."
psql "$DB_CONNECTION" -f "$temp_sql"

# Step 4: Verify the fixes
log "✅ Verifying fixes..."

# Check final counts
final_profiles_without_account=$(execute_sql "SELECT COUNT(*) FROM profiles WHERE account_id IS NULL;")
final_profiles_with_invalid_account=$(execute_sql "
SELECT COUNT(*) 
FROM profiles p 
WHERE p.account_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = p.account_id);")

total_remaining_issues=$((final_profiles_without_account + final_profiles_with_invalid_account))

log "Final verification:"
log "  - Profiles without account_id: $final_profiles_without_account"
log "  - Profiles with invalid account_id: $final_profiles_with_invalid_account"
log "  - Total remaining issues: $total_remaining_issues"

# Step 5: Show summary of created accounts
log "📋 Summary of accounts by type:"
execute_sql "
SELECT 
    type,
    COUNT(*) as count,
    MIN(created_at) as first_created,
    MAX(created_at) as last_created
FROM accounts 
WHERE created_at >= CURRENT_DATE
GROUP BY type
ORDER BY type;
" | while IFS='|' read -r type count first_created last_created; do
    log "  - $type: $count accounts (created between $first_created and $last_created)"
done

# Cleanup
rm -f "$temp_sql"

if [ "$total_remaining_issues" -eq 0 ]; then
    log "🎉 SUCCESS: All profiles now have valid account relationships!"
else
    log "⚠️  WARNING: $total_remaining_issues profiles still have issues. Manual investigation may be needed."
    exit 1
fi

log "🏁 Script completed successfully."