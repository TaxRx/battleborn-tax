-- ========================================
-- ID PRESERVATION & BUSINESS RELATIONSHIP VERIFICATION
-- ========================================
-- Run these queries to verify your batch import was successful

-- 1. CHECK RECENTLY UPDATED SUBCOMPONENTS (Last 1 Hour)
-- This shows which subcomponents were modified and their IDs
SELECT 
    id,
    name,
    updated_at,
    created_at,
    CASE 
        WHEN updated_at > created_at + INTERVAL '1 minute' THEN '✅ UPDATED (ID Preserved)'
        ELSE '🆕 NEWLY CREATED'
    END as status
FROM rd_research_subcomponents 
WHERE updated_at >= NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- 2. VERIFY BUSINESS RELATIONSHIPS ARE INTACT
-- Check that subcomponents still have active business connections
SELECT 
    s.id as subcomponent_id,
    s.name as subcomponent_name,
    s.updated_at,
    
    -- Count of business relationships
    COALESCE(sel.selected_count, 0) as selected_activities_count,
    COALESCE(emp.employee_allocations, 0) as employee_allocations_count,
    COALESCE(exp.expense_records, 0) as expense_records_count,
    
    -- Status
    CASE 
        WHEN COALESCE(sel.selected_count, 0) + COALESCE(emp.employee_allocations, 0) + COALESCE(exp.expense_records, 0) > 0 
        THEN '✅ HAS BUSINESS RELATIONSHIPS'
        ELSE '⚠️ NO BUSINESS RELATIONSHIPS'
    END as relationship_status
    
FROM rd_research_subcomponents s
LEFT JOIN (
    SELECT subcomponent_id, COUNT(*) as selected_count
    FROM rd_selected_subcomponents 
    GROUP BY subcomponent_id
) sel ON s.id = sel.subcomponent_id
LEFT JOIN (
    SELECT subcomponent_id, COUNT(*) as employee_allocations
    FROM rd_employee_subcomponents 
    GROUP BY subcomponent_id
) emp ON s.id = emp.subcomponent_id
LEFT JOIN (
    SELECT subcomponent_id, COUNT(*) as expense_records
    FROM rd_expenses 
    GROUP BY subcomponent_id
) exp ON s.id = exp.subcomponent_id

WHERE s.updated_at >= NOW() - INTERVAL '1 hour'
ORDER BY s.updated_at DESC;

-- 3. CHECK FOR ORPHANED RELATIONSHIPS (SHOULD BE ZERO)
-- These queries should return NO ROWS if IDs were preserved correctly

-- Orphaned Selected Subcomponents
SELECT 'ORPHANED SELECTED SUBCOMPONENTS' as issue_type, COUNT(*) as count
FROM rd_selected_subcomponents ss
LEFT JOIN rd_research_subcomponents s ON ss.subcomponent_id = s.id
WHERE s.id IS NULL;

-- Orphaned Employee Subcomponents  
SELECT 'ORPHANED EMPLOYEE SUBCOMPONENTS' as issue_type, COUNT(*) as count
FROM rd_employee_subcomponents es
LEFT JOIN rd_research_subcomponents s ON es.subcomponent_id = s.id
WHERE s.id IS NULL;

-- Orphaned Expense Records
SELECT 'ORPHANED EXPENSE RECORDS' as issue_type, COUNT(*) as count
FROM rd_expenses e
LEFT JOIN rd_research_subcomponents s ON e.subcomponent_id = s.id
WHERE s.id IS NULL;

-- 4. DETAILED AUDIT: SUBCOMPONENTS WITH THEIR RELATIONSHIPS
-- Shows exactly which subcomponents have what business data
SELECT 
    s.id,
    s.name,
    s.updated_at,
    s.created_at,
    
    -- Business relationship details
    string_agg(DISTINCT by_year.year::text, ', ') as active_years,
    string_agg(DISTINCT emp_role.role_name, ', ') as employee_roles,
    ROUND(SUM(DISTINCT exp_cost.total_expenses)::numeric, 2) as total_expenses,
    
    CASE 
        WHEN s.updated_at > s.created_at + INTERVAL '1 minute' THEN '✅ UPDATED - ID PRESERVED'
        ELSE '🆕 NEWLY CREATED'
    END as import_status
    
FROM rd_research_subcomponents s

-- Join business years through selected subcomponents
LEFT JOIN rd_selected_subcomponents ss ON s.id = ss.subcomponent_id
LEFT JOIN rd_business_years by_year ON ss.business_year_id = by_year.id

-- Join employee data
LEFT JOIN rd_employee_subcomponents es ON s.id = es.subcomponent_id
LEFT JOIN rd_employees emp ON es.employee_id = emp.id
LEFT JOIN rd_roles emp_role ON emp.role_id = emp_role.id

-- Join expense data
LEFT JOIN (
    SELECT subcomponent_id, SUM(total_cost) as total_expenses
    FROM rd_expenses
    GROUP BY subcomponent_id
) exp_cost ON s.id = exp_cost.subcomponent_id

WHERE s.updated_at >= NOW() - INTERVAL '1 hour'

GROUP BY s.id, s.name, s.updated_at, s.created_at, exp_cost.total_expenses
ORDER BY s.updated_at DESC;

-- 5. STEP NAME VERIFICATION
-- Check if step names were updated as expected
SELECT 
    rs.id as step_id,
    rs.name as step_name,
    rs.updated_at,
    rs.research_activity_id,
    ra.title as activity_title,
    COUNT(sub.id) as subcomponent_count
FROM rd_research_steps rs
JOIN rd_research_activities ra ON rs.research_activity_id = ra.id
LEFT JOIN rd_research_subcomponents sub ON rs.id = sub.step_id
WHERE rs.updated_at >= NOW() - INTERVAL '1 hour'
GROUP BY rs.id, rs.name, rs.updated_at, rs.research_activity_id, ra.title
ORDER BY rs.updated_at DESC;