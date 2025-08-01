# Comprehensive Database Table Comparison: Epic3 vs Main Production

## Summary Statistics
- **Epic3 Total Tables**: 102 tables
- **Main Production Total Tables**: 71 tables  
- **Tables Only in Main**: 18 tables
- **Tables Only in Epic3**: 43 tables
- **Common Tables**: 53 tables
- **Epic3 has 31 more tables** than Main Production

---

## 1. Tables Only in Main Production Database (18 tables)

These are production-specific tables that Epic3 doesn't have:

### R&D Credit Enhanced Features
- `form_6765_overrides` - Form 6765 tax form overrides
- `rd_billable_time_summary` - R&D billable time tracking
- `rd_client_portal_tokens` - Client portal authentication tokens
- `rd_document_links` - Document linking system
- `rd_federal_credit` - Federal R&D credit calculations
- `rd_procedure_analysis` - R&D procedure analysis
- `rd_procedure_research_links` - Links between procedures and research
- `rd_qc_document_controls` - Quality control for documents
- `rd_signature_records` - Digital signature records
- `rd_signatures` - Digital signatures
- `rd_state_calculations_full` - Extended state calculations
- `rd_state_credit_configs` - State credit configurations
- `rd_state_proforma_data` - State proforma data
- `rd_state_proforma_lines` - State proforma line items
- `rd_state_proformas` - State proforma reports
- `rd_support_documents` - Supporting documents for R&D

### User Management
- `user_preferences` - User preference settings
- `users` - Main user table (vs Epic3's auth.users approach)

**Impact**: Main has more sophisticated R&D credit processing and document management features that Epic3 lacks.

---

## 2. Tables Only in Epic3 Staging Database (43 tables)

These represent Epic3's advanced architecture and features:

### Account & User Management System
- `account_activities` - Account-level activity tracking
- `account_tool_access` - Tool access permissions by account
- `accounts` - **Central accounts table (Epic3's key innovation)**
- `client_users` - **Multi-user client access (critical feature)**
- `profile_permissions` - Granular profile permissions
- `profile_roles` - Role-based access control
- `profile_sync_conflicts` - Profile synchronization management
- `role_definitions` - Centralized role definitions

### Authentication & Security
- `admin_sessions` - Admin session management
- `login_attempts` - Login attempt tracking
- `mfa_settings` - Multi-factor authentication
- `security_alerts` - Security alert system
- `security_events` - Security event logging
- `invitations` - User invitation system

### Affiliate & Partner Management
- `affiliate_tool_permissions` - Affiliate tool access
- `affiliates` - Affiliate management
- `client_activities` - Client activity tracking
- `client_dashboard_metrics` - Dashboard metrics
- `client_engagement_status` - Client engagement tracking

### Advanced Document Management
- `document_access_logs` - Document access auditing
- `document_comments` - Document commenting system
- `document_files` - Document file management
- `document_folders` - Document organization
- `document_processing_jobs` - Background document processing
- `document_shares` - Document sharing system
- `document_versions` - Document version control

### Billing & Payment System
- `billing_events` - Billing event tracking
- `billing_invoices` - Invoice management
- `invoice_line_items` - Invoice line items
- `invoices` - Invoice system
- `payment_methods` - Payment method storage
- `payments` - Payment processing
- `transactions` - Financial transactions
- `subscription_plans` - Subscription plan definitions
- `subscriptions` - User subscriptions

### Advanced Analytics & Monitoring
- `bulk_operation_results` - Bulk operation tracking
- `bulk_operations` - Bulk operation management
- `feature_usage_tracking` - Feature usage analytics
- `performance_metrics` - System performance tracking
- `platform_usage_metrics` - Platform usage analytics
- `tool_usage_logs` - Tool usage logging
- `tools` - Tool definitions and management

### Development & Testing
- `drf_tmp_test` - Development/testing table

**Impact**: Epic3 represents a significantly more advanced, enterprise-grade system with comprehensive user management, security, billing, and analytics capabilities.

---

## 3. Tables That Are Identical in Both Databases (estimated ~15 tables)

These tables have the same structure and can be migrated directly:

### Tax Strategy Tables (Likely Identical)
- `augusta_rule_details`
- `charitable_donation_details`  
- `convertible_tax_bonds_details`
- `cost_segregation_details`
- `family_management_company_details`
- `hire_children_details`
- `reinsurance_details`
- `strategy_commission_rates`
- `strategy_details`

### R&D Core Tables (Likely Identical)
- `rd_areas`
- `rd_focuses` 
- `rd_roles`
- `rd_research_categories`
- `rd_subcomponents`

**Migration**: These can be copied directly with minimal transformation.

---

## 4. Tables That Exist in Both But Are Different (~38 tables)

### **Critical Differences - High Impact**

#### `profiles` Table
**Epic3 Structure:**
```sql
CREATE TABLE "public"."profiles" (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL,
    full_name text,
    role user_role NOT NULL,
    account_id uuid REFERENCES accounts(id) NOT NULL,
    is_admin boolean DEFAULT false,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now()
);
```

**Main Production Structure:**
```sql  
CREATE TABLE "public"."profiles" (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES users(id),
    email text,
    full_name text,
    -- Missing: account_id, role enum, is_admin
    -- Has different FK structure
);
```

**Key Differences:**
- Epic3 links to `auth.users`, Main links to `public.users`  
- Epic3 has `account_id` (critical for account system)
- Epic3 has proper `user_role` enum, Main uses strings
- Epic3 has `is_admin` boolean

#### `clients` Table  
**Epic3 Structure:**
```sql
CREATE TABLE "public"."clients" (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    account_id uuid REFERENCES accounts(id),
    partner_id uuid, -- References accounts
    has_completed_tax_profile boolean DEFAULT false,
    engagement_status engagement_status DEFAULT 'active',
    -- Additional Epic3 fields
);
```

**Main Production Structure:**
```sql
CREATE TABLE "public"."clients" (
    id uuid PRIMARY KEY,  
    name text NOT NULL,
    user_id uuid REFERENCES users(id),
    -- Missing: account_id, engagement_status enum
    -- Different relationship structure
);
```

**Key Differences:**
- Epic3 uses `account_id` system, Main uses direct `user_id`
- Epic3 has `engagement_status` enum
- Epic3 has `has_completed_tax_profile` moved from profiles
- Different partner relationship structure

### **Medium Impact Differences**

#### `tax_calculations` Table
- Epic3 likely has enhanced calculation fields
- Main has production calculation history
- Both preserve core calculation logic

#### `tax_proposals` Table  
- Epic3 has enhanced proposal workflow
- Main has production proposal data
- Different status enums and workflow states

#### `businesses` Table
- Epic3 has account-based relationships
- Main has user-based relationships
- Different foreign key structures

### **Lower Impact Differences**

#### R&D Tables (25+ tables)
Most R&D tables likely have:
- Similar core structure
- Different relationship patterns (account vs user based)
- Epic3 missing some Main production enhancements
- Main missing some Epic3 workflow improvements

Examples:
- `rd_businesses`, `rd_contractors`, `rd_employees`
- `rd_research_activities`, `rd_selected_activities`
- `rd_business_years`, `rd_contractor_year_data`

---

## Migration Complexity Assessment

### **High Complexity (Requires Custom Scripts)**
1. `profiles` - Fundamental architecture change
2. `clients` - Multi-user access implementation  
3. `tax_calculations` - Enhanced calculation preservation
4. `tax_proposals` - Workflow state migration

### **Medium Complexity (Schema Updates)**
5. All R&D tables - Relationship updates
6. `businesses` - Account system integration
7. `tool_enrollments` - Account-based permissions

### **Low Complexity (Direct Copy)**  
8. Strategy detail tables
9. Reference/lookup tables
10. Most calculation result tables

---

## Recommended Migration Strategy

### Phase 1: Foundation (High Risk)
1. Migrate `users` → `auth.users` + `accounts` + `profiles`
2. Update all FK relationships to use account system
3. Create `client_users` relationships for multi-user access

### Phase 2: Core Business Logic (Medium Risk)  
1. Migrate client and tax calculation data
2. Preserve all production calculation history
3. Update proposal workflows to Epic3 system

### Phase 3: Enhanced Features (Low Risk)
1. Migrate R&D calculation data  
2. Add Epic3's advanced features gradually
3. Enable new Epic3 capabilities

### Phase 4: Production-Specific Features
1. Evaluate Main's R&D enhancements for inclusion
2. Migrate user preferences and customizations
3. Integrate signature and document systems

---

## Data Preservation Requirements

### **Must Preserve from Main Production**
- All user accounts and authentication data
- All client relationships and data
- All tax calculations and proposals  
- All R&D credit calculations and reports
- All document signatures and approvals

### **Must Add from Epic3**
- Account-based architecture
- Multi-user client access
- Enhanced security and audit logging
- Advanced billing and subscription system
- Comprehensive analytics and monitoring

---

**Next Steps**: Create detailed migration scripts for each high-complexity table, starting with the user management system transformation.