#!/usr/bin/env python3
"""
Extract missing form_6765_overrides table and missing rd_* triggers from remote schema dump.
Creates a migration to add these missing components.
"""

import re
import sys

def extract_form_6765_overrides_table(content):
    """Extract the form_6765_overrides table definition."""
    pattern = r'CREATE TABLE public\.form_6765_overrides \(.*?\);'
    match = re.search(pattern, content, re.DOTALL)
    
    if match:
        return match.group(0)
    return None

def extract_missing_triggers(content):
    """Extract all rd_* table triggers that are missing."""
    
    # List of tables mentioned as needing triggers
    tables_needing_triggers = [
        'rd_business_years',
        'rd_contractor_subcomponents', 
        'rd_contractor_year_data',
        'rd_federal_credit_results',
        'rd_reports',
        'rd_roles',
        'rd_selected_subcomponents',
        'rd_state_calculations',
        'rd_supplies',
        'rd_supply_subcomponents',
        'rd_supply_year_data'
    ]
    
    triggers = []
    functions = set()  # Use set to avoid duplicates
    
    for table in tables_needing_triggers:
        # Search for triggers on this specific table
        trigger_pattern = f'CREATE TRIGGER \\w+ (?:BEFORE|AFTER) (?:INSERT|UPDATE|DELETE) .*? ON public\\.{table} .*?;'
        trigger_matches = re.findall(trigger_pattern, content, re.DOTALL)
        
        for trigger_match in trigger_matches:
            triggers.append(trigger_match)
            print(f"✅ Found trigger for {table}: {trigger_match[:50]}...")
            
            # Extract function name from trigger
            func_match = re.search(r'EXECUTE FUNCTION public\\.([^\\(]+)\\(\\)', trigger_match)
            if func_match:
                func_name = func_match.group(1)
                functions.add(func_name)
    
    return triggers, list(functions)

def extract_functions(content, function_names):
    """Extract function definitions for the given function names."""
    functions = []
    
    for func_name in function_names:
        # Search for function definition
        func_pattern = f'CREATE FUNCTION public\\.{func_name}\\(\\).*?\\$\\$;'
        func_match = re.search(func_pattern, content, re.DOTALL)
        
        if func_match:
            functions.append(func_match.group(0))
            print(f"✅ Found function: {func_name}")
        else:
            print(f"❌ Missing function: {func_name}")
    
    return functions

def main():
    remote_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_schema_dump_0731.sql'
    output_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/supabase/migrations/20250731255000_add_missing_table_and_triggers.sql'
    
    print("🔍 Extracting missing table and triggers from remote schema...")
    
    with open(remote_file, 'r') as f:
        content = f.read()
    
    # Extract components
    form_table = extract_form_6765_overrides_table(content)
    triggers, function_names = extract_missing_triggers(content)
    functions = extract_functions(content, function_names)
    
    print(f"\n📊 Found:")
    print(f"  - {'1 table' if form_table else '0 tables'} (form_6765_overrides)")
    print(f"  - {len(functions)} functions")
    print(f"  - {len(triggers)} triggers")
    
    if not form_table and not triggers and not functions:
        print("❌ No missing components found")
        return
    
    # Create migration content
    migration_content = """-- Add missing table and triggers
-- Extracted from remote schema dump
-- Date: 2025-07-31

"""
    
    # Add table section
    if form_table:
        migration_content += """-- =============================================================================
-- SECTION 1: Missing table - form_6765_overrides
-- =============================================================================

"""
        migration_content += f"{form_table.strip()}\n"
        migration_content += "ALTER TABLE ONLY public.form_6765_overrides ADD CONSTRAINT form_6765_overrides_pkey PRIMARY KEY (id);\n\n"
    
    # Add functions section
    if functions:
        migration_content += """-- =============================================================================
-- SECTION 2: Missing trigger functions
-- =============================================================================

"""
        for i, func_def in enumerate(functions, 1):
            migration_content += f"-- Function {i}/{len(functions)}\n"
            migration_content += f"{func_def.strip()}\n\n"
    
    # Add triggers section
    if triggers:
        migration_content += """-- =============================================================================
-- SECTION 3: Missing triggers for rd_* tables
-- =============================================================================

"""
        for i, trigger_def in enumerate(triggers, 1):
            migration_content += f"-- Trigger {i}/{len(triggers)}\n"
            migration_content += f"{trigger_def.strip()}\n\n"
    
    # Write migration file
    with open(output_file, 'w') as f:
        f.write(migration_content)
    
    print(f"✅ Created migration: {output_file}")
    print(f"📋 Total components: {(1 if form_table else 0) + len(functions) + len(triggers)}")

if __name__ == "__main__":
    main()