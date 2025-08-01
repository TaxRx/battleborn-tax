#!/usr/bin/env python3
"""
Extract all constraints, indexes, and policies for rd_* tables from remote schema dump.
Creates a migration to add these missing components.
"""

import re
import sys

def extract_check_constraints(content):
    """Extract CHECK constraints from table definitions."""
    constraints = []
    
    # Pattern to match CHECK constraints within CREATE TABLE statements
    # Look for rd_* tables and extract CHECK constraints
    table_pattern = r'CREATE TABLE public\.rd_\w+ \((.*?)\);'
    table_matches = re.findall(table_pattern, content, re.DOTALL)
    
    for table_def in table_matches:
        # Extract table name from the table definition context
        table_context = content[content.find(table_def)-200:content.find(table_def)]
        table_match = re.search(r'CREATE TABLE public\.(rd_\w+)', table_context)
        if not table_match:
            continue
        table_name = table_match.group(1)
        
        # Find CHECK constraints in this table
        check_pattern = r'CONSTRAINT (\w+) CHECK \((.*?)\)'
        check_matches = re.findall(check_pattern, table_def, re.DOTALL)
        
        for constraint_name, constraint_condition in check_matches:
            constraints.append({
                'table': table_name,
                'name': constraint_name,
                'condition': constraint_condition.strip()
            })
    
    return constraints

def extract_indexes(content):
    """Extract CREATE INDEX statements for rd_* tables."""
    indexes = []
    
    pattern = r'CREATE (?:UNIQUE )?INDEX (\w+) ON public\.(rd_\w+) .*?;'
    matches = re.findall(pattern, content, re.DOTALL)
    
    # Get full index statements
    full_pattern = r'CREATE (?:UNIQUE )?INDEX \w+ ON public\.rd_\w+ .*?;'
    full_matches = re.findall(full_pattern, content, re.DOTALL)
    
    return full_matches

def extract_policies(content):
    """Extract RLS policies for rd_* tables.""" 
    policies = []
    
    # Pattern to match CREATE POLICY statements for rd_* tables
    pattern = r'CREATE POLICY "([^"]+)" ON public\.(rd_\w+) .*?;'
    matches = re.findall(pattern, content, re.DOTALL)
    
    # Get full policy statements
    full_pattern = r'CREATE POLICY "[^"]+" ON public\.rd_\w+ .*?;'
    full_matches = re.findall(full_pattern, content, re.DOTALL)
    
    return full_matches

def extract_alter_table_constraints(content):
    """Extract ALTER TABLE ADD CONSTRAINT statements for rd_* tables (non-FK, non-PK)."""
    constraints = []
    
    # Get full constraint statements (excluding foreign keys and primary keys)
    full_pattern = r'ALTER TABLE ONLY public\.rd_\w+\s+ADD CONSTRAINT \w+ (?!FOREIGN KEY)(?!PRIMARY KEY).*?;'
    full_matches = re.findall(full_pattern, content, re.DOTALL)
    
    # Filter out primary key constraints (they contain "_pkey")
    filtered_matches = [match for match in full_matches if '_pkey' not in match]
    
    return filtered_matches

def main():
    remote_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_schema_dump_0731.sql'
    output_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/supabase/migrations/20250731252000_add_rd_constraints_indexes_policies.sql'
    
    print("🔍 Extracting constraints, indexes, and policies for rd_* tables...")
    
    with open(remote_file, 'r') as f:
        content = f.read()
    
    # Extract different components
    indexes = extract_indexes(content)
    policies = extract_policies(content)
    alter_constraints = extract_alter_table_constraints(content)
    
    print(f"📊 Found:")
    print(f"  - {len(indexes)} indexes")
    print(f"  - {len(policies)} RLS policies")
    print(f"  - {len(alter_constraints)} ALTER TABLE constraints")
    
    # Create migration content
    migration_content = """-- Add missing constraints, indexes, and policies for rd_* tables
-- Extracted from remote schema dump
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: INDEXES for rd_* tables
-- =============================================================================

"""
    
    if indexes:
        for index in indexes:
            migration_content += f"{index.strip()}\n"
        migration_content += "\n"
    
    # Add ALTER TABLE constraints (non-FK)
    if alter_constraints:
        migration_content += """-- =============================================================================
-- SECTION 2: Additional constraints (non-FK) for rd_* tables  
-- =============================================================================

"""
        for constraint in alter_constraints:
            migration_content += f"{constraint.strip()}\n"
        migration_content += "\n"
    
    # Add RLS policies
    if policies:
        migration_content += """-- =============================================================================
-- SECTION 3: Row Level Security (RLS) policies for rd_* tables
-- =============================================================================

"""
        for policy in policies:
            migration_content += f"{policy.strip()}\n"
        migration_content += "\n"
    
    # Write migration file
    with open(output_file, 'w') as f:
        f.write(migration_content)
    
    print(f"✅ Created migration: {output_file}")
    print(f"📋 Total components: {len(indexes) + len(policies) + len(alter_constraints)}")

if __name__ == "__main__":
    main()