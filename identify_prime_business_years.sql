-- Identify Prime vs Duplicate Business Years
-- This script helps identify which business years contain real data and which are empty duplicates

-- Step 1: Get all business years with data indicators
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

-- Step 2: Rank business years by data score within each business/year combination
ranked_business_years AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY business_id, year 
      ORDER BY data_score DESC, created_at ASC
    ) as rank
  FROM business_year_data
)

-- Step 3: Show results with recommendations
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
    ELSE '🔴 DUPLICATE - Safe to delete'
  END as recommendation,
  
  CASE 
    WHEN rank > 1 THEN 'DELETE FROM rd_business_years WHERE id = ''' || business_year_id || ''';'
    ELSE '-- Keep this record'
  END as cleanup_sql

FROM ranked_business_years
ORDER BY business_id, year, rank;

-- Summary of issues
SELECT 
  'SUMMARY' as section,
  COUNT(*) as total_business_years,
  COUNT(CASE WHEN rank = 1 THEN 1 END) as prime_records,
  COUNT(CASE WHEN rank > 1 THEN 1 END) as duplicate_records,
  COUNT(DISTINCT business_id || '-' || year) as unique_business_year_combinations
FROM ranked_business_years; 