#!/usr/bin/env python3
"""
Create comprehensive import script from new remote dump.
Since this dump uses VALUES format, we'll extract all public schema tables.
"""

import re
import subprocess

def get_table_counts_from_dump():
    """Get table record counts from the new dump file"""
    
    print("Counting records per table in new remote dump...")
    
    with open('/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_database_data_dump_new.sql', 'r') as f:
        content = f.read()
    
    # Find all INSERT statements for public schema
    pattern = r'INSERT INTO public\.(\w+) VALUES'
    matches = re.findall(pattern, content)
    
    # Count occurrences per table
    table_counts = {}
    for table_name in matches:
        table_counts[table_name] = table_counts.get(table_name, 0) + 1
    
    return table_counts

def get_local_counts():
    """Get record counts from local database"""
    
    print("Querying local database record counts...")
    
    # Get all table names
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
    
    return local_counts

def extract_table_inserts(table_name):
    """Extract all INSERT statements for a specific table"""
    
    with open('/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_database_data_dump_new.sql', 'r') as f:
        content = f.read()
    
    # Find all INSERT statements for this table
    pattern = rf'INSERT INTO public\.{table_name} VALUES[^;]+;'
    inserts = re.findall(pattern, content, re.DOTALL)
    
    return inserts

def create_import_script(tables_to_import):
    """Create comprehensive import script"""
    
    if not tables_to_import:
        print("✅ No tables need importing!")
        return
    
    print(f"\n📝 Creating import script for {len(tables_to_import)} tables...")
    
    import_script = f"""-- Comprehensive Import from New Remote Database Dump
-- Generated automatically on $(date)
-- Tables: {', '.join(tables_to_import.keys())}
-- Total records: {sum(tables_to_import.values())}

BEGIN;

-- Disable triggers during import for performance
SET session_replication_role = replica;

"""
    
    total_records = 0
    for table_name, count in tables_to_import.items():
        print(f"  Extracting {count} records from {table_name}...")
        
        import_script += f"\n-- {table_name} data ({count} records)\n"
        
        # Extract INSERT statements for this table
        inserts = extract_table_inserts(table_name)
        for insert in inserts:
            import_script += insert + '\n'
        
        total_records += count
    
    import_script += """
-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
"""
    
    # Write the import script
    output_file = 'import_new_remote_data.sql'
    with open(output_file, 'w') as f:
        f.write(import_script)
    
    print(f"\n✅ Created {output_file} with {total_records} INSERT statements")

def main():
    """Main function"""
    
    # Get counts from both sources
    remote_counts = get_table_counts_from_dump()
    local_counts = get_local_counts()
    
    print("\n" + "="*80)
    print("DATA COMPARISON ANALYSIS")
    print("="*80)
    print(f"{'Table Name':<35} {'Remote':<10} {'Local':<10} {'Status':<15}")
    print("-"*80)
    
    tables_to_import = {}
    
    for table in sorted(set(remote_counts.keys()) | set(local_counts.keys())):
        remote_count = remote_counts.get(table, 0)
        local_count = local_counts.get(table, 0)
        
        if remote_count > local_count:
            status = "NEEDS IMPORT"
            tables_to_import[table] = remote_count
        elif remote_count == local_count and remote_count > 0:
            status = "COMPLETE"
        elif remote_count == 0 and local_count > 0:
            status = "LOCAL ONLY"
        else:
            status = "EMPTY"
        
        print(f"{table:<35} {remote_count:<10} {local_count:<10} {status:<15}")
    
    print("-"*80)
    print(f"Tables needing import: {len(tables_to_import)}")
    print(f"Total records to import: {sum(tables_to_import.values())}")
    
    # Create import script
    create_import_script(tables_to_import)

if __name__ == "__main__":
    main()