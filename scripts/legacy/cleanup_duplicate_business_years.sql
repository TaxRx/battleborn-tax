-- ⚠️  CRITICAL: Backup your database before running this cleanup script!
-- 
-- This script safely removes duplicate business years while preserving the ones with data.
-- It identifies "prime" business years (those with the most data) and removes empty duplicates.

-- STEP 1: Run this query first to review what will be deleted
-- DO NOT DELETE ANYTHING YET - JUST REVIEW!

WITH business_year_data AS (
  SELECT 
    by.id as business_year_id,
    by.business_id,
    by.year,
    by.gross_receipts,
    by.total_qre,
    by.created_at,
    
    -- Count related data to identify "prime" records
    COALESCE(activities.count, 0) as selected_activities_count,
    COALESCE(steps.count, 0) as selected_steps_count,
    COALESCE(subcomponents.count, 0) as selected_subcomponents_count,
    COALESCE(employees.count, 0) as employee_allocations_count,
    COALESCE(contractors.count, 0) as contractor_data_count,
    
    -- Calculate data score (higher = more data = likely prime)
    (COALESCE(activities.count, 0) * 10 +
     COALESCE(steps.count, 0) * 5 +
     COALESCE(subcomponents.count, 0) * 3 +
     COALESCE(employees.count, 0) * 2 +
     COALESCE(contractors.count, 0) * 1 +
     CASE WHEN by.gross_receipts > 0 THEN 5 ELSE 0 END +
     CASE WHEN by.total_qre > 0 THEN 5 ELSE 0 END) as data_score
    
  FROM rd_business_years by
  
  -- Left join to count related data
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_selected_activities 
    GROUP BY business_year_id
  ) activities ON by.id = activities.business_year_id
  
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_selected_steps 
    GROUP BY business_year_id
  ) steps ON by.id = steps.business_year_id
  
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_selected_subcomponents 
    GROUP BY business_year_id
  ) subcomponents ON by.id = subcomponents.business_year_id
  
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_employee_year_data 
    GROUP BY business_year_id
  ) employees ON by.id = employees.business_year_id
  
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_contractor_year_data 
    GROUP BY business_year_id
  ) contractors ON by.id = contractors.business_year_id
),

-- Rank business years by data score within each business/year combination
ranked_business_years AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY business_id, year 
      ORDER BY data_score DESC, created_at ASC
    ) as rank
  FROM business_year_data
)

-- REVIEW WHAT WILL BE KEPT vs DELETED
SELECT 
  business_id,
  year,
  business_year_id,
  data_score,
  rank,
  selected_activities_count,
  selected_steps_count,
  selected_subcomponents_count,
  employee_allocations_count,
  contractor_data_count,
  gross_receipts,
  total_qre,
  created_at,
  
  CASE 
    WHEN rank = 1 AND data_score > 0 THEN '🟢 PRIME - Keep (has data)'
    WHEN rank = 1 AND data_score = 0 THEN '🟡 PRIME - Keep (oldest, no data yet)'
    ELSE '🔴 DUPLICATE - Will be deleted'
  END as action

FROM ranked_business_years
ORDER BY business_id, year, rank;

-- ================================================================================================
-- STEP 2: After reviewing above results, uncomment and run this section to perform cleanup
-- ================================================================================================

/*
-- BACKUP COMMAND (run in terminal first):
-- pg_dump -h your-host -U your-user -d your-database > backup_before_cleanup.sql

-- DELETE DUPLICATE BUSINESS YEARS (ONLY AFTER REVIEWING ABOVE!)
WITH business_year_data AS (
  SELECT 
    by.id as business_year_id,
    by.business_id,
    by.year,
    by.gross_receipts,
    by.total_qre,
    by.created_at,
    
    -- Count related data to identify "prime" records
    COALESCE(activities.count, 0) as selected_activities_count,
    COALESCE(steps.count, 0) as selected_steps_count,
    COALESCE(subcomponents.count, 0) as selected_subcomponents_count,
    COALESCE(employees.count, 0) as employee_allocations_count,
    COALESCE(contractors.count, 0) as contractor_data_count,
    
    -- Calculate data score (higher = more data = likely prime)
    (COALESCE(activities.count, 0) * 10 +
     COALESCE(steps.count, 0) * 5 +
     COALESCE(subcomponents.count, 0) * 3 +
     COALESCE(employees.count, 0) * 2 +
     COALESCE(contractors.count, 0) * 1 +
     CASE WHEN by.gross_receipts > 0 THEN 5 ELSE 0 END +
     CASE WHEN by.total_qre > 0 THEN 5 ELSE 0 END) as data_score
    
  FROM rd_business_years by
  
  -- Left join to count related data
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_selected_activities 
    GROUP BY business_year_id
  ) activities ON by.id = activities.business_year_id
  
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_selected_steps 
    GROUP BY business_year_id
  ) steps ON by.id = steps.business_year_id
  
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_selected_subcomponents 
    GROUP BY business_year_id
  ) subcomponents ON by.id = subcomponents.business_year_id
  
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_employee_year_data 
    GROUP BY business_year_id
  ) employees ON by.id = employees.business_year_id
  
  LEFT JOIN (
    SELECT business_year_id, COUNT(*) as count 
    FROM rd_contractor_year_data 
    GROUP BY business_year_id
  ) contractors ON by.id = contractors.business_year_id
),

-- Rank business years by data score within each business/year combination
ranked_business_years AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY business_id, year 
      ORDER BY data_score DESC, created_at ASC
    ) as rank
  FROM business_year_data
)

-- DELETE DUPLICATE BUSINESS YEARS (rank > 1)
DELETE FROM rd_business_years 
WHERE id IN (
  SELECT business_year_id 
  FROM ranked_business_years 
  WHERE rank > 1
);

-- Show summary of cleanup
SELECT 
  'Cleanup completed' as status,
  COUNT(CASE WHEN rank > 1 THEN 1 END) as deleted_duplicates,
  COUNT(CASE WHEN rank = 1 THEN 1 END) as preserved_prime_records
FROM ranked_business_years;
*/ 