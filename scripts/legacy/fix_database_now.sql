-- URGENT FIX: Correct the applied_percentage values in rd_selected_subcomponents
-- This fixes the inflated values that are causing roles to show 146% instead of 62%

-- First, show current wrong values for reference
SELECT 
  'BEFORE - WRONG VALUES' as status,
  subcomponent_id,
  practice_percent,
  time_percentage,
  frequency_percentage, 
  year_percentage,
  applied_percentage as current_wrong_applied,
  -- Show what it SHOULD be using correct formula
  ROUND((practice_percent / 100) * (time_percentage / 100) * (frequency_percentage / 100) * (year_percentage / 100) * 100, 4) as should_be_applied
FROM rd_selected_subcomponents
WHERE practice_percent IS NOT NULL 
  AND time_percentage IS NOT NULL 
  AND frequency_percentage IS NOT NULL 
  AND year_percentage IS NOT NULL
ORDER BY subcomponent_id
LIMIT 10;

-- Now fix all the applied_percentage values using the correct formula
UPDATE rd_selected_subcomponents 
SET applied_percentage = ROUND(
  (practice_percent / 100) * (time_percentage / 100) * (frequency_percentage / 100) * (year_percentage / 100) * 100, 
  4
)
WHERE practice_percent IS NOT NULL 
  AND time_percentage IS NOT NULL 
  AND frequency_percentage IS NOT NULL 
  AND year_percentage IS NOT NULL;

-- Show the fixed values
SELECT 
  'AFTER - FIXED VALUES' as status,
  subcomponent_id,
  practice_percent,
  time_percentage,
  frequency_percentage, 
  year_percentage,
  applied_percentage as fixed_applied
FROM rd_selected_subcomponents
WHERE practice_percent IS NOT NULL 
  AND time_percentage IS NOT NULL 
  AND frequency_percentage IS NOT NULL 
  AND year_percentage IS NOT NULL
ORDER BY subcomponent_id
LIMIT 10;

-- Show summary of changes
SELECT 
  'SUMMARY' as status,
  COUNT(*) as total_records_updated,
  ROUND(AVG(applied_percentage), 2) as avg_applied_percentage,
  ROUND(MIN(applied_percentage), 2) as min_applied_percentage,
  ROUND(MAX(applied_percentage), 2) as max_applied_percentage
FROM rd_selected_subcomponents
WHERE practice_percent IS NOT NULL; 