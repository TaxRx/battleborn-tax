-- CORRECTED Applied Percentages Fix
-- This script properly calculates applied_percentage using the activity's practice percentage
-- NOT the subcomponent's individual practice_percent

-- First, let's see the current state
SELECT 
  'BEFORE FIX - Current Applied Percentages' as status,
  COUNT(*) as total_subcomponents,
  ROUND(SUM(applied_percentage), 2) as total_applied_percentage,
  ROUND(AVG(applied_percentage), 2) as avg_applied_percentage
FROM rd_selected_subcomponents;

-- Show some sample data to understand the structure
SELECT 
  'SAMPLE DATA' as status,
  sub.id,
  sub.practice_percent as subcomponent_practice_percent,
  sub.time_percentage,
  sub.frequency_percentage, 
  sub.year_percentage,
  sub.applied_percentage as current_applied_percentage,
  act.practice_percent as activity_practice_percent
FROM rd_selected_subcomponents sub
JOIN rd_selected_activities act ON sub.research_activity_id = act.activity_id 
  AND sub.business_year_id = act.business_year_id
LIMIT 5;

-- CORRECT CALCULATION: Use activity's practice_percent, not subcomponent's
UPDATE rd_selected_subcomponents 
SET applied_percentage = (
  act.practice_percent * 
  rd_selected_subcomponents.time_percentage * 
  rd_selected_subcomponents.frequency_percentage * 
  rd_selected_subcomponents.year_percentage
) / 1000000
FROM rd_selected_activities act
WHERE rd_selected_subcomponents.research_activity_id = act.activity_id 
  AND rd_selected_subcomponents.business_year_id = act.business_year_id
  AND rd_selected_subcomponents.time_percentage IS NOT NULL 
  AND rd_selected_subcomponents.frequency_percentage IS NOT NULL 
  AND rd_selected_subcomponents.year_percentage IS NOT NULL
  AND act.practice_percent IS NOT NULL;

-- Verify the fix
SELECT 
  'AFTER FIX - Updated Applied Percentages' as status,
  COUNT(*) as total_subcomponents,
  ROUND(SUM(applied_percentage), 2) as total_applied_percentage,
  ROUND(AVG(applied_percentage), 2) as avg_applied_percentage
FROM rd_selected_subcomponents;

-- Show sample corrected data
SELECT 
  'CORRECTED SAMPLE DATA' as status,
  sub.id,
  sub.practice_percent as subcomponent_practice_percent,
  sub.time_percentage,
  sub.frequency_percentage, 
  sub.year_percentage,
  sub.applied_percentage as corrected_applied_percentage,
  act.practice_percent as activity_practice_percent,
  ROUND((act.practice_percent * sub.time_percentage * sub.frequency_percentage * sub.year_percentage) / 1000000, 4) as calculated_should_be
FROM rd_selected_subcomponents sub
JOIN rd_selected_activities act ON sub.research_activity_id = act.activity_id 
  AND sub.business_year_id = act.business_year_id
LIMIT 5; 