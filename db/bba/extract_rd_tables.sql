-- Script to extract complete structure for all rd_* tables
-- Run this to get comprehensive information about each table

-- Get all table constraints
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.table_schema = 'public' 
    AND tc.table_name LIKE 'rd_%'
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Get all indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'rd_%'
ORDER BY tablename, indexname;

-- Get all column details with comments
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.numeric_precision,
    c.numeric_scale,
    c.is_nullable,
    c.column_default,
    pgd.description as column_comment
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name
LEFT JOIN pg_catalog.pg_statio_all_tables st ON st.relname = t.table_name
LEFT JOIN pg_catalog.pg_description pgd ON pgd.objoid = st.relid 
    AND pgd.objsubid = c.ordinal_position
WHERE t.table_schema = 'public' 
  AND t.table_name LIKE 'rd_%'
ORDER BY t.table_name, c.ordinal_position;