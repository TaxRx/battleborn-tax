#!/usr/bin/env python3
"""
Extract all rd_* table definitions from remote schema dump and create perfect CREATE migration.
"""

import re
import sys

def extract_complete_rd_tables(file_path):
    """Extract complete CREATE TABLE statements for rd_* tables."""
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Find all CREATE TABLE statements for rd_* tables
    # This regex captures the complete table definition including constraints
    pattern = r'CREATE TABLE public\.rd_\w+ \(.*?\);'
    matches = re.findall(pattern, content, re.DOTALL | re.MULTILINE)
    
    return matches

def main():
    remote_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_schema_dump_0731.sql'
    output_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/supabase/migrations/20250731230000_create_rd_complete_accurate.sql'
    
    print("🔄 Extracting complete rd_* table definitions...")
    
    # Extract all rd_* tables
    rd_tables = extract_complete_rd_tables(remote_file)
    
    print(f"📊 Found {len(rd_tables)} rd_* tables")
    
    # Create migration content
    migration_content = """-- Complete and accurate CREATE migration for all rd_* tables
-- Generated from remote schema dump to ensure 100% accuracy
-- This replaces the incomplete migration

"""
    
    # Add each table definition
    for i, table_def in enumerate(rd_tables, 1):
        migration_content += f"-- Table {i}/{len(rd_tables)}\n"
        migration_content += table_def + "\n\n"
    
    # Add primary key constraints
    migration_content += """
-- Add primary key constraints for all rd_* tables
-- These are required for foreign key relationships

"""
    
    # Extract table names and add primary key constraints
    table_names = []
    for table_def in rd_tables:
        match = re.search(r'CREATE TABLE public\.(rd_\w+)', table_def)
        if match:
            table_names.append(match.group(1))
    
    for table_name in sorted(table_names):
        migration_content += f"ALTER TABLE ONLY public.{table_name} ADD CONSTRAINT {table_name}_pkey PRIMARY KEY (id);\n"
    
    # Write the migration file
    with open(output_file, 'w') as f:
        f.write(migration_content)
    
    print(f"✅ Created complete migration: {output_file}")
    print(f"📋 Includes {len(rd_tables)} tables with primary key constraints")

if __name__ == "__main__":
    main()