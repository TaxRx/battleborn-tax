#!/usr/bin/env python3
"""
Analyze the new remote dump file to find schema differences and missing data.
First identify schema changes needed, then generate import scripts.
"""

import re
import subprocess

def extract_columns_from_new_dump():
    """Extract column lists from INSERT statements in new remote dump"""
    
    print("Analyzing INSERT statements from new remote dump...")
    
    with open('/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_database_data_dump_new.sql', 'r') as f:
        content = f.read()
    
    # Find INSERT statements for all tables
    pattern = r'INSERT INTO public\.(\w+) \(([^)]+)\)'
    matches = re.findall(pattern, content)
    
    remote_columns = {}
    table_counts = {}
    
    for table_name, columns_text in matches:
        # Parse column names
        columns = [col.strip() for col in columns_text.split(',')]
        if table_name not in remote_columns:
            remote_columns[table_name] = set(columns)
            table_counts[table_name] = 1
        else:
            # Merge column sets and count records
            remote_columns[table_name].update(columns)
            table_counts[table_name] += 1
    
    # Convert sets back to sorted lists
    for table in remote_columns:
        remote_columns[table] = sorted(list(remote_columns[table]))
    
    return remote_columns, table_counts

def get_local_columns():
    """Get column lists from local database"""
    
    print("Querying local database for table columns...")
    
    # Get all tables
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error getting table list: {result.stderr}")
        return {}
    
    tables = [line.strip() for line in result.stdout.split('\n') if line.strip()]
    
    local_columns = {}
    local_counts = {}
    
    for table in tables:
        # Get columns
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
        
        # Get record count
        cmd = [
            'psql', 
            'postgresql://postgres:postgres@localhost:54322/postgres',
            '-t', '-c',
            f"SELECT COUNT(*) FROM {table};"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            count = int(result.stdout.strip())
            local_counts[table] = count
    
    return local_columns, local_counts

def compare_schemas(remote_columns, local_columns):
    """Compare column structures and find schema differences"""
    
    print("\n" + "="*100)
    print("SCHEMA COMPARISON ANALYSIS")
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
            if missing:
                print(f"   ❌ Missing locally: {', '.join(sorted(missing))}")
                missing_columns[table] = list(missing)
            if extra:
                print(f"   ➕ Extra locally: {', '.join(sorted(extra))}")
        else:
            print(f"\n✅ {table}: SCHEMAS MATCH ({len(remote_cols)} columns)")
    
    return missing_columns

def generate_schema_migration(missing_columns_by_table):
    """Generate migration for schema changes"""
    
    if not missing_columns_by_table:
        print("\n✅ All table schemas match - no migration needed!")
        return False
    
    print(f"\n📝 Generating schema migration for {len(missing_columns_by_table)} tables...")
    
    # Create migration file using supabase CLI
    import subprocess
    result = subprocess.run(['supabase', 'migration', 'new', 'add_missing_columns_from_new_dump'], 
                          capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error creating migration: {result.stderr}")
        return False
    
    # Extract migration filename from output
    migration_file = None
    for line in result.stdout.split('\n'):
        if 'Created new migration at' in line:
            migration_file = line.split('at ')[1].strip()
            break
    
    if not migration_file:
        print("Could not determine migration filename")
        return False
    
    migration_script = """-- Add Missing Columns from New Remote Dump
-- Purpose: Add columns found in new remote INSERT statements but missing locally
-- Date: 2025-07-30

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
    
    # Write migration file
    with open(migration_file, 'w') as f:
        f.write(migration_script)
    
    print(f"Created migration: {migration_file}")
    return True

def analyze_missing_data(remote_counts, local_counts):
    """Analyze which tables need data imported"""
    
    print("\n" + "="*100)
    print("DATA COMPARISON ANALYSIS")
    print("="*100)
    print(f"{'Table Name':<35} {'Remote':<10} {'Local':<10} {'Status':<15}")
    print("-"*100)
    
    tables_to_import = {}
    
    for table in sorted(set(remote_counts.keys()) | set(local_counts.keys())):
        remote_count = remote_counts.get(table, 0)
        local_count = local_counts.get(table, 0)
        
        if remote_count > 0 and local_count == 0:
            status = "NEEDS IMPORT"
            tables_to_import[table] = remote_count
        elif remote_count > local_count:
            status = "PARTIAL DATA"
        elif remote_count == local_count and remote_count > 0:
            status = "COMPLETE"
        elif remote_count == 0 and local_count == 0:
            status = "EMPTY"
        else:
            status = "LOCAL ONLY"
        
        print(f"{table:<35} {remote_count:<10} {local_count:<10} {status:<15}")
    
    return tables_to_import

def main():
    """Main analysis function"""
    
    print("Analyzing new remote dump for schema differences and missing data...")
    
    # Get data from both sources
    remote_columns, remote_counts = extract_columns_from_new_dump()
    local_columns, local_counts = get_local_columns()
    
    print(f"\nFound INSERT statements for {len(remote_columns)} tables in new remote dump")
    print(f"Found {len(local_columns)} tables in local database")
    
    # First: Check for schema differences and create migration if needed
    missing_columns = compare_schemas(remote_columns, local_columns)
    
    migration_created = False
    if missing_columns:
        total_missing = sum(len(cols) for cols in missing_columns.values())
        print(f"\nSchema differences found:")
        print(f"  Tables with missing columns: {len(missing_columns)}")
        print(f"  Total missing columns: {total_missing}")
        
        migration_created = generate_schema_migration(missing_columns)
    
    # Second: Analyze missing data
    tables_to_import = analyze_missing_data(remote_counts, local_counts)
    
    print("\n" + "="*100)
    print("SUMMARY")
    print("="*100)
    
    if migration_created:
        print("🔧 Schema migration created - apply this first with 'supabase db push'")
    
    if tables_to_import:
        total_records = sum(tables_to_import.values())
        print(f"📊 Data import needed:")
        print(f"  Tables needing import: {len(tables_to_import)}")
        print(f"  Total records to import: {total_records}")
        print("\nNext steps:")
        if migration_created:
            print("1. Apply schema migration: supabase db push")
            print("2. Re-run this script to generate import files after schema is updated")
        else:
            print("1. Generate import script for missing data")
    else:
        print("✅ No missing data found - all tables are up to date!")

if __name__ == "__main__":
    main()