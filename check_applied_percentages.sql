-- Check applied percentages in rd_selected_subcomponents
\echo '🔍 Checking applied percentages in rd_selected_subcomponents...'

-- Count distribution of applied percentages
SELECT 
  CASE 
    WHEN applied_percentage IS NULL THEN 'null'
    WHEN applied_percentage = 0 THEN 'zero'
    WHEN applied_percentage > 0 THEN 'non-zero'
    ELSE 'other'
  END as applied_status,
  COUNT(*) as count
FROM rd_selected_subcomponents 
GROUP BY 
  CASE 
    WHEN applied_percentage IS NULL THEN 'null'
    WHEN applied_percentage = 0 THEN 'zero'
    WHEN applied_percentage > 0 THEN 'non-zero'
    ELSE 'other'
  END;

\echo ''
\echo '📊 Sample records (first 10):'

-- Show sample records
SELECT 
  business_year_id,
  subcomponent_id,
  applied_percentage,
  frequency_percentage,
  year_percentage,
  array_length(selected_roles, 1) as role_count
FROM rd_selected_subcomponents 
ORDER BY business_year_id DESC, subcomponent_id
LIMIT 10;

\echo ''
\echo '🎯 Business year summary:'

-- Group by business year
SELECT 
  business_year_id,
  COUNT(*) as total_subcomponents,
  COUNT(CASE WHEN applied_percentage > 0 THEN 1 END) as non_zero_applied,
  COUNT(CASE WHEN applied_percentage = 0 THEN 1 END) as zero_applied,
  COUNT(CASE WHEN applied_percentage IS NULL THEN 1 END) as null_applied,
  ROUND(AVG(applied_percentage), 2) as avg_applied_percentage
FROM rd_selected_subcomponents 
GROUP BY business_year_id
ORDER BY business_year_id DESC; 