#!/usr/bin/env python3
"""
Analyze remote dump vs local database to find tables with missing data.
Generate import files for tables that are empty locally but have records in remote dump.
"""

import re
import subprocess
import json

def get_remote_table_counts():
    """Extract table names and record counts from remote dump"""
    
    print("Analyzing remote database dump...")
    
    with open('remote_database_data_dump.sql', 'r') as f:
        content = f.read()
    
    # Find all INSERT statements and count by table
    pattern = r'INSERT INTO public\.(\w+)'
    matches = re.findall(pattern, content)
    
    # Count records per table
    table_counts = {}
    for table in matches:
        table_counts[table] = table_counts.get(table, 0) + 1
    
    return table_counts

def get_local_table_counts():
    """Get record counts from local database"""
    
    print("Querying local database...")
    
    # Get list of tables first
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
    
    # Get counts for each table
    local_counts = {}
    for table in tables:
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
        else:
            local_counts[table] = 0
    
    return local_counts

def extract_table_data(table_name, record_count):
    """Extract INSERT statements for a specific table"""
    
    print(f"Extracting {record_count} records for {table_name}...")
    
    with open('remote_database_data_dump.sql', 'r') as f:
        content = f.read()
    
    # Pattern to match INSERT statements for the table
    pattern = rf'INSERT INTO public\.{table_name}.*?;'
    
    # Find all INSERT statements
    inserts = re.findall(pattern, content, re.DOTALL)
    
    return inserts

def create_import_script(tables_to_import):
    """Create a single import script for all missing tables"""
    
    if not tables_to_import:
        print("No tables need importing - all are already populated locally")
        return
    
    print(f"\nCreating import script for {len(tables_to_import)} tables...")
    
    import_script = f"""-- Import missing table data from remote database
-- Generated automatically
-- Tables: {', '.join(tables_to_import.keys())}
-- Total records: {sum(len(inserts) for inserts in tables_to_import.values())}

BEGIN;

-- Disable triggers during import for performance
SET session_replication_role = replica;

"""
    
    total_records = 0
    for table_name, inserts in tables_to_import.items():
        import_script += f"\n-- {table_name} data ({len(inserts)} records)\n"
        for insert in inserts:
            import_script += insert + '\n'
        total_records += len(inserts)
    
    import_script += """
-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
"""
    
    # Write the import script
    output_file = 'import_all_missing_tables.sql'
    with open(output_file, 'w') as f:
        f.write(import_script)
    
    print(f"Created {output_file} with {total_records} INSERT statements")

def main():
    """Main analysis function"""
    
    # Get counts from both sources
    remote_counts = get_remote_table_counts()
    local_counts = get_local_table_counts()
    
    print("\n" + "="*80)
    print("TABLE COMPARISON ANALYSIS")
    print("="*80)
    print(f"{'Table Name':<30} {'Remote':<10} {'Local':<10} {'Status':<15}")
    print("-"*80)
    
    tables_to_import = {}
    
    for table in sorted(set(remote_counts.keys()) | set(local_counts.keys())):
        remote_count = remote_counts.get(table, 0)
        local_count = local_counts.get(table, 0)
        
        if remote_count > 0 and local_count == 0:
            status = "NEEDS IMPORT"
            # Extract data for this table
            inserts = extract_table_data(table, remote_count)
            if inserts:
                tables_to_import[table] = inserts
        elif remote_count > local_count:
            status = "PARTIAL DATA"
        elif remote_count == local_count and remote_count > 0:
            status = "COMPLETE"
        elif remote_count == 0 and local_count == 0:
            status = "EMPTY"
        else:
            status = "LOCAL ONLY"
        
        print(f"{table:<30} {remote_count:<10} {local_count:<10} {status:<15}")
    
    print("-"*80)
    print(f"Tables needing import: {len(tables_to_import)}")
    
    # Create import script
    create_import_script(tables_to_import)

if __name__ == "__main__":
    main()