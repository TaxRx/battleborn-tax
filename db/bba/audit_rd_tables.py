#!/usr/bin/env python3
"""
Comprehensive audit script to compare rd_* table definitions between 
remote schema dump and migration file.
"""

import re
import sys
from typing import Dict, List, Tuple, Optional

def extract_table_definitions(file_path: str) -> Dict[str, str]:
    """Extract all rd_* table definitions from a SQL file."""
    tables = {}
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Find all CREATE TABLE statements for rd_* tables
    # Handle both standard SQL and PostgreSQL IF NOT EXISTS syntax
    pattern = r'CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?rd_(\w+) \((.*?)\);'
    matches = re.findall(pattern, content, re.DOTALL | re.MULTILINE)
    
    for table_name, table_def in matches:
        full_table_name = f"rd_{table_name}"
        tables[full_table_name] = table_def.strip()
    
    return tables

def parse_columns(table_def: str) -> List[Tuple[str, str]]:
    """Parse column definitions from table definition."""
    columns = []
    
    # Split by commas, but handle complex types and constraints
    lines = table_def.split('\n')
    current_column = ""
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('CONSTRAINT'):
            continue
            
        # Remove leading/trailing whitespace and commas
        line = line.rstrip(',').strip()
        
        if line:
            # Split column name from type/constraints
            parts = line.split(None, 1)
            if len(parts) >= 2:
                col_name = parts[0]
                col_def = parts[1] if len(parts) > 1 else ""
                columns.append((col_name, col_def))
    
    return columns

def compare_tables(remote_tables: Dict[str, str], migration_tables: Dict[str, str]) -> Dict:
    """Compare table definitions and return discrepancies."""
    comparison = {
        'missing_tables': [],
        'extra_tables': [],
        'table_differences': {}
    }
    
    # Find missing and extra tables
    remote_set = set(remote_tables.keys())
    migration_set = set(migration_tables.keys())
    
    comparison['missing_tables'] = list(remote_set - migration_set)
    comparison['extra_tables'] = list(migration_set - remote_set)
    
    # Compare common tables
    common_tables = remote_set & migration_set
    
    for table_name in common_tables:
        remote_cols = parse_columns(remote_tables[table_name])
        migration_cols = parse_columns(migration_tables[table_name])
        
        remote_col_names = {col[0] for col in remote_cols}
        migration_col_names = {col[0] for col in migration_cols}
        
        missing_cols = remote_col_names - migration_col_names
        extra_cols = migration_col_names - remote_col_names
        
        if missing_cols or extra_cols:
            comparison['table_differences'][table_name] = {
                'remote_columns': len(remote_cols),
                'migration_columns': len(migration_cols),
                'missing_columns': list(missing_cols),
                'extra_columns': list(extra_cols),
                'remote_cols': remote_cols,
                'migration_cols': migration_cols
            }
    
    return comparison

def main():
    remote_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_schema_dump_0731.sql'
    migration_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/supabase/migrations/20250731230000_create_rd_complete_accurate.sql'
    
    print("🔍 COMPREHENSIVE RD_* TABLE AUDIT")
    print("=" * 50)
    
    # Extract table definitions
    print("📖 Extracting table definitions...")
    remote_tables = extract_table_definitions(remote_file)
    migration_tables = extract_table_definitions(migration_file)
    
    print(f"Remote schema: {len(remote_tables)} rd_* tables")
    print(f"Migration file: {len(migration_tables)} rd_* tables")
    print()
    
    # Compare tables
    comparison = compare_tables(remote_tables, migration_tables)
    
    # Report results
    if comparison['missing_tables']:
        print("❌ MISSING TABLES (in remote but not in migration):")
        for table in sorted(comparison['missing_tables']):
            print(f"  - {table}")
        print()
    
    if comparison['extra_tables']:
        print("➕ EXTRA TABLES (in migration but not in remote):")
        for table in sorted(comparison['extra_tables']):
            print(f"  - {table}")
        print()
    
    if comparison['table_differences']:
        print("🔧 TABLES WITH COLUMN DIFFERENCES:")
        print("=" * 50)
        
        for table_name, diff in sorted(comparison['table_differences'].items()):
            print(f"\n📋 {table_name.upper()}")
            print(f"   Remote: {diff['remote_columns']} columns")
            print(f"   Migration: {diff['migration_columns']} columns")
            
            if diff['missing_columns']:
                print(f"   ❌ Missing columns ({len(diff['missing_columns'])}):")
                for col in sorted(diff['missing_columns']):
                    print(f"      - {col}")
            
            if diff['extra_columns']:
                print(f"   ➕ Extra columns ({len(diff['extra_columns'])}):")
                for col in sorted(diff['extra_columns']):
                    print(f"      - {col}")
    
    # Summary
    total_issues = len(comparison['missing_tables']) + len(comparison['extra_tables']) + len(comparison['table_differences'])
    
    print("\n" + "=" * 50)
    print(f"📊 SUMMARY: {total_issues} tables with issues found")
    
    if total_issues == 0:
        print("✅ All tables match perfectly!")
    else:
        print("❌ Migration file needs significant corrections")
        print("\n🚨 CRITICAL: This migration would create incomplete tables!")

if __name__ == "__main__":
    main()