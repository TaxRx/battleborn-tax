-- ✅ CORRECTED NON-R&D MIGRATION SQL
-- This version handles existing constraints gracefully

-- Step 1: Add the column if it doesn't exist
ALTER TABLE rd_selected_steps 
ADD COLUMN IF NOT EXISTS non_rd_percentage numeric(5,2) DEFAULT 0;

-- Step 2: Update existing records (safe to run multiple times)
UPDATE rd_selected_steps 
SET non_rd_percentage = 0 
WHERE non_rd_percentage IS NULL;

-- Step 3: Drop existing constraint if it exists, then recreate it
-- This ensures we have the correct constraint definition
ALTER TABLE rd_selected_steps 
DROP CONSTRAINT IF EXISTS rd_selected_steps_non_rd_percentage_check;

ALTER TABLE rd_selected_steps 
ADD CONSTRAINT rd_selected_steps_non_rd_percentage_check 
CHECK (non_rd_percentage >= 0 AND non_rd_percentage <= 100);

-- Step 4: Add column comment (safe to run multiple times)
COMMENT ON COLUMN rd_selected_steps.non_rd_percentage IS 'Percentage of step time allocated to non-R&D activities (0-100)';

-- Step 5: Verify the migration worked
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    CASE WHEN column_name = 'non_rd_percentage' THEN '✅ FOUND' ELSE '' END as status
FROM information_schema.columns 
WHERE table_name = 'rd_selected_steps' 
AND column_name IN ('step_id', 'time_percentage', 'non_rd_percentage')
ORDER BY column_name; 