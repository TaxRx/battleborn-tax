#!/usr/bin/env python3
"""
Fixed analysis of the new remote dump file to find schema differences and missing data.
"""

import re
import subprocess

def extract_columns_from_new_dump():
    """Extract column lists from INSERT statements in new remote dump"""
    
    print("Analyzing INSERT statements from new remote dump...")
    
    with open('/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_database_data_dump_new.sql', 'r') as f:
        content = f.read()
    
    # Find INSERT statements for public schema tables only
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
        return {}, {}
    
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

def main():
    """Main analysis function"""
    
    print("Analyzing new remote dump for schema differences and missing data...")
    
    # Get data from both sources
    remote_columns, remote_counts = extract_columns_from_new_dump()
    local_columns, local_counts = get_local_columns()
    
    print(f"\nFound INSERT statements for {len(remote_columns)} tables in new remote dump")
    print(f"Found {len(local_columns)} tables in local database")
    
    # Show summary of remote tables and counts
    print("\n" + "="*80)
    print("REMOTE DUMP SUMMARY")
    print("="*80)
    print(f"{'Table Name':<35} {'Records':<10}")
    print("-"*80)
    
    # Sort by record count descending
    for table in sorted(remote_counts.keys(), key=lambda x: remote_counts[x], reverse=True):
        count = remote_counts[table]
        print(f"{table:<35} {count:<10}")
    
    # Find tables that need data imported (have records remotely but 0 locally)
    tables_needing_import = {}
    for table in remote_counts:
        remote_count = remote_counts[table]
        local_count = local_counts.get(table, 0)
        
        if remote_count > local_count:
            tables_needing_import[table] = {
                'remote': remote_count,
                'local': local_count,
                'needed': remote_count - local_count
            }
    
    print("\n" + "="*80)
    print("TABLES NEEDING DATA IMPORT")
    print("="*80)
    print(f"{'Table Name':<35} {'Remote':<10} {'Local':<10} {'Need Import':<12}")
    print("-"*80)
    
    total_to_import = 0
    for table in sorted(tables_needing_import.keys(), key=lambda x: tables_needing_import[x]['needed'], reverse=True):
        info = tables_needing_import[table]
        print(f"{table:<35} {info['remote']:<10} {info['local']:<10} {info['needed']:<12}")
        total_to_import += info['needed']
    
    print("-"*80)
    print(f"Total records to import: {total_to_import}")
    
    print(f"\n✅ Analysis complete! New remote dump contains {total_to_import} records that need importing across {len(tables_needing_import)} tables.")

if __name__ == "__main__":
    main()