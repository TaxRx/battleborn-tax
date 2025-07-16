# Database Schema Overview - Epic 3 Admin Platform

**Document Type**: Database Specification  
**Phase**: All Phases  
**Last Updated**: 2025-07-16

## Schema Extension Strategy

Epic 3 extends the existing Battle Born Capital Advisors database schema with admin-specific tables while preserving all existing relationships and functionality.

## New Tables Required

### Account Activity Logging
**Purpose**: Track all administrative actions for audit compliance
**Phase**: 1 (Account Management)

```sql
CREATE TABLE account_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),          -- Who performed the action
  account_id UUID REFERENCES accounts(id),        -- Which account was affected
  activity_type VARCHAR NOT NULL,                 -- Type of activity (CREATE, UPDATE, DELETE)
  target_type VARCHAR NOT NULL,                   -- Target type (account, tool, profile, invoice, user)
  target_id UUID NOT NULL,                        -- ID of the affected entity
  description TEXT NOT NULL,                      -- Human-readable description
  metadata JSONB,                                 -- Additional context data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_account_activities_actor ON account_activities(actor_id);
CREATE INDEX idx_account_activities_account ON account_activities(account_id);
CREATE INDEX idx_account_activities_created_at ON account_activities(created_at);
CREATE INDEX idx_account_activities_type ON account_activities(activity_type, target_type);
```

### Invoice Management
**Purpose**: Centralized invoice management for admin operations
**Phase**: 4 (Billing Integration)

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  stripe_invoice_id VARCHAR UNIQUE,               -- Stripe invoice reference
  amount_cents INTEGER NOT NULL,                  -- Amount in cents
  currency VARCHAR DEFAULT 'USD',                 -- Currency code
  status VARCHAR NOT NULL,                        -- draft, open, paid, void, uncollectible
  due_date DATE,                                  -- Payment due date
  paid_at TIMESTAMP WITH TIME ZONE,              -- Payment timestamp
  description TEXT,                               -- Invoice description
  line_items JSONB,                              -- Invoice line items
  metadata JSONB,                                -- Additional invoice data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes for performance
CREATE INDEX idx_invoices_account ON invoices(account_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_stripe ON invoices(stripe_invoice_id);
```

### Subscription Management
**Purpose**: Centralized subscription management for admin operations
**Phase**: 4 (Billing Integration)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES accounts(id) NOT NULL,
  stripe_subscription_id VARCHAR UNIQUE,          -- Stripe subscription reference
  status VARCHAR NOT NULL,                        -- active, past_due, canceled, unpaid
  plan_name VARCHAR NOT NULL,                     -- Subscription plan name
  plan_id VARCHAR,                                -- Stripe plan/price ID
  amount_cents INTEGER NOT NULL,                  -- Subscription amount in cents
  billing_interval VARCHAR NOT NULL,              -- month, year
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,                                 -- Additional subscription data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- Indexes for performance
CREATE INDEX idx_subscriptions_account ON subscriptions(account_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_period ON subscriptions(current_period_end);
```

## Existing Table Extensions

### Enhanced Tool-Account Assignments
**Purpose**: Add admin management capabilities to existing tool assignments
**Phase**: 2 (Tool Management)

```sql
-- Extend existing account_tool_access table
ALTER TABLE account_tool_access 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_account_tool_access_expires ON account_tool_access(expires_at);
CREATE INDEX IF NOT EXISTS idx_account_tool_access_created_by ON account_tool_access(created_by);
```

### Profile Management Enhancement
**Purpose**: Enhanced profile management for admin operations
**Phase**: 3 (Profile Management)

```sql
-- Extend existing profiles table if needed
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active',
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login_at);
```

## Data Relationships

### Existing Relationships (Preserved)
```
accounts (existing)
├── profiles (existing)
├── account_tool_access (existing, extended)
└── account_activities (new)

profiles (existing, extended)
├── account_activities.actor_id (new)
├── invoices.created_by (new)
└── subscriptions.created_by (new)
```

### New Relationships
```
invoices (new)
├── account_id → accounts.id
└── created_by → profiles.id

subscriptions (new)
├── account_id → accounts.id
└── created_by → profiles.id

account_activities (new)
├── actor_id → profiles.id
├── account_id → accounts.id
└── target_id → various tables (polymorphic)
```

## Migration Strategy

### Phase 1: Account Management Foundation
```sql
-- 001_create_account_activities.sql
CREATE TABLE account_activities (
  -- table definition above
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION log_account_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Trigger logic for automatic activity logging
END;
$$ LANGUAGE plpgsql;
```

### Phase 2: Tool Management Extensions
```sql
-- 002_extend_tool_access.sql
ALTER TABLE account_tool_access 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
```

### Phase 3: Profile Management Extensions
```sql
-- 003_extend_profiles.sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'active';
```

### Phase 4: Billing Integration
```sql
-- 004_create_billing_tables.sql
CREATE TABLE invoices (
  -- table definition above
);

CREATE TABLE subscriptions (
  -- table definition above
);
```

## Performance Considerations

### Indexing Strategy
- **Primary Access Patterns**: Account-based queries (account_id indexes)
- **Administrative Queries**: Activity logging and filtering
- **Reporting Queries**: Date-based and status-based filtering
- **Stripe Integration**: Stripe ID lookups

### Query Optimization
```sql
-- Optimized admin dashboard query
SELECT 
  a.id, a.name, a.type,
  COUNT(p.id) as profile_count,
  COUNT(ata.tool_id) as tool_count,
  MAX(aa.created_at) as last_activity
FROM accounts a
LEFT JOIN profiles p ON a.id = p.account_id
LEFT JOIN account_tool_access ata ON a.id = ata.account_id
LEFT JOIN account_activities aa ON a.id = aa.account_id
WHERE a.type != 'admin'
GROUP BY a.id, a.name, a.type
ORDER BY last_activity DESC;
```

### Data Retention
- **Account Activities**: Retention policy (e.g., 2 years)
- **Invoice Data**: Permanent retention for tax compliance
- **Subscription History**: Permanent retention for billing compliance

## Data Integrity

### Foreign Key Constraints
All new tables maintain referential integrity with existing schema:
- `account_activities.actor_id → profiles.id`
- `account_activities.account_id → accounts.id`
- `invoices.account_id → accounts.id`
- `subscriptions.account_id → accounts.id`

### Validation Rules
```sql
-- Status validation for invoices
ALTER TABLE invoices 
ADD CONSTRAINT check_invoice_status 
CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible'));

-- Status validation for subscriptions
ALTER TABLE subscriptions 
ADD CONSTRAINT check_subscription_status 
CHECK (status IN ('active', 'past_due', 'canceled', 'unpaid'));
```

### Audit Triggers
```sql
-- Automatic activity logging for account changes
CREATE TRIGGER account_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON accounts
  FOR EACH ROW EXECUTE FUNCTION log_account_activity();
```

## Rollback Procedures

### Phase 1 Rollback
```sql
-- Remove account activities table
DROP TRIGGER IF EXISTS account_activity_log ON accounts;
DROP FUNCTION IF EXISTS log_account_activity();
DROP TABLE IF EXISTS account_activities;
```

### Phase 2 Rollback
```sql
-- Remove tool access extensions
ALTER TABLE account_tool_access 
DROP COLUMN IF EXISTS expires_at,
DROP COLUMN IF EXISTS created_by;
```

### Phase 4 Rollback
```sql
-- Remove billing tables
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS invoices;
```

---

**Database Ready**: This schema extension provides comprehensive admin platform capabilities while preserving all existing Battle Born Capital Advisors database functionality and relationships.