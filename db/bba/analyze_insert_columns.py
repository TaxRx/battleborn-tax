#!/usr/bin/env python3
"""
Analyze INSERT statements to infer column structures and find schema differences.
"""

import re
import subprocess

def extract_columns_from_inserts():
    """Extract column lists from INSERT statements in remote dump"""
    
    print("Analyzing INSERT statements from remote dump...")
    
    with open('remote_database_data_dump.sql', 'r') as f:
        content = f.read()
    
    # Find INSERT statements for rd_* tables
    pattern = r'INSERT INTO public\.(rd_\w+) \(([^)]+)\)'
    matches = re.findall(pattern, content)
    
    remote_columns = {}
    for table_name, columns_text in matches:
        # Parse column names
        columns = [col.strip() for col in columns_text.split(',')]
        if table_name not in remote_columns:
            remote_columns[table_name] = set(columns)
        else:
            # Merge column sets (in case there are multiple INSERT patterns)
            remote_columns[table_name].update(columns)
    
    # Convert sets back to sorted lists
    for table in remote_columns:
        remote_columns[table] = sorted(list(remote_columns[table]))
    
    return remote_columns

def get_local_columns():
    """Get column lists from local database"""
    
    print("Querying local database for rd_* table columns...")
    
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
    
    local_columns = {}
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
            local_columns[table] = columns
    
    return local_columns

def compare_columns(remote_columns, local_columns):
    """Compare column structures and find differences"""
    
    print("\n" + "="*100)
    print("RD_* TABLE COLUMN COMPARISON (from INSERT statements)")
    print("="*100)
    
    all_tables = set(remote_columns.keys()) | set(local_columns.keys())
    missing_columns = {}
    
    for table in sorted(all_tables):
        remote_cols = set(remote_columns.get(table, []))
        local_cols = set(local_columns.get(table, []))
        
        if table not in local_columns:
            print(f"\n❌ {table}: TABLE MISSING LOCALLY")
            continue
            
        if table not in remote_columns:
            print(f"\n⚠️  {table}: LOCAL ONLY (no INSERT statements in remote)")
            continue
        
        missing = remote_cols - local_cols
        extra = local_cols - remote_cols
        
        if missing or extra:
            print(f"\n🔍 {table}:")
            print(f"   Remote columns ({len(remote_cols)}): {', '.join(sorted(remote_cols))}")
            print(f"   Local columns ({len(local_cols)}):  {', '.join(sorted(local_cols))}")
            if missing:
                print(f"   ❌ Missing locally: {', '.join(sorted(missing))}")
                missing_columns[table] = list(missing)
            if extra:
                print(f"   ➕ Extra locally: {', '.join(sorted(extra))}")
        else:
            print(f"\n✅ {table}: COLUMNS MATCH ({len(remote_cols)} columns)")
    
    return missing_columns

def generate_add_columns_migration(missing_columns_by_table):
    """Generate ALTER TABLE statements to add missing columns"""
    
    if not missing_columns_by_table:
        print("\n✅ All rd_* table columns match!")
        return
    
    print(f"\n📝 Generating migration for missing columns...")
    
    migration_script = """-- Add Missing Columns to rd_* Tables for Remote Data Import Compatibility
-- Purpose: Add columns found in remote INSERT statements but missing locally
-- Date: 2025-07-30
-- Note: All columns added as TEXT type - adjust types as needed

BEGIN;

"""
    
    for table_name, columns in missing_columns_by_table.items():
        migration_script += f"-- Add missing columns to {table_name}\n"
        migration_script += f"ALTER TABLE public.{table_name}\n"
        
        for i, col in enumerate(columns):
            comma = "," if i < len(columns) - 1 else ";"
            migration_script += f"ADD COLUMN IF NOT EXISTS {col} TEXT{comma}\n"
        
        migration_script += "\n"
    
    migration_script += "COMMIT;\n"
    
    output_file = 'add_missing_rd_columns.sql'
    with open(output_file, 'w') as f:
        f.write(migration_script)
    
    print(f"Created {output_file}")
    
    return missing_columns_by_table

def main():
    """Main analysis function"""
    
    remote_columns = extract_columns_from_inserts()
    local_columns = get_local_columns()
    
    print(f"\nFound INSERT statements for {len(remote_columns)} rd_* tables in remote dump")
    print(f"Found {len(local_columns)} rd_* tables in local database")
    
    missing_columns = compare_columns(remote_columns, local_columns)
    
    print("\n" + "="*100)
    print("SUMMARY")
    print("="*100)
    
    if missing_columns:
        total_missing = sum(len(cols) for cols in missing_columns.values())
        print(f"Tables with missing columns: {len(missing_columns)}")
        print(f"Total missing columns: {total_missing}")
        
        generate_add_columns_migration(missing_columns)
    else:
        print("✅ All rd_* table columns are compatible!")

if __name__ == "__main__":
    main()