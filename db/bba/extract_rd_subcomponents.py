#!/usr/bin/env python3
"""
Extract rd_subcomponents table data from the remote database dump.
This table was missed in the original extraction.
"""

import re

def extract_rd_subcomponents():
    """Extract rd_subcomponents INSERT statements from dump file"""
    
    dump_file = 'remote_database_data_dump.sql'
    table_name = 'rd_subcomponents'
    
    print(f"Extracting {table_name} data from {dump_file}...")
    
    with open(dump_file, 'r') as f:
        content = f.read()
    
    # Pattern to match INSERT statements for the table
    pattern = rf'INSERT INTO public\.{table_name}.*?;'
    
    # Find all INSERT statements
    inserts = re.findall(pattern, content, re.DOTALL)
    
    print(f"Found {len(inserts)} INSERT statements for {table_name}")
    
    if not inserts:
        print(f"No data found for table {table_name}")
        return
    
    # Create import script
    import_script = f"""-- Import rd_subcomponents data from remote database
-- Generated on $(date)
-- Contains {len(inserts)} records

BEGIN;

-- Disable triggers during import for performance
SET session_replication_role = replica;

-- rd_subcomponents data
"""
    
    for insert in inserts:
        import_script += insert + '\n'
    
    import_script += """
-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
"""
    
    # Write the import script
    output_file = 'import_rd_subcomponents.sql'
    with open(output_file, 'w') as f:
        f.write(import_script)
    
    print(f"Created {output_file} with {len(inserts)} INSERT statements")

if __name__ == "__main__":
    extract_rd_subcomponents()