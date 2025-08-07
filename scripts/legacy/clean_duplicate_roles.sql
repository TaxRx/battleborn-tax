-- 🧹 CLEAN DUPLICATE ROLES AND PREVENT FUTURE DUPLICATIONS
-- Run this SQL script in Supabase to clean up duplicate roles

-- Step 1: Identify and report duplicate roles
\echo '🔍 Checking for duplicate roles...'

SELECT 
  name,
  business_id, 
  business_year_id,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as role_ids
FROM rd_roles 
GROUP BY name, business_id, business_year_id
HAVING COUNT(*) > 1
ORDER BY business_id, business_year_id, name;

\echo ''
\echo '🧹 Cleaning up duplicate roles (keeping the first occurrence)...'

-- Step 2: Delete duplicate roles, keeping only the first one (by creation date)
WITH duplicates AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY name, business_id, business_year_id 
      ORDER BY created_at ASC
    ) as rn
  FROM rd_roles
  WHERE (name, business_id, business_year_id) IN (
    SELECT name, business_id, business_year_id
    FROM rd_roles 
    GROUP BY name, business_id, business_year_id
    HAVING COUNT(*) > 1
  )
)
DELETE FROM rd_roles 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

\echo '✅ Duplicate roles cleaned up!'

-- Step 3: Update any employee references to deleted roles
\echo '🔄 Updating employee role references...'

-- Find employees with role_id that no longer exists
UPDATE rd_employees 
SET role_id = (
  SELECT r.id 
  FROM rd_roles r 
  WHERE r.name = (
    -- Get the role name from any remaining role with the same name for this business
    SELECT r2.name 
    FROM rd_roles r2 
    WHERE r2.business_id = rd_employees.business_id 
    AND r2.name IN ('Research Leader', 'Clinical Assistant', 'Clinician', 'Manager', 'Administrator')
    LIMIT 1
  )
  AND r.business_id = rd_employees.business_id
  LIMIT 1
)
WHERE role_id NOT IN (SELECT id FROM rd_roles);

\echo '✅ Employee role references updated!'

-- Step 4: Create unique constraint to prevent future duplicates
\echo '🛡️ Adding unique constraint to prevent future duplicates...'

-- First check if constraint already exists
DO $$ 
BEGIN
  -- Try to add the unique constraint
  BEGIN
    ALTER TABLE rd_roles 
    ADD CONSTRAINT unique_role_per_business_year 
    UNIQUE (name, business_id, business_year_id);
    
    RAISE NOTICE '✅ Added unique constraint: unique_role_per_business_year';
  EXCEPTION 
    WHEN duplicate_object THEN
      RAISE NOTICE '⚠️ Unique constraint already exists: unique_role_per_business_year';
    WHEN unique_violation THEN
      RAISE NOTICE '❌ Cannot add unique constraint - duplicate data still exists!';
      RAISE NOTICE 'Run the cleanup portion of this script again.';
  END;
END $$;

-- Step 5: Add helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_rd_roles_business_year_name 
ON rd_roles(business_id, business_year_id, name);

CREATE INDEX IF NOT EXISTS idx_rd_roles_name_lookup 
ON rd_roles(name, business_id);

\echo ''
\echo '🎉 Role cleanup complete!'
\echo ''
\echo '📊 Final role count by business year:'

SELECT 
  b.name as business_name,
  by.year,
  COUNT(r.id) as role_count,
  STRING_AGG(r.name, ', ' ORDER BY r.name) as roles
FROM rd_businesses b
JOIN rd_business_years by ON b.id = by.business_id
LEFT JOIN rd_roles r ON by.id = r.business_year_id
GROUP BY b.id, b.name, by.id, by.year
ORDER BY b.name, by.year; 