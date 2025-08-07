#!/bin/bash

# Check profiles-accounts relationship (READ-ONLY)
# This script analyzes the current state without making any changes

set -e  # Exit on any error

# Database connection string
DB_CONNECTION="postgresql://postgres:postgres@localhost:54322/postgres"

echo "🔍 Analyzing profiles-accounts relationship (READ-ONLY)..."
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

log "📋 Current database state analysis:"

# Get count of total profiles
total_profiles=$(execute_sql "SELECT COUNT(*) FROM profiles;")
log "Total profiles: $total_profiles"

# Get count of total accounts
total_accounts=$(execute_sql "SELECT COUNT(*) FROM accounts;")
log "Total accounts: $total_accounts"

# Get count of profiles without account_id
profiles_without_account=$(execute_sql "SELECT COUNT(*) FROM profiles WHERE account_id IS NULL;")
log "Profiles without account_id: $profiles_without_account"

# Get count of profiles with invalid account_id
profiles_with_invalid_account=$(execute_sql "
SELECT COUNT(*) 
FROM profiles p 
WHERE p.account_id IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = p.account_id);")
log "Profiles with invalid account_id: $profiles_with_invalid_account"

total_issues=$((profiles_without_account + profiles_with_invalid_account))
log "Total profiles with issues: $total_issues"

if [ "$total_issues" -gt 0 ]; then
    log ""
    log "🔍 Detailed analysis of problematic profiles:"
    
    # Show profiles without account_id
    if [ "$profiles_without_account" -gt 0 ]; then
        log "Profiles without account_id:"
        execute_sql "
        SELECT 
            id, 
            email, 
            role, 
            CASE WHEN is_admin THEN 'Yes' ELSE 'No' END as is_admin,
            created_at
        FROM profiles 
        WHERE account_id IS NULL 
        ORDER BY created_at;
        " | while IFS='|' read -r id email role is_admin created_at; do
            log "  - ID: $id | Email: $email | Role: $role | Admin: $is_admin | Created: $created_at"
        done
    fi
    
    # Show profiles with invalid account_id
    if [ "$profiles_with_invalid_account" -gt 0 ]; then
        log ""
        log "Profiles with invalid account_id:"
        execute_sql "
        SELECT 
            p.id, 
            p.email, 
            p.role, 
            p.account_id,
            CASE WHEN p.is_admin THEN 'Yes' ELSE 'No' END as is_admin,
            p.created_at
        FROM profiles p
        WHERE p.account_id IS NOT NULL 
        AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.id = p.account_id)
        ORDER BY p.created_at;
        " | while IFS='|' read -r id email role account_id is_admin created_at; do
            log "  - ID: $id | Email: $email | Role: $role | Invalid Account ID: $account_id | Admin: $is_admin | Created: $created_at"
        done
    fi
    
    log ""
    log "📋 What the fix script would do:"
    log "  1. Create $total_issues new account records"
    log "  2. Link each problematic profile to its new account"
    log "  3. Account types would be determined by profile role:"
    log "     - Admin profiles → 'admin' account type"
    log "     - Partner profiles → 'partner' account type"  
    log "     - Operator profiles → 'operator' account type"
    log "     - Other profiles → 'client' account type"
    log ""
    log "To execute the fixes, run: ./fix_profiles_accounts.sh"
else
    log "✅ All profiles have valid account relationships!"
fi

log ""
log "📊 Current account distribution:"
execute_sql "
SELECT 
    type,
    COUNT(*) as count,
    status
FROM accounts 
GROUP BY type, status
ORDER BY type, status;
" | while IFS='|' read -r type count status; do
    log "  - $type ($status): $count accounts"
done

log ""
log "🏁 Analysis completed."