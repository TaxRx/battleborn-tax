-- COMPREHENSIVE SECTION G DATA DIAGNOSIS FOR 2024
-- Run this in Supabase SQL Editor to find the root causes

-- 1. CHECK BUSINESS YEAR DATA
SELECT 
  'BUSINESS YEARS' as section,
  id,
  year,
  business_id,
  created_at
FROM rd_business_years 
WHERE year = 2024 
ORDER BY created_at;

-- 2. CHECK EMPLOYEE COUNT BY BUSINESS YEAR
SELECT 
  'EMPLOYEE COUNTS' as section,
  by.year,
  by.id as business_year_id,
  COUNT(e.id) as employee_count
FROM rd_business_years by
LEFT JOIN rd_employees e ON e.business_id = by.business_id
WHERE by.year IN (2023, 2024)
GROUP BY by.year, by.id, by.business_id
ORDER BY by.year;

-- 3. CHECK IF EMPLOYEES ARE PROPERLY LINKED TO BUSINESS YEARS
SELECT 
  'EMPLOYEES FOR 2024' as section,
  e.id,
  e.first_name,
  e.last_name,
  e.business_id,
  by.year,
  by.id as business_year_id
FROM rd_employees e
JOIN rd_businesses b ON e.business_id = b.id
JOIN rd_business_years by ON by.business_id = b.id
WHERE by.year = 2024
ORDER BY e.first_name, e.last_name;

-- 4. CHECK rd_employee_subcomponents TABLE FOR 2024
SELECT 
  'EMPLOYEE SUBCOMPONENTS 2024' as section,
  COUNT(*) as total_records,
  COUNT(DISTINCT employee_id) as unique_employees,
  COUNT(DISTINCT subcomponent_id) as unique_subcomponents,
  COUNT(DISTINCT business_year_id) as unique_business_years
FROM rd_employee_subcomponents esc
JOIN rd_business_years by ON esc.business_year_id = by.id
WHERE by.year = 2024;

-- 5. SAMPLE rd_employee_subcomponents DATA
SELECT 
  'SAMPLE EMPLOYEE SUBCOMPONENTS' as section,
  esc.*,
  by.year
FROM rd_employee_subcomponents esc
JOIN rd_business_years by ON esc.business_year_id = by.id
WHERE by.year = 2024
LIMIT 10;

-- 6. CHECK IF SUBCOMPONENTS EXIST FOR 2024
SELECT 
  'SELECTED SUBCOMPONENTS 2024' as section,
  COUNT(*) as total_selected_subcomponents,
  COUNT(DISTINCT business_year_id) as unique_business_years,
  COUNT(DISTINCT subcomponent_id) as unique_subcomponents
FROM rd_selected_subcomponents ss
JOIN rd_business_years by ON ss.business_year_id = by.id
WHERE by.year = 2024;

-- 7. CHECK IF THE SPECIFIC BUSINESS YEAR ID EXISTS
SELECT 
  'SPECIFIC BUSINESS YEAR CHECK' as section,
  *
FROM rd_business_years 
WHERE id = '683ed4ae-812a-4a35-98b6-479a1b77090b';

-- 8. CHECK FOR MISSING RELATIONSHIPS
SELECT 
  'MISSING RELATIONSHIPS DIAGNOSIS' as section,
  'Total employees for 2024' as description,
  COUNT(*) as count
FROM rd_employees e
JOIN rd_businesses b ON e.business_id = b.id
JOIN rd_business_years by ON by.business_id = b.id
WHERE by.year = 2024

UNION ALL

SELECT 
  'MISSING RELATIONSHIPS DIAGNOSIS' as section,
  'Employees with subcomponent relationships for 2024' as description,
  COUNT(DISTINCT esc.employee_id) as count
FROM rd_employee_subcomponents esc
JOIN rd_business_years by ON esc.business_year_id = by.id
WHERE by.year = 2024

UNION ALL

SELECT 
  'MISSING RELATIONSHIPS DIAGNOSIS' as section,
  'Total subcomponents selected for 2024' as description,
  COUNT(*) as count
FROM rd_selected_subcomponents ss
JOIN rd_business_years by ON ss.business_year_id = by.id
WHERE by.year = 2024; 