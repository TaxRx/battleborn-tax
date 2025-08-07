-- 🔍 SAFE BUSINESS YEAR DUPLICATE ANALYSIS
-- 
-- This script analyzes business years to identify duplicates vs data-containing records.
-- ⚠️  IMPORTANT: Run each section separately and review results before proceeding.

-- ================================================================================================
-- STEP 1: Quick overview of duplicate business years
-- ================================================================================================
-- Run this first to see if you have duplicates:

SELECT 
  business_id,
  year,
  COUNT(*) as duplicate_count,
  ARRAY_AGG(id ORDER BY created_at) as business_year_ids,
  ARRAY_AGG(created_at ORDER BY created_at) as creation_dates
FROM rd_business_years
GROUP BY business_id, year
HAVING COUNT(*) > 1
ORDER BY business_id, year;

-- ================================================================================================
-- STEP 2: Count related data for each business year
-- ================================================================================================
-- This shows which business years have actual data in them:

SELECT 
  by.id as business_year_id,
  by.business_id,
  by.year,
  by.gross_receipts,
  by.total_qre,
  by.created_at,
  
  -- Count related data
  (SELECT COUNT(*) FROM rd_selected_activities WHERE business_year_id = by.id) as activities_count,
  (SELECT COUNT(*) FROM rd_selected_steps WHERE business_year_id = by.id) as steps_count,
  (SELECT COUNT(*) FROM rd_selected_subcomponents WHERE business_year_id = by.id) as subcomponents_count,
  (SELECT COUNT(*) FROM rd_employee_year_data WHERE business_year_id = by.id) as employees_count,
  (SELECT COUNT(*) FROM rd_contractor_year_data WHERE business_year_id = by.id) as contractors_count,
  
  -- Calculate a data score (higher = more data)
  (SELECT COUNT(*) FROM rd_selected_activities WHERE business_year_id = by.id) * 10 +
  (SELECT COUNT(*) FROM rd_selected_steps WHERE business_year_id = by.id) * 5 +
  (SELECT COUNT(*) FROM rd_selected_subcomponents WHERE business_year_id = by.id) * 3 +
  (SELECT COUNT(*) FROM rd_employee_year_data WHERE business_year_id = by.id) * 2 +
  (SELECT COUNT(*) FROM rd_contractor_year_data WHERE business_year_id = by.id) * 1 +
  CASE WHEN by.gross_receipts > 0 THEN 5 ELSE 0 END +
  CASE WHEN by.total_qre > 0 THEN 5 ELSE 0 END as data_score

FROM rd_business_years by
WHERE by.business_id IN (
  -- Only analyze business years that have duplicates
  SELECT business_id 
  FROM rd_business_years 
  GROUP BY business_id, year 
  HAVING COUNT(*) > 1
)
ORDER BY by.business_id, by.year, data_score DESC;

-- ================================================================================================
-- STEP 3: Identify which records to keep vs delete
-- ================================================================================================
-- This shows the recommended action for each business year:

WITH business_data_scores AS (
  SELECT 
    by.id as business_year_id,
    by.business_id,
    by.year,
    by.created_at,
    
    -- Calculate data score
    (SELECT COUNT(*) FROM rd_selected_activities WHERE business_year_id = by.id) * 10 +
    (SELECT COUNT(*) FROM rd_selected_steps WHERE business_year_id = by.id) * 5 +
    (SELECT COUNT(*) FROM rd_selected_subcomponents WHERE business_year_id = by.id) * 3 +
    (SELECT COUNT(*) FROM rd_employee_year_data WHERE business_year_id = by.id) * 2 +
    (SELECT COUNT(*) FROM rd_contractor_year_data WHERE business_year_id = by.id) * 1 +
    CASE WHEN by.gross_receipts > 0 THEN 5 ELSE 0 END +
    CASE WHEN by.total_qre > 0 THEN 5 ELSE 0 END as data_score,
    
    -- Rank within each business/year group
    ROW_NUMBER() OVER (
      PARTITION BY by.business_id, by.year 
      ORDER BY 
        (SELECT COUNT(*) FROM rd_selected_activities WHERE business_year_id = by.id) * 10 +
        (SELECT COUNT(*) FROM rd_selected_steps WHERE business_year_id = by.id) * 5 +
        (SELECT COUNT(*) FROM rd_selected_subcomponents WHERE business_year_id = by.id) * 3 +
        (SELECT COUNT(*) FROM rd_employee_year_data WHERE business_year_id = by.id) * 2 +
        (SELECT COUNT(*) FROM rd_contractor_year_data WHERE business_year_id = by.id) * 1 +
        CASE WHEN by.gross_receipts > 0 THEN 5 ELSE 0 END +
        CASE WHEN by.total_qre > 0 THEN 5 ELSE 0 END DESC,
      by.created_at ASC
    ) as rank
    
  FROM rd_business_years by
)
SELECT 
  business_id,
  year,
  business_year_id,
  data_score,
  rank,
  created_at,
  
  CASE 
    WHEN rank = 1 AND data_score > 0 THEN '🟢 KEEP - Prime record with data'
    WHEN rank = 1 AND data_score = 0 THEN '🟡 KEEP - Prime record (oldest, no data yet)'
    ELSE '🔴 DELETE - Duplicate record'
  END as recommendation,
  
  CASE 
    WHEN rank > 1 THEN 'DELETE FROM rd_business_years WHERE id = ''' || business_year_id || ''';'
    ELSE '-- Keep this record (id: ' || business_year_id || ')'
  END as cleanup_sql

FROM business_data_scores
WHERE business_id IN (
  -- Only show businesses with duplicates
  SELECT business_id 
  FROM rd_business_years 
  GROUP BY business_id, year 
  HAVING COUNT(*) > 1
)
ORDER BY business_id, year, rank;

-- ================================================================================================
-- STEP 4: Generate cleanup script (REVIEW CAREFULLY!)
-- ================================================================================================
-- This generates the DELETE statements for duplicate records:

WITH business_data_scores AS (
  SELECT 
    by.id as business_year_id,
    by.business_id,
    by.year,
    by.created_at,
    
    -- Calculate data score and rank
    ROW_NUMBER() OVER (
      PARTITION BY by.business_id, by.year 
      ORDER BY 
        (SELECT COUNT(*) FROM rd_selected_activities WHERE business_year_id = by.id) * 10 +
        (SELECT COUNT(*) FROM rd_selected_steps WHERE business_year_id = by.id) * 5 +
        (SELECT COUNT(*) FROM rd_selected_subcomponents WHERE business_year_id = by.id) * 3 +
        (SELECT COUNT(*) FROM rd_employee_year_data WHERE business_year_id = by.id) * 2 +
        (SELECT COUNT(*) FROM rd_contractor_year_data WHERE business_year_id = by.id) * 1 +
        CASE WHEN by.gross_receipts > 0 THEN 5 ELSE 0 END +
        CASE WHEN by.total_qre > 0 THEN 5 ELSE 0 END DESC,
      by.created_at ASC
    ) as rank
    
  FROM rd_business_years by
)
SELECT 
  '-- Delete duplicate business year: ' || business_id || ' - ' || year || ' (created: ' || created_at || ')' as comment,
  'DELETE FROM rd_business_years WHERE id = ''' || business_year_id || ''';' as delete_statement
FROM business_data_scores
WHERE rank > 1  -- Only duplicates, not prime records
ORDER BY business_id, year;

-- ================================================================================================
-- Summary
-- ================================================================================================
SELECT 
  'SUMMARY' as report_section,
  COUNT(*) as total_business_years,
  COUNT(DISTINCT business_id || '-' || year) as unique_business_year_combinations,
  COUNT(*) - COUNT(DISTINCT business_id || '-' || year) as total_duplicates_found
FROM rd_business_years; 