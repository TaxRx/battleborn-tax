# Unified Database Migration Strategy

## Strategy Overview

**Primary Approach**: Adopt Epic3 schema as the foundation while preserving critical production data and functionality from Main branch.

**Rationale**: Epic3 has a cleaner, more modern architecture with better separation of concerns and more robust multi-user access patterns.

## Migration Phases

### Phase 1: Pre-Merge Preparation ✅ COMPLETED
- [x] Database dumps from both branches
- [x] Schema analysis and comparison
- [x] Migration timeline analysis
- [x] Risk assessment completed

### Phase 2: Schema Reconciliation Strategy

#### 2.1 Database Architecture Decision Matrix

| Component | Epic3 Approach | Main Approach | **CHOSEN** | Rationale |
|-----------|----------------|---------------|------------|-----------|
| User Auth | auth.users + accounts | public.users + profiles | **Epic3** | Cleaner, follows Supabase best practices |
| Account Management | Unified accounts table | Separate partner/client tables | **Epic3** | More scalable, single source of truth |
| Client Access | Multi-user via client_users | Single user model | **Epic3** | Modern multi-tenant requirements |
| Tax Engine | Enhanced calculator | Basic calculator | **Epic3** | Core business logic improvements |
| RLS Policies | Helper function based | Direct table references | **Epic3** | More maintainable, cleaner code |
| Directory Structure | /db/bba/supabase/ | /supabase/ | **Epic3** | Consistent with current development |

#### 2.2 Migration File Reconciliation

**Epic3 Migrations to Preserve (All 58)**:
- Complete migration history from 001 to 058
- All structural improvements and optimizations
- Modern RLS policy implementations

**Main Branch Analysis Needed**:
- Identify the 3 additional migrations (59-61 equivalent)
- Determine if they contain production-critical changes
- Extract any production-specific configurations

#### 2.3 Data Migration Planning

**Production Data Preservation**:
```sql
-- 1. Backup existing production data
-- 2. Map main branch data to epic3 schema
-- 3. Create transformation queries for:
--    - User account migration
--    - Client relationship mapping  
--    - Tax calculation data preservation
--    - Document and proposal migration
```

### Phase 3: Code Integration Strategy

#### 3.1 Conflict Resolution Priority Order

1. **Database Layer** (Epic3 wins)
   - Keep Epic3 database schema
   - Keep Epic3 migration files
   - Keep Epic3 RLS policies

2. **Authentication System** (Epic3 wins)
   - Epic3 auth flow
   - Epic3 user management
   - Epic3 role-based access

3. **Tax Calculation Engine** (Epic3 wins)
   - Preserve all Epic3 enhancements
   - Keep Epic3 calculation models
   - Maintain Epic3 API interfaces

4. **Business Logic** (Merge with Epic3 priority)
   - Epic3 client management
   - Epic3 proposal system
   - Main branch: preserve any unique features

5. **UI Components** (Merge both)
   - Epic3 modern components
   - Main branch: preserve any unique features
   - Adapt main components to Epic3 data models

#### 3.2 Environment Configuration

**Supabase Configuration**:
- Use Epic3 directory structure: `/db/bba/supabase/`
- Update environment variables to Epic3 format
- Preserve production database connection strings
- Update any main branch components to use Epic3 env vars

### Phase 4: Merge Execution Plan

#### 4.1 Pre-Merge Checklist
- [ ] All database analysis complete
- [ ] Migration strategy documented
- [ ] Backup procedures verified
- [ ] Rollback plan prepared

#### 4.2 Merge Execution Steps

1. **Execute Git Merge**:
   ```bash
   git merge main
   ```

2. **Immediate Conflict Categories Expected**:
   - Database configuration files (.env, config files)
   - Migration file conflicts
   - Package.json dependencies
   - Component file conflicts
   - Service layer conflicts

3. **Conflict Resolution Order**:
   1. Environment and configuration files (Epic3 format)
   2. Database migration files (Epic3 structure)
   3. Core authentication modules (Epic3 implementation)
   4. Client management system (Epic3 multi-user model)
   5. Tax calculation modules (Epic3 enhanced engine)
   6. API endpoints and services (adapt to Epic3 schema)
   7. UI components (merge both, prioritize Epic3 patterns)

#### 4.3 Post-Merge Validation

**Database Validation**:
- [ ] All Epic3 migrations apply cleanly
- [ ] RLS policies function correctly
- [ ] Multi-user access works as expected
- [ ] Tax calculations produce correct results

**Application Validation**:
- [ ] Authentication flows work
- [ ] Client management functions
- [ ] Tax calculator operates correctly
- [ ] Dashboard displays data properly
- [ ] All API endpoints respond correctly

### Phase 5: Production Migration Planning

#### 5.1 Production Database Migration

**Critical Requirement**: Zero downtime migration of production data

**Migration Steps**:
1. Create production data backup
2. Analyze production data against Epic3 schema
3. Create data transformation scripts
4. Test migration on staging environment
5. Execute production migration during maintenance window

#### 5.2 Production Data Mapping

**User Accounts Migration**:
```sql
-- Map main branch users to Epic3 auth.users + accounts structure
-- Preserve all user relationships and permissions
-- Migrate partner relationships to accounts table
```

**Client Data Migration**:
```sql
-- Preserve all client information
-- Migrate to Epic3 multi-user client access model
-- Preserve all tax calculations and proposals
```

## Risk Mitigation Strategies

### High-Risk Areas & Mitigation

1. **Data Loss Risk**:
   - Multiple backup strategies
   - Staged migration with validation
   - Rollback procedures documented

2. **Authentication Breaking**:
   - Test auth flows extensively
   - Preserve auth.users relationships
   - Validate RLS policies

3. **Tax Calculation Accuracy**:
   - Preserve Epic3 calculation engine completely
   - Validate calculations against known test cases
   - Regression testing required

### Rollback Procedures

**If Migration Fails**:
1. Revert to v-staging-baseline tag
2. Restore from staging branch backup
3. Re-analyze conflicts with more granular approach

**If Production Issues Occur**:
1. Immediate rollback to previous production state
2. Data restoration from backups
3. Investigate issues in staging environment

## Success Criteria

### Technical Success Metrics
- [ ] All database migrations apply without errors
- [ ] All tests pass (authentication, client management, tax calculations)
- [ ] No data loss during migration
- [ ] Performance meets or exceeds current levels
- [ ] All Epic3 enhancements preserved

### Business Success Metrics
- [ ] All user accounts accessible
- [ ] All client data intact and accessible
- [ ] Tax calculations produce accurate results
- [ ] Multi-user access functions correctly
- [ ] Production deployment successful

## Timeline Estimates

- **Phase 2-3 (Schema + Code Integration)**: 2-3 days
- **Phase 4 (Merge Execution)**: 1-2 days  
- **Phase 5 (Production Migration)**: 1 day
- **Total Estimated Duration**: 4-6 days

## Approval Required

⚠️ **CRITICAL**: Before proceeding with any database schema changes or migrations, explicit user approval is required per project guidelines.

## Next Immediate Steps

1. Create detailed data migration plan (Task 9)
2. Execute git merge main (Task 10)
3. Begin systematic conflict resolution

---

*This strategy prioritizes Epic3's modern architecture while ensuring complete preservation of production data and functionality.*