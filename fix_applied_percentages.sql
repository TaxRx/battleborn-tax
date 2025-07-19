-- Fix Applied Percentages Script
-- This script recalculates all applied_percentage values in rd_selected_subcomponents
-- using the correct formula: (practice_percent * time_percentage * frequency_percentage * year_percentage) / 1000000

-- First, let's see what we're working with
SELECT 
  COUNT(*) as total_subcomponents,
  SUM(applied_percentage) as current_total_applied,
  AVG(applied_percentage) as avg_applied_percentage,
  MIN(applied_percentage) as min_applied_percentage,
  MAX(applied_percentage) as max_applied_percentage
FROM rd_selected_subcomponents;

-- Update all applied_percentage values with the correct calculation
UPDATE rd_selected_subcomponents 
SET applied_percentage = (practice_percent * time_percentage * frequency_percentage * year_percentage) / 1000000
WHERE practice_percent IS NOT NULL 
  AND time_percentage IS NOT NULL 
  AND frequency_percentage IS NOT NULL 
  AND year_percentage IS NOT NULL;

-- Verify the fix by showing the new totals
SELECT 
  COUNT(*) as total_subcomponents,
  SUM(applied_percentage) as new_total_applied,
  AVG(applied_percentage) as new_avg_applied_percentage,
  MIN(applied_percentage) as new_min_applied_percentage,
  MAX(applied_percentage) as new_max_applied_percentage
FROM rd_selected_subcomponents;

-- Show a sample of before/after for verification
-- (You can run this after the update to see the changes)
SELECT 
  id,
  practice_percent,
  time_percentage,
  frequency_percentage,
  year_percentage,
  applied_percentage as new_applied_percentage,
  (practice_percent * time_percentage * frequency_percentage * year_percentage) / 1000000 as calculated_applied_percentage
FROM rd_selected_subcomponents 
LIMIT 10; 