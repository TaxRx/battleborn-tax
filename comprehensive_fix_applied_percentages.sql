-- Comprehensive Fix for Applied Percentages
-- This script fixes applied_percentage calculations across all related tables

-- ===========================================
-- STEP 1: BACKUP CURRENT DATA
-- ===========================================

-- Create backup of current applied_percentage values
CREATE TEMP TABLE backup_applied_percentages AS
SELECT 
  id,
  applied_percentage as original_applied_percentage,
  practice_percent,
  time_percentage,
  frequency_percentage,
  year_percentage
FROM rd_selected_subcomponents;

-- ===========================================
-- STEP 2: SHOW CURRENT STATE
-- ===========================================

SELECT 'CURRENT STATE BEFORE FIX' as status;
SELECT 
  COUNT(*) as total_subcomponents,
  ROUND(SUM(applied_percentage), 2) as total_applied_percentage,
  ROUND(AVG(applied_percentage), 2) as avg_applied_percentage,
  ROUND(MIN(applied_percentage), 2) as min_applied_percentage,
  ROUND(MAX(applied_percentage), 2) as max_applied_percentage
FROM rd_selected_subcomponents;

-- ===========================================
-- STEP 3: FIX RD_SELECTED_SUBCOMPONENTS
-- ===========================================

SELECT 'FIXING RD_SELECTED_SUBCOMPONENTS' as status;

UPDATE rd_selected_subcomponents 
SET applied_percentage = (practice_percent * time_percentage * frequency_percentage * year_percentage) / 1000000
WHERE practice_percent IS NOT NULL 
  AND time_percentage IS NOT NULL 
  AND frequency_percentage IS NOT NULL 
  AND year_percentage IS NOT NULL;

-- ===========================================
-- STEP 4: FIX RD_EMPLOYEE_SUBCOMPONENTS (if exists)
-- ===========================================

SELECT 'FIXING RD_EMPLOYEE_SUBCOMPONENTS' as status;

UPDATE rd_employee_subcomponents 
SET applied_percentage = (practice_percentage * time_percentage * frequency_percentage * year_percentage) / 1000000
WHERE practice_percentage IS NOT NULL 
  AND time_percentage IS NOT NULL 
  AND frequency_percentage IS NOT NULL 
  AND year_percentage IS NOT NULL;

-- ===========================================
-- STEP 5: VERIFY THE FIXES
-- ===========================================

SELECT 'VERIFICATION AFTER FIX' as status;

-- Check rd_selected_subcomponents
SELECT 
  'rd_selected_subcomponents' as table_name,
  COUNT(*) as total_records,
  ROUND(SUM(applied_percentage), 2) as total_applied_percentage,
  ROUND(AVG(applied_percentage), 2) as avg_applied_percentage,
  ROUND(MIN(applied_percentage), 2) as min_applied_percentage,
  ROUND(MAX(applied_percentage), 2) as max_applied_percentage
FROM rd_selected_subcomponents;

-- Check rd_employee_subcomponents
SELECT 
  'rd_employee_subcomponents' as table_name,
  COUNT(*) as total_records,
  ROUND(SUM(applied_percentage), 2) as total_applied_percentage,
  ROUND(AVG(applied_percentage), 2) as avg_applied_percentage,
  ROUND(MIN(applied_percentage), 2) as min_applied_percentage,
  ROUND(MAX(applied_percentage), 2) as max_applied_percentage
FROM rd_employee_subcomponents;

-- ===========================================
-- STEP 6: SAMPLE VERIFICATION
-- ===========================================

SELECT 'SAMPLE VERIFICATION' as status;

-- Show sample calculations
SELECT 
  id,
  practice_percent,
  time_percentage,
  frequency_percentage,
  year_percentage,
  applied_percentage as new_applied_percentage,
  ROUND((practice_percent * time_percentage * frequency_percentage * year_percentage) / 1000000, 4) as calculated_applied_percentage,
  CASE 
    WHEN ABS(applied_percentage - (practice_percent * time_percentage * frequency_percentage * year_percentage) / 1000000) < 0.01
    THEN '✅ CORRECT' 
    ELSE '❌ INCORRECT' 
  END as verification
FROM rd_selected_subcomponents 
LIMIT 10;

-- ===========================================
-- STEP 7: ROLLBACK INSTRUCTIONS (if needed)
-- ===========================================

-- If you need to rollback, run this:
/*
UPDATE rd_selected_subcomponents 
SET applied_percentage = backup.original_applied_percentage
FROM backup_applied_percentages backup
WHERE rd_selected_subcomponents.id = backup.id;
*/

SELECT 'SCRIPT COMPLETED' as status; 