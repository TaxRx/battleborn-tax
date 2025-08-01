#!/usr/bin/env python3
"""
Compare remote schema with local schema to identify missing tables and columns.
Generate migrations for any schema differences before importing data.
"""

import re
import subprocess

def extract_remote_schema():
    """Extract table definitions from remote schema dump"""
    
    print("Extracting table schemas from remote dump...")
    
    with open('/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_database_schema.sql', 'r') as f:
        content = f.read()
    
    # Find CREATE TABLE statements for public schema
    pattern = r'CREATE TABLE public\.(\w+) \((.*?)\);'
    matches = re.findall(pattern, content, re.DOTALL)
    
    remote_tables = {}
    for table_name, table_def in matches:
        # Parse column definitions
        columns = {}
        lines = table_def.split('\n')
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('CONSTRAINT') and not line.startswith('--') and line != '':
                # Extract column definition
                parts = line.split()
                if parts and not parts[0].upper() in ['CONSTRAINT', 'PRIMARY', 'FOREIGN', 'UNIQUE', 'CHECK']:
                    col_name = parts[0].replace(',', '')
                    # Get the rest as column definition
                    col_def = ' '.join(parts[1:]).rstrip(',')
                    columns[col_name] = col_def
        
        remote_tables[table_name] = columns
    
    print(f"Found {len(remote_tables)} tables in remote schema")
    return remote_tables

def get_local_schema():
    """Get local table schemas"""
    
    print("Querying local database schemas...")
    
    # Get all tables
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        """
        SELECT 
            t.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default
        FROM information_schema.tables t
        LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.table_schema = 'public'
        ORDER BY t.table_name, c.ordinal_position;
        """
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error getting local schema: {result.stderr}")
        return {}
    
    local_tables = {}
    for line in result.stdout.split('\n'):
        line = line.strip()
        if line and '|' in line:
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 5:
                table_name = parts[0]
                col_name = parts[1]
                data_type = parts[2]
                is_nullable = parts[3]
                col_default = parts[4] if parts[4] else ''
                
                if table_name not in local_tables:
                    local_tables[table_name] = {}
                
                # Create a simplified column definition
                col_def = data_type
                if is_nullable == 'NO':
                    col_def += ' NOT NULL'
                if col_default:
                    col_def += f' DEFAULT {col_default}'
                
                local_tables[table_name][col_name] = col_def
    
    print(f"Found {len(local_tables)} tables in local schema")
    return local_tables

def compare_schemas(remote_tables, local_tables):
    """Compare schemas and identify differences"""
    
    print("\n" + "="*100)
    print("SCHEMA COMPARISON ANALYSIS")
    print("="*100)
    
    missing_tables = []
    missing_columns = {}
    
    for table_name in sorted(remote_tables.keys()):
        if table_name not in local_tables:
            print(f"\n❌ MISSING TABLE: {table_name}")
            missing_tables.append(table_name)
            continue
        
        # Compare columns
        remote_cols = set(remote_tables[table_name].keys())
        local_cols = set(local_tables[table_name].keys())
        
        missing_cols = remote_cols - local_cols
        extra_cols = local_cols - remote_cols
        
        if missing_cols or extra_cols:
            print(f"\n🔍 COLUMN DIFFERENCES: {table_name}")
            if missing_cols:
                print(f"   ❌ Missing locally: {', '.join(sorted(missing_cols))}")
                missing_columns[table_name] = list(missing_cols)
            if extra_cols:
                print(f"   ➕ Extra locally: {', '.join(sorted(extra_cols))}")
        else:
            print(f"✅ {table_name}: schemas match")
    
    return missing_tables, missing_columns

def generate_schema_migration(missing_tables, missing_columns):
    """Generate migration for schema differences"""
    
    if not missing_tables and not missing_columns:
        print("\n✅ All schemas match - no migration needed!")
        return
    
    print(f"\n📝 Generating schema migration...")
    
    # Create migration using supabase CLI
    result = subprocess.run(['supabase', 'migration', 'new', 'sync_remote_schema_differences'], 
                          capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error creating migration: {result.stderr}")
        return
    
    # Extract migration filename
    migration_file = None
    for line in result.stdout.split('\n'):
        if 'Created new migration at' in line:
            migration_file = line.split('at ')[1].strip()
            break
    
    if not migration_file:
        print("Could not determine migration filename")
        return
    
    migration_script = """-- Sync Remote Schema Differences
-- Purpose: Add missing tables and columns found in remote database
-- Date: 2025-07-30

BEGIN;

"""
    
    # Add missing tables (we can't auto-generate these without full definitions)
    if missing_tables:
        migration_script += "-- MISSING TABLES - These need to be created manually:\n"
        for table in missing_tables:
            migration_script += f"-- CREATE TABLE public.{table} (...);\n"
        migration_script += "\n"
    
    # Add missing columns
    if missing_columns:
        migration_script += "-- Add missing columns:\n"
        for table_name, columns in missing_columns.items():
            migration_script += f"\n-- Add missing columns to {table_name}\n"
            migration_script += f"ALTER TABLE public.{table_name}\n"
            
            for i, col in enumerate(columns):
                comma = "," if i < len(columns) - 1 else ";"
                migration_script += f"ADD COLUMN IF NOT EXISTS {col} TEXT{comma}\n"
            
            migration_script += "\n"
    
    migration_script += "COMMIT;\n"
    
    # Write migration file
    with open(migration_file, 'w') as f:
        f.write(migration_script)
    
    print(f"Created migration: {migration_file}")
    
    if missing_tables:
        print(f"\n⚠️  WARNING: {len(missing_tables)} missing tables need manual CREATE TABLE statements")
        print("Missing tables:", ", ".join(missing_tables))

def main():
    """Main comparison function"""
    
    remote_tables = extract_remote_schema()
    local_tables = get_local_schema()
    
    missing_tables, missing_columns = compare_schemas(remote_tables, local_tables)
    
    print("\n" + "="*100)
    print("SUMMARY")
    print("="*100)
    
    if missing_tables:
        print(f"Missing tables: {len(missing_tables)}")
        for table in missing_tables:
            print(f"  - {table}")
    
    if missing_columns:
        total_cols = sum(len(cols) for cols in missing_columns.values())
        print(f"Tables with missing columns: {len(missing_columns)}")
        print(f"Total missing columns: {total_cols}")
        for table, cols in missing_columns.items():
            print(f"  - {table}: {', '.join(cols)}")
    
    if missing_tables or missing_columns:
        generate_schema_migration(missing_tables, missing_columns)
    else:
        print("✅ All schemas are compatible!")

if __name__ == "__main__":
    main()