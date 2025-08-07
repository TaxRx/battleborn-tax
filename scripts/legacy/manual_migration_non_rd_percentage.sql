-- Manual Migration: Add non_rd_percentage to rd_selected_steps table
-- Run this SQL script on your database to fix non-R&D time preservation

-- Add non_rd_percentage column to rd_selected_steps table
ALTER TABLE rd_selected_steps 
ADD COLUMN IF NOT EXISTS non_rd_percentage numeric(5,2) DEFAULT 0;

-- Add comment to document the new column
COMMENT ON COLUMN rd_selected_steps.non_rd_percentage IS 'Percentage of step time allocated to non-R&D activities (0-100)';

-- Update existing records to have 0% non-R&D time by default
UPDATE rd_selected_steps 
SET non_rd_percentage = 0 
WHERE non_rd_percentage IS NULL;

-- Add constraint to ensure percentage is between 0 and 100
ALTER TABLE rd_selected_steps 
ADD CONSTRAINT rd_selected_steps_non_rd_percentage_check 
CHECK (non_rd_percentage >= 0 AND non_rd_percentage <= 100);

-- Verify the migration worked
SELECT 
  'Migration completed successfully' as status,
  COUNT(*) as total_records,
  AVG(non_rd_percentage) as avg_non_rd_percentage
FROM rd_selected_steps; 