# Data Migration Plan: Main Branch to Epic3 Schema

## Migration Overview

**Objective**: Safely migrate production data from Main branch schema to Epic3 unified schema while preserving all business-critical information.

**Approach**: Create SQL transformation scripts that map Main branch data structures to Epic3's modernized schema.

## Critical Data Mapping Analysis

### 1. User Authentication & Management

#### Main Branch Structure (Assumed)
```sql
-- Main likely has:
public.users (id, email, name, role, etc.)
profiles (id, user_id, additional_fields)
```

#### Epic3 Target Structure
```sql
auth.users (id, email, created_at, etc.) -- Supabase managed
accounts (id, name, type, created_at, updated_at)
profiles (id, email, full_name, role, account_id, is_admin)
```

#### Migration Strategy
```sql
-- Step 1: Preserve auth.users data (already in Supabase)
-- Step 2: Create accounts for each user type
-- Step 3: Update profiles to link to accounts
-- Step 4: Migrate role information correctly

CREATE OR REPLACE FUNCTION migrate_user_data() RETURNS void AS $$
DECLARE
    user_record RECORD;
    new_account_id UUID;
BEGIN
    -- For each user in main branch structure
    FOR user_record IN 
        SELECT * FROM main_users_backup
    LOOP
        -- Create corresponding account
        INSERT INTO accounts (name, type, created_at, updated_at)
        VALUES (
            user_record.name,
            CASE 
                WHEN user_record.role = 'admin' THEN 'admin'::account_type
                WHEN user_record.role = 'affiliate' THEN 'affiliate'::account_type
                WHEN user_record.role = 'client' THEN 'client'::account_type
                WHEN user_record.role = 'partner' THEN 'platform'::account_type
                ELSE 'client'::account_type
            END,
            user_record.created_at,
            user_record.updated_at
        )
        RETURNING id INTO new_account_id;
        
        -- Update or create profile linking to account
        INSERT INTO profiles (id, email, full_name, role, account_id, is_admin)
        VALUES (
            user_record.id,
            user_record.email,
            user_record.name,
            user_record.role,
            new_account_id,
            user_record.role = 'admin'
        )
        ON CONFLICT (id) DO UPDATE SET
            account_id = new_account_id,
            role = user_record.role,
            is_admin = user_record.role = 'admin';
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 2. Client Management System

#### Main Branch → Epic3 Migration

**Challenge**: Main branch likely has simpler client structure, Epic3 has multi-user client access.

#### Migration Strategy
```sql
-- Preserve all client data and create multi-user access structure
CREATE OR REPLACE FUNCTION migrate_client_data() RETURNS void AS $$
DECLARE
    client_record RECORD;
    owner_user_id UUID;
BEGIN
    -- For each client in main branch
    FOR client_record IN 
        SELECT * FROM main_clients_backup
    LOOP
        -- Preserve client record (should be compatible)
        INSERT INTO clients SELECT * FROM client_record
        ON CONFLICT (id) DO UPDATE SET
            name = client_record.name,
            -- Update other fields as needed
            updated_at = NOW();
        
        -- Create owner relationship in client_users table
        -- Find the primary user for this client
        SELECT user_id INTO owner_user_id 
        FROM main_user_client_relationships 
        WHERE client_id = client_record.id 
        LIMIT 1;
        
        -- Create client_users relationship
        INSERT INTO client_users (client_id, user_id, role, is_active)
        VALUES (client_record.id, owner_user_id, 'owner', true)
        ON CONFLICT (client_id, user_id) DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

### 3. Tax Calculations & Proposals

#### Epic3 Advantage: Enhanced calculation engine
**Strategy**: Preserve all existing data, upgrade calculation models where possible.

```sql
-- Migrate tax calculations
CREATE OR REPLACE FUNCTION migrate_tax_data() RETURNS void AS $$
BEGIN
    -- Tax calculations should be largely compatible
    -- Epic3 has enhanced fields, so we preserve existing and set defaults for new fields
    
    INSERT INTO tax_calculations (
        id, user_id, client_id, 
        -- Core calculation fields from main
        current_income, filing_status, deductions,
        -- Epic3 enhanced fields with defaults
        calculation_version, enhanced_strategies,
        created_at, updated_at
    )
    SELECT 
        id, user_id, client_id,
        current_income, filing_status, deductions,
        '2.0', '{}', -- Default enhanced fields
        created_at, updated_at
    FROM main_tax_calculations_backup
    ON CONFLICT (id) DO UPDATE SET
        calculation_version = '2.0',
        updated_at = NOW();
        
    -- Migrate tax proposals similarly
    INSERT INTO tax_proposals SELECT * FROM main_tax_proposals_backup
    ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 4. Partner/Platform Migration

#### Main Challenge: Partners → Accounts transformation
Epic3 eliminated separate partners table, using unified accounts.

```sql
-- Partners already migrated to accounts in Epic3 migration 20250717220752
-- For main branch data, need to:
-- 1. Identify partner records in main branch
-- 2. Ensure they become accounts with type 'platform'
-- 3. Update all FK references

CREATE OR REPLACE FUNCTION migrate_partner_data() RETURNS void AS $$
DECLARE
    partner_record RECORD;
    new_account_id UUID;
BEGIN
    -- For each partner in main branch backup
    FOR partner_record IN 
        SELECT * FROM main_partners_backup
    LOOP
        -- Create account record
        INSERT INTO accounts (name, type, logo_url, stripe_customer_id, created_at, updated_at)
        VALUES (
            partner_record.company_name,
            'platform'::account_type,
            partner_record.logo_url,
            partner_record.stripe_customer_id,
            partner_record.created_at,
            partner_record.updated_at
        )
        RETURNING id INTO new_account_id;
        
        -- Update all client references
        UPDATE clients 
        SET partner_id = new_account_id 
        WHERE partner_id = partner_record.id;
        
        -- Migrate any partner-specific tool subscriptions
        INSERT INTO account_tool_access (account_id, tool_id, access_level, granted_at)
        SELECT new_account_id, tool_id, access_level, created_at
        FROM main_partner_tool_subscriptions_backup
        WHERE partner_id = partner_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
```

## Production Data Migration Execution Plan

### Phase 1: Pre-Migration Preparation

#### 1.1 Production Data Backup
```bash
# Create comprehensive backup of production database
pg_dump "$MAIN_PROD_DATABASE_URL" > production_backup_$(date +%Y%m%d_%H%M%S).sql

# Create table-specific backups for critical data
pg_dump -t users -t clients -t tax_calculations -t tax_proposals \
  "$MAIN_PROD_DATABASE_URL" > critical_data_backup.sql
```

#### 1.2 Data Analysis & Validation
```sql
-- Analyze production data structure
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Count critical records
SELECT 
    (SELECT COUNT(*) FROM users) as user_count,
    (SELECT COUNT(*) FROM clients) as client_count,
    (SELECT COUNT(*) FROM tax_calculations) as calc_count,
    (SELECT COUNT(*) FROM tax_proposals) as proposal_count;
```

### Phase 2: Migration Staging Environment Testing

#### 2.1 Create Migration Test Environment
```bash
# Set up staging environment with Epic3 schema
cd db/bba
supabase start
supabase db reset  # Apply Epic3 migrations

# Import production data backup for testing
psql "$STAGING_DATABASE_URL" < production_backup.sql
```

#### 2.2 Execute Migration Scripts
```sql
-- Execute in order:
\i migrate_user_data.sql
\i migrate_client_data.sql
\i migrate_tax_data.sql
\i migrate_partner_data.sql

-- Validate migration results
SELECT 'Users migrated:', COUNT(*) FROM profiles WHERE account_id IS NOT NULL;
SELECT 'Clients migrated:', COUNT(*) FROM clients;
SELECT 'Calculations migrated:', COUNT(*) FROM tax_calculations;
```

### Phase 3: Production Migration Execution

#### 3.1 Migration Window Planning
- **Estimated Downtime**: 2-4 hours
- **Optimal Time**: Weekend during low usage
- **Rollback Time**: 30 minutes if needed
- **Full Recovery Time**: 1 hour maximum

#### 3.2 Migration Execution Steps
```bash
# 1. Enable maintenance mode
echo "Maintenance mode ON"

# 2. Final production backup
pg_dump "$PROD_DATABASE_URL" > final_backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Apply Epic3 schema migrations
supabase db push --include-functions --include-triggers

# 4. Execute data migration
psql "$PROD_DATABASE_URL" < production_migration_scripts.sql

# 5. Validate migration
psql "$PROD_DATABASE_URL" < migration_validation.sql

# 6. Update application configuration
# 7. Disable maintenance mode
echo "Maintenance mode OFF"
```

## Data Validation & Testing

### Critical Validation Checks

#### 1. User Authentication
```sql
-- Verify all users can authenticate
SELECT 
    p.email,
    p.account_id IS NOT NULL as has_account,
    au.id IS NOT NULL as has_auth
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id;
```

#### 2. Client Access
```sql
-- Verify client-user relationships
SELECT 
    c.name as client_name,
    COUNT(cu.user_id) as user_count,
    COUNT(CASE WHEN cu.role = 'owner' THEN 1 END) as owner_count
FROM clients c
LEFT JOIN client_users cu ON c.id = cu.client_id
GROUP BY c.id, c.name;
```

#### 3. Tax Calculation Integrity
```sql
-- Verify calculation data integrity
SELECT 
    COUNT(*) as total_calculations,
    COUNT(CASE WHEN current_income > 0 THEN 1 END) as valid_income,
    COUNT(CASE WHEN calculation_version IS NOT NULL THEN 1 END) as versioned
FROM tax_calculations;
```

## Risk Mitigation

### High-Risk Scenarios & Solutions

1. **Data Loss During Migration**
   - **Mitigation**: Multiple backup layers, staged migration with validation
   - **Recovery**: Immediate restore from final backup

2. **Authentication Breaks**
   - **Mitigation**: Test auth flows extensively in staging
   - **Recovery**: Rollback to previous auth system, user communication

3. **Client Data Corruption**
   - **Mitigation**: Table-level validation, client data integrity checks
   - **Recovery**: Selective restore of client data from backup

4. **Tax Calculation Accuracy Issues**
   - **Mitigation**: Preserve all calculation data, validate results against known test cases
   - **Recovery**: Immediate rollback if calculations don't match

### Rollback Procedures

#### Immediate Rollback (< 30 minutes)
```bash
# 1. Enable maintenance mode
# 2. Restore from final backup
pg_restore -d "$PROD_DATABASE_URL" final_backup.sql
# 3. Revert application configuration
# 4. Validate system functionality
# 5. Disable maintenance mode
```

#### Partial Rollback (Selective)
```sql
-- Restore specific tables if needed
DROP TABLE problematic_table;
pg_restore -t problematic_table final_backup.sql
```

## Success Criteria

### Technical Validation
- [ ] All user accounts accessible and functional
- [ ] All client data preserved and accessible
- [ ] Tax calculations produce identical results
- [ ] Multi-user access functions correctly
- [ ] No data loss or corruption detected
- [ ] Performance meets or exceeds baseline

### Business Validation
- [ ] Users can log in and access their data
- [ ] Clients can view their tax information
- [ ] Tax calculations are accurate and complete
- [ ] All proposals and documents accessible
- [ ] Administrative functions work correctly

## Post-Migration Monitoring

### First 24 Hours
- Monitor authentication success/failure rates
- Track database performance metrics
- Validate critical business workflows
- Monitor error logs for migration-related issues

### First Week
- User feedback collection
- Performance optimization if needed
- Data integrity spot checks
- Migration documentation updates

---

**⚠️ APPROVAL REQUIRED**: This data migration plan requires explicit approval before execution due to production data modification risks.