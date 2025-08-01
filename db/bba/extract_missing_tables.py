#!/usr/bin/env python3
"""
Extract missing tables from the dump file that weren't included in the main import.
Focus on the most important tables for application functionality.
"""

import re

# Define important missing tables (order matters for FK dependencies)
IMPORTANT_TABLES = [
    'tax_profiles',
    'tax_calculations', 
    'tool_enrollments',
    'rd_roles',  # Must come before rd_employees (FK dependency)
    'rd_employees',
    'rd_contractors',
    'rd_supplies',
    'rd_client_portal_tokens',
    'rd_reports',
    'rd_signature_records'
]

def extract_table_data(dump_file, table_name):
    """Extract all INSERT statements for a specific table"""
    with open(dump_file, 'r') as f:
        content = f.read()
    
    # Pattern to match all INSERT statements for the table
    pattern = f"INSERT INTO public\\.{table_name}.*?;"
    matches = re.findall(pattern, content, re.DOTALL)
    
    return matches

def main():
    dump_file = 'remote_database_data_dump.sql'
    output_file = 'import_missing_tables.sql'
    
    print("Extracting missing table data...")
    
    with open(output_file, 'w') as out:
        # Write header
        out.write("""-- Import Missing Tables from Remote Database
-- Created: 2025-07-29
-- Purpose: Import tables that were excluded from the main import

BEGIN;

-- Disable triggers to prevent FK constraint issues during import
SET session_replication_role = replica;

""")
        
        for table in IMPORTANT_TABLES:
            print(f"Extracting {table}...")
            
            inserts = extract_table_data(dump_file, table)
            
            if inserts:
                out.write(f"\n-- Data for Name: {table}; Type: TABLE DATA; Schema: public; Owner: postgres\n\n")
                
                for insert in inserts:
                    # Clean up the insert statement
                    clean_insert = insert.strip()
                    if not clean_insert.endswith(';'):
                        clean_insert += ';'
                    out.write(clean_insert + '\n')
                
                print(f"  Found {len(inserts)} records for {table}")
            else:
                print(f"  No data found for {table}")
        
        # Write footer
        out.write("""
-- Re-enable triggers
SET session_replication_role = DEFAULT;

COMMIT;
""")
    
    print(f"\nMissing tables data extracted to: {output_file}")

if __name__ == "__main__":
    main()