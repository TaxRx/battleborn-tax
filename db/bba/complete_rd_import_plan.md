# Complete RD Tables Import Plan

## ✅ Status: READY FOR IMPORT

## Step 1: Apply Schema Migration (REQUIRED FIRST)
Apply the migration to add missing columns to your local database:

```bash
# MUST RUN THIS FIRST - adds missing columns to rd_* and tax_proposals tables
supabase db push  # This will apply migration: 20250729205551_add_missing_rd_table_columns.sql
```

## Step 2: Import Remote Data
After the migration is applied, run the import:

```bash
# This will now work for ALL tables including rd_* tables
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f import_remote_data_with_rd_tables.sql
```

## 🔧 Migration Details
The migration `20250729205551_add_missing_rd_table_columns.sql` adds:

### rd_research_categories
- ✅ `description TEXT`

### rd_areas  
- ✅ `description TEXT`

### rd_focuses
- ✅ `description TEXT`

### rd_businesses (6 new columns)
- ✅ `website TEXT`
- ✅ `image_path TEXT`
- ✅ `naics TEXT` (industry classification)
- ✅ `category_id UUID` (FK to rd_research_categories)
- ✅ `github_token TEXT`
- ✅ `portal_email TEXT`

### rd_business_years (20 new columns)
**Quality Control:**
- ✅ `qc_status TEXT` (pending/approved/rejected)
- ✅ `qc_approved_by UUID` (FK to profiles)
- ✅ `qc_approved_at TIMESTAMP`
- ✅ `qc_notes TEXT`

**Payment Tracking:**
- ✅ `payment_received BOOLEAN`
- ✅ `payment_received_at TIMESTAMP`
- ✅ `payment_amount NUMERIC(15,2)`

**Document Management:**
- ✅ `documents_released BOOLEAN`
- ✅ `documents_released_at TIMESTAMP`
- ✅ `documents_released_by UUID` (FK to profiles)

**QRE Breakdown:**
- ✅ `employee_qre NUMERIC(15,2)`
- ✅ `contractor_qre NUMERIC(15,2)`
- ✅ `supply_qre NUMERIC(15,2)`
- ✅ `qre_locked BOOLEAN`

**Credit Calculations:**
- ✅ `federal_credit NUMERIC(15,2)`
- ✅ `state_credit NUMERIC(15,2)`
- ✅ `credits_locked BOOLEAN`
- ✅ `credits_calculated_at TIMESTAMP`
- ✅ `credits_locked_by UUID` (FK to profiles)
- ✅ `credits_locked_at TIMESTAMP`

### tax_proposals (2 new columns)
- ✅ `affiliate_id UUID`
- ✅ `client_name TEXT`

## 📊 Import Data Summary
- **Total tables**: 30 tables
- **Total records**: 363 INSERT statements
- **File size**: 206KB
- **All rd_* tables**: ✅ INCLUDED
- **Schema compatibility**: ✅ AFTER MIGRATION

## 🚀 Expected Results
After both steps, you will have:
- ✅ All remote RD research data
- ✅ Complete rd_businesses with QC workflow data
- ✅ Full rd_business_years with payment/credit tracking
- ✅ Enhanced tax_proposals with affiliate references
- ✅ All profile and client data from remote system

## ⚠️ Important Notes
1. **MUST apply migration FIRST** - import will fail without the new columns
2. **Transaction wrapped** - import will rollback if any errors occur
3. **Triggers disabled** during import to prevent FK constraint issues
4. **Foreign keys preserved** - all relationships maintained

Ready to proceed\! 🎉
