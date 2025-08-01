#!/usr/bin/env python3
"""
Compare rd_* table schemas between remote dump and local database.
Find all missing columns that need to be added for schema compatibility.
"""

import re
import subprocess

def extract_remote_schema():
    """Extract CREATE TABLE statements for rd_* tables from remote dump"""
    
    print("Extracting rd_* table schemas from remote dump...")
    
    with open('remote_database_data_dump.sql', 'r') as f:
        content = f.read()
    
    # Find all CREATE TABLE statements for rd_* tables
    create_pattern = r'CREATE TABLE public\.(rd_\w+) \((.*?)\);'
    matches = re.findall(create_pattern, content, re.DOTALL)
    
    remote_schemas = {}
    for table_name, columns_text in matches:
        # Parse column definitions
        columns = []
        for line in columns_text.split('\n'):
            line = line.strip()
            if line and not line.startswith('CONSTRAINT') and not line.startswith('--'):
                # Extract column name (first word)
                parts = line.split()
                if parts and not parts[0].startswith('CONSTRAINT'):
                    col_name = parts[0].replace(',', '')
                    columns.append(col_name)
        
        remote_schemas[table_name] = columns
    
    return remote_schemas

def get_local_schema():
    """Get rd_* table schemas from local database"""
    
    print("Querying local database for rd_* table schemas...")
    
    # Get all rd_* tables
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'rd_%' ORDER BY table_name;"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error getting table list: {result.stderr}")
        return {}
    
    tables = [line.strip() for line in result.stdout.split('\n') if line.strip()]
    
    # Get column info for each table
    local_schemas = {}
    for table in tables:
        cmd = [
            'psql', 
            'postgresql://postgres:postgres@localhost:54322/postgres',
            '-t', '-c',
            f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}' ORDER BY ordinal_position;"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            columns = [line.strip() for line in result.stdout.split('\n') if line.strip()]
            local_schemas[table] = columns
    
    return local_schemas

def find_schema_differences(remote_schemas, local_schemas):
    """Find missing columns in local schemas"""
    
    print("\n" + "="*100)
    print("RD_* TABLE SCHEMA COMPARISON")
    print("="*100)
    
    all_tables = set(remote_schemas.keys()) | set(local_schemas.keys())
    missing_columns = {}
    
    for table in sorted(all_tables):
        remote_cols = set(remote_schemas.get(table, []))
        local_cols = set(local_schemas.get(table, []))
        
        if table not in local_schemas:
            print(f"\n❌ {table}: TABLE MISSING LOCALLY")
            continue
            
        if table not in remote_schemas:
            print(f"\n⚠️  {table}: LOCAL ONLY (not in remote)")
            continue
        
        missing = remote_cols - local_cols
        extra = local_cols - remote_cols
        
        if missing or extra:
            print(f"\n🔍 {table}:")
            if missing:
                print(f"   Missing locally: {', '.join(sorted(missing))}")
                missing_columns[table] = list(missing)
            if extra:
                print(f"   Extra locally: {', '.join(sorted(extra))}")
        else:
            print(f"\n✅ {table}: SCHEMAS MATCH")
    
    return missing_columns

def extract_column_definitions(table_name, columns):
    """Extract full column definitions from remote dump"""
    
    with open('remote_database_data_dump.sql', 'r') as f:
        content = f.read()
    
    # Find the CREATE TABLE statement for this table
    pattern = rf'CREATE TABLE public\.{table_name} \((.*?)\);'
    match = re.search(pattern, content, re.DOTALL)
    
    if not match:
        return {}
    
    table_def = match.group(1)
    column_defs = {}
    
    for line in table_def.split('\n'):
        line = line.strip()
        if line and not line.startswith('CONSTRAINT') and not line.startswith('--'):
            for col in columns:
                if line.startswith(col + ' '):
                    # Extract the full definition
                    column_defs[col] = line.rstrip(',')
                    break
    
    return column_defs

def generate_migration_script(missing_columns_by_table):
    """Generate a migration script to add all missing columns"""
    
    if not missing_columns_by_table:
        print("\n✅ All rd_* table schemas match - no migration needed!")
        return
    
    print(f"\n📝 Generating migration for {len(missing_columns_by_table)} tables...")
    
    migration_script = """-- Add Missing Columns to rd_* Tables for Remote Data Import Compatibility
-- Purpose: Add all missing columns found in remote database schemas
-- Date: 2025-07-30

BEGIN;

"""
    
    for table_name, columns in missing_columns_by_table.items():
        migration_script += f"-- Add missing columns to {table_name}\n"
        
        # Get column definitions from remote dump
        column_defs = extract_column_definitions(table_name, columns)
        
        for col in columns:
            if col in column_defs:
                # Use the actual definition from remote
                col_def = column_defs[col]
                # Remove any trailing comma and clean up
                col_def = col_def.rstrip(',').strip()
                migration_script += f"ALTER TABLE public.{table_name} ADD COLUMN IF NOT EXISTS {col_def};\n"
            else:
                # Fallback to TEXT type if we can't parse the definition
                migration_script += f"ALTER TABLE public.{table_name} ADD COLUMN IF NOT EXISTS {col} TEXT;\n"
        
        migration_script += "\n"
    
    migration_script += "COMMIT;\n"
    
    # Write migration file
    output_file = 'fix_all_rd_table_schemas.sql'
    with open(output_file, 'w') as f:
        f.write(migration_script)
    
    print(f"Created {output_file} - apply this migration before importing data")

def main():
    """Main comparison function"""
    
    remote_schemas = extract_remote_schema()
    local_schemas = get_local_schema()
    
    print(f"\nFound {len(remote_schemas)} rd_* tables in remote dump")
    print(f"Found {len(local_schemas)} rd_* tables in local database")
    
    missing_columns = find_schema_differences(remote_schemas, local_schemas)
    
    print("\n" + "="*100)
    print("SUMMARY")
    print("="*100)
    
    if missing_columns:
        total_missing = sum(len(cols) for cols in missing_columns.values())
        print(f"Tables with missing columns: {len(missing_columns)}")
        print(f"Total missing columns: {total_missing}")
        
        for table, cols in missing_columns.items():
            print(f"  {table}: {', '.join(cols)}")
        
        generate_migration_script(missing_columns)
    else:
        print("✅ All rd_* table schemas are compatible!")

if __name__ == "__main__":
    main()