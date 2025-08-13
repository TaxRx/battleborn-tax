# ALLOCATION_SUMMARY Type Migration Guide

## Overview
This document outlines the complete process for implementing a separate `ALLOCATION_SUMMARY` enum type for allocation reports in the future. Currently, both Research Reports and Allocation Reports use `RESEARCH_SUMMARY` type but save to different columns.

## Current State
- **Database Enum**: `rd_report_type AS ENUM ('RESEARCH_DESIGN', 'RESEARCH_SUMMARY', 'FILING_GUIDE')`
- **Current Logic**:
  - Research Report → `RESEARCH_SUMMARY` type, saves to `generated_html` column
  - Allocation Report → `RESEARCH_SUMMARY` type, saves to `allocation_report` column

## Target State
- **New Enum**: `rd_report_type AS ENUM ('RESEARCH_DESIGN', 'RESEARCH_SUMMARY', 'FILING_GUIDE', 'ALLOCATION_SUMMARY')`
- **New Logic**:
  - Research Report → `RESEARCH_SUMMARY` type, saves to `generated_html` column
  - Allocation Report → `ALLOCATION_SUMMARY` type, saves to `generated_html` column

## Migration Complexity Assessment

### 1. Database Schema Changes

#### Step 1: Alter the Enum Type
```sql
-- Add new enum value
ALTER TYPE public.rd_report_type ADD VALUE 'ALLOCATION_SUMMARY';
```

#### Step 2: Data Migration
```sql
-- Update existing allocation reports to use new type
-- This requires identifying records that have allocation_report content
UPDATE rd_reports 
SET type = 'ALLOCATION_SUMMARY',
    generated_html = allocation_report,
    allocation_report = NULL
WHERE type = 'RESEARCH_SUMMARY' 
AND allocation_report IS NOT NULL 
AND generated_html IS NULL;
```

#### Step 3: Handle Conflicts
Records that have both `generated_html` (research report) and `allocation_report` content need special handling:
```sql
-- Create separate records for allocation reports where both exist
INSERT INTO rd_reports (
    business_year_id, business_id, type, generated_html, 
    generated_text, ai_version, created_at, updated_at
)
SELECT 
    business_year_id, business_id, 'ALLOCATION_SUMMARY', allocation_report,
    'Migrated allocation report', ai_version, NOW(), NOW()
FROM rd_reports 
WHERE type = 'RESEARCH_SUMMARY' 
AND allocation_report IS NOT NULL 
AND generated_html IS NOT NULL;

-- Clear allocation_report column after migration
UPDATE rd_reports 
SET allocation_report = NULL 
WHERE type = 'RESEARCH_SUMMARY' 
AND allocation_report IS NOT NULL;
```

### 2. Code Changes Required

#### Files to Update (10+ locations identified):

**Core Business Logic:**
1. **`src/modules/tax-calculator/components/RDTaxWizard/steps/ReportsStep.tsx`**
   - Update `mapDocumentTypeToEnum()` function:
     ```typescript
     case 'allocation_report':
       return 'ALLOCATION_SUMMARY'; // Changed from RESEARCH_SUMMARY
     ```

2. **`src/types/rdTaxCredit.ts`**
   - Update type definition:
     ```typescript
     export type RDReportType = 'RESEARCH_DESIGN' | 'RESEARCH_SUMMARY' | 'FILING_GUIDE' | 'ALLOCATION_SUMMARY';
     ```

**Client Portal Logic:**
3. **`src/pages/ClientPortal.tsx`** (3+ locations)
   - Update document loading logic (lines 1049, 1182, 1202, 1232, 1246, 1338):
     ```typescript
     // Replace complex allocation report logic
     const queryType = documentType === 'filing_guide' ? 'FILING_GUIDE' : 
                      documentType === 'allocation_report' ? 'ALLOCATION_SUMMARY' :
                      'RESEARCH_SUMMARY';
     ```
   - Remove special allocation report filtering logic (lines 1175-1195)
   - Simplify queries to use standard type-based lookup

**Service Layer:**
4. **`src/modules/tax-calculator/services/rdReportService.ts`**
   - Update all methods that default to `'RESEARCH_SUMMARY'` type
   - Add specific methods for allocation reports if needed

**Migration Scripts:**
5. **`scripts/backfill-reports.ts`**
   - Update type used for allocation reports (line 461):
     ```typescript
     type: 'ALLOCATION_SUMMARY', // Changed from RESEARCH_SUMMARY
     ```

**Database Documentation:**
6. **`docs/current-database-schema.sql`**
   - Update enum definition (line 371)

**Migration Files:**
7. **`supabase/_legacy-migrations/20241220000000_create_rd_tax_credit_schema.sql`**
8. **`supabase/_legacy-migrations/20250731245000_create_rd_complete_accurate.sql`**  
9. **`supabase/_legacy-migrations/20250711173926_sync_taxrx.sql`**
   - Update enum definitions in all migration files

### 3. Implementation Strategy

#### Phase 1: Preparation
1. **Backup Strategy**: Full database backup before migration
2. **Testing Environment**: Test migration on copy of production data
3. **Rollback Plan**: Script to revert enum and data changes

#### Phase 2: Migration Execution
1. **Add Enum Value**: `ALTER TYPE` to add `ALLOCATION_SUMMARY`
2. **Deploy Code Changes**: Update all code references simultaneously
3. **Data Migration**: Run data migration scripts
4. **Verification**: Ensure all allocation reports load correctly

#### Phase 3: Cleanup
1. **Remove Deprecated Logic**: Clean up special allocation report handling
2. **Update Documentation**: Reflect new data model
3. **Performance Testing**: Verify query performance

### 4. Risk Assessment

#### High Risk Items:
- **Data Loss**: Risk if migration script incorrectly handles existing data
- **Downtime**: Schema changes require application restart
- **Query Failures**: Existing code may break if not updated simultaneously

#### Medium Risk Items:
- **Performance Impact**: New queries may have different performance characteristics
- **Client Portal**: Complex allocation report logic needs careful testing

#### Low Risk Items:
- **Enum Addition**: Adding enum values is generally safe
- **Type Definitions**: TypeScript updates are compile-time safe

### 5. Testing Checklist

#### Database Tests:
- [ ] Enum addition works without breaking existing data
- [ ] Data migration preserves all allocation report content  
- [ ] No research reports are accidentally modified
- [ ] All foreign key relationships remain intact

#### Application Tests:
- [ ] Research reports continue to load correctly
- [ ] Allocation reports load with new ALLOCATION_SUMMARY type
- [ ] Client portal displays both document types correctly
- [ ] Admin wizard can release allocation reports
- [ ] No existing functionality is broken

#### Integration Tests:
- [ ] Full end-to-end allocation report generation and release workflow
- [ ] Cross-year allocation report access
- [ ] Multi-business allocation report handling

### 6. Rollback Plan

If migration fails, execute in this order:

```sql
-- 1. Revert data changes
UPDATE rd_reports 
SET allocation_report = generated_html,
    generated_html = NULL,
    type = 'RESEARCH_SUMMARY'
WHERE type = 'ALLOCATION_SUMMARY';

-- 2. Remove duplicated records (if any were created)
DELETE FROM rd_reports 
WHERE type = 'ALLOCATION_SUMMARY' 
AND created_at >= '[MIGRATION_START_TIME]';

-- 3. Cannot remove enum value (PostgreSQL limitation)
-- Requires dropping and recreating the enum if rollback is needed
-- This would require application downtime
```

### 7. Alternative Approaches

#### Option A: Separate Table
Create `rd_allocation_reports` table instead of using shared `rd_reports` table.

**Pros**: Complete separation, no enum complexity  
**Cons**: More complex queries, data duplication

#### Option B: JSON Metadata  
Add metadata field to distinguish report subtypes.

**Pros**: No enum changes needed  
**Cons**: Less type safety, more complex queries

#### Option C: Current Approach (Recommended for now)
Keep current system and use column-based differentiation.

**Pros**: No breaking changes, works with existing data  
**Cons**: Somewhat confusing data model

## Recommendation

**Defer this migration** until there's a compelling business need. The current system works well and this migration introduces significant complexity and risk for minimal functional benefit.

If migration becomes necessary:
1. Plan for 2-4 hours of application downtime
2. Ensure comprehensive testing on production data copy
3. Have experienced DBA review migration scripts
4. Plan migration during low-usage time window

## Implementation Timeline Estimate

- **Planning & Script Development**: 2-3 days
- **Testing & Validation**: 3-4 days  
- **Migration Execution**: 0.5 day (includes downtime)
- **Post-migration Verification**: 1 day
- **Total**: ~1.5 weeks

## Contact

For questions about this migration plan, contact the development team lead or database administrator.