-- Extend rd_reports to support multi-year Billing Reports and metadata snapshots
-- Adds a root year pointer and a JSONB metadata payload to capture selected years,
-- prepayments, and applied referral discounts at save time.

alter table if exists rd_reports
  add column if not exists billing_root_business_year_id uuid references rd_business_years(id) on delete set null,
  add column if not exists billing_meta jsonb;

-- Example structure of billing_meta:
-- {
--   "selected_year_ids": ["<by_uuid>", ...],
--   "prepayments": { "<by_uuid>": 1000, ... },
--   "applied_discounts": { "<by_uuid>": 250, ... }
-- }


