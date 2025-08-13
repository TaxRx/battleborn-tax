BEGIN;

-- 1) Add per-year state credit toggle (default ON)
ALTER TABLE rd_business_years
ADD COLUMN IF NOT EXISTS include_state_credit boolean NOT NULL DEFAULT true;

-- 2) Create owners table with year-specific ownership
CREATE TABLE IF NOT EXISTS rd_business_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES rd_businesses(id) ON DELETE CASCADE,
  owner_name text NOT NULL,
  ownership_percent numeric(5,2) NOT NULL CHECK (ownership_percent >= 0 AND ownership_percent <= 100),
  year integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Ensure uniqueness per business/year/owner
CREATE UNIQUE INDEX IF NOT EXISTS ux_rd_business_owners_biz_year_owner
ON rd_business_owners (business_id, year, owner_name);

COMMIT;

