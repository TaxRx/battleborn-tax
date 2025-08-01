#!/usr/bin/env python3
"""
Extract the 4 missing rd_* related functions from remote schema dump.
Creates a migration to add these missing functions and their triggers.
"""

import re
import sys

def extract_specific_functions(content):
    """Extract the 4 specific rd_* related functions."""
    function_names = [
        'archive_rd_federal_credit_version',
        'update_completion_percentage', 
        'update_rd_federal_credit_updated_at',
        'update_rd_state_proforma_data_updated_at'
    ]
    
    functions = []
    triggers = []
    
    for func_name in function_names:
        # Extract function definition
        func_pattern = f'CREATE FUNCTION public\\.{func_name}\\(\\).*?\\$\\$;'
        func_match = re.search(func_pattern, content, re.DOTALL)
        
        if func_match:
            functions.append(func_match.group(0))
            print(f"✅ Found function: {func_name}")
        else:
            print(f"❌ Missing function: {func_name}")
    
    # Extract associated triggers
    trigger_patterns = [
        'trigger_archive_rd_federal_credit_version',
        'trigger_update_completion_percentage',
        'trigger_update_rd_federal_credit_updated_at', 
        'trigger_update_rd_state_proforma_data_updated_at'
    ]
    
    for trigger_name in trigger_patterns:
        trigger_pattern = f'CREATE TRIGGER {trigger_name}.*?;'
        trigger_match = re.search(trigger_pattern, content, re.DOTALL)
        
        if trigger_match:
            triggers.append(trigger_match.group(0))
            print(f"✅ Found trigger: {trigger_name}")
        else:
            print(f"❌ Missing trigger: {trigger_name}")
    
    return functions, triggers

def main():
    remote_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_schema_dump_0731.sql'
    output_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/supabase/migrations/20250731254000_add_rd_functions.sql'
    
    print("🔍 Extracting rd_* related functions from remote schema...")
    
    with open(remote_file, 'r') as f:
        content = f.read()
    
    # Extract functions and triggers
    functions, triggers = extract_specific_functions(content)
    
    print(f"\n📊 Found:")
    print(f"  - {len(functions)} functions")
    print(f"  - {len(triggers)} triggers")
    
    if not functions and not triggers:
        print("❌ No rd_* functions or triggers found in remote schema")
        return
    
    # Create migration content
    migration_content = """-- Add missing rd_* related functions and triggers
-- Extracted from remote schema dump
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: CREATE FUNCTION statements for rd_* related functions
-- =============================================================================

"""
    
    # Add each function definition
    for i, func_def in enumerate(functions, 1):
        migration_content += f"-- Function {i}/{len(functions)}\n"
        migration_content += f"{func_def.strip()}\n\n"
    
    # Add triggers section
    if triggers:
        migration_content += """-- =============================================================================
-- SECTION 2: CREATE TRIGGER statements for rd_* related triggers
-- =============================================================================

"""
        
        for i, trigger_def in enumerate(triggers, 1):
            migration_content += f"-- Trigger {i}/{len(triggers)}\n"
            migration_content += f"{trigger_def.strip()}\n\n"
    
    # Write migration file
    with open(output_file, 'w') as f:
        f.write(migration_content)
    
    print(f"✅ Created functions migration: {output_file}")
    print(f"📋 Total components: {len(functions) + len(triggers)}")

if __name__ == "__main__":
    main()