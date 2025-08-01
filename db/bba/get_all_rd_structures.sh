#!/bin/bash

# Script to get detailed structure for all rd_* tables
DB_CONNECTION="postgresql://postgres:postgres@localhost:54322/postgres"

echo "# LOCAL DATABASE RD_* TABLES STRUCTURE REPORT"
echo "# Generated on $(date)"
echo ""

# Get list of all rd_* tables
TABLES=$(psql "$DB_CONNECTION" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'rd_%' ORDER BY table_name;")

for table in $TABLES; do
    echo "## Table: $table"
    echo ""
    echo "### Detailed Structure"
    echo '```'
    psql "$DB_CONNECTION" -c "\\d+ $table"
    echo '```'
    echo ""
done

echo ""
echo "# SUMMARY OF ALL CONSTRAINTS"
echo ""
echo "## Primary Keys"
echo '```'
psql "$DB_CONNECTION" -c "
SELECT 
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_schema = 'public' 
    AND tc.table_name LIKE 'rd_%'
    AND tc.constraint_type = 'PRIMARY KEY'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;
"
echo '```'
echo ""

echo "## Foreign Keys"
echo '```'
psql "$DB_CONNECTION" -c "
SELECT 
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE 
    tc.table_schema = 'public' 
    AND tc.table_name LIKE 'rd_%'
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;
"
echo '```'
echo ""

echo "## Unique Constraints"
echo '```'
psql "$DB_CONNECTION" -c "
SELECT 
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE 
    tc.table_schema = 'public' 
    AND tc.table_name LIKE 'rd_%'
    AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name, tc.constraint_name;
"
echo '```'
echo ""

echo "## All Indexes"
echo '```'
psql "$DB_CONNECTION" -c "
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename LIKE 'rd_%'
ORDER BY tablename, indexname;
"
echo '```'