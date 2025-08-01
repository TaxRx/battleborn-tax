#!/usr/bin/env python3
"""
Create comprehensive migrations to sync local database with remote database.
Migration 1: Table structures, policies, triggers, indexes
Migration 2: Missing functions
"""

import re
import subprocess
import json
from datetime import datetime

def extract_remote_objects():
    """Extract all database objects from remote schema"""
    
    print("Extracting objects from remote schema...")
    
    with open('/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_database_schema_full.sql', 'r') as f:
        content = f.read()
    
    objects = {
        'tables': {},
        'triggers': {},
        'policies': {},
        'indexes': {},
        'functions': {}
    }
    
    # Extract CREATE TABLE statements for rd_* tables
    table_pattern = r'CREATE TABLE public\.(rd_\w+)\s*\((.*?)\);'
    for match in re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE):
        table_name = match.group(1)
        table_def = match.group(0)
        objects['tables'][table_name] = table_def.strip()
    
    # Extract triggers on rd_* tables
    trigger_pattern = r'CREATE TRIGGER\s+(\w+)[^;]*(?:ON public\.(rd_\w+)|ON (rd_\w+))[^;]*;'
    for match in re.finditer(trigger_pattern, content, re.DOTALL | re.IGNORECASE):
        trigger_def = match.group(0)
        trigger_name = match.group(1)
        objects['triggers'][trigger_name] = trigger_def.strip()
    
    # Extract RLS policies for rd_* tables
    policy_pattern = r'CREATE POLICY\s+"?([^"]+)"?\s+ON public\.(rd_\w+)[^;]*;'
    for match in re.finditer(policy_pattern, content, re.DOTALL | re.IGNORECASE):
        policy_def = match.group(0)
        policy_name = match.group(1)
        table_name = match.group(2)
        policy_key = f"{table_name}_{policy_name}"
        objects['policies'][policy_key] = policy_def.strip()
    
    # Extract indexes on rd_* tables
    index_pattern = r'CREATE[^;]*INDEX\s+(\w+)[^;]*ON public\.(rd_\w+)[^;]*;'
    for match in re.finditer(index_pattern, content, re.DOTALL | re.IGNORECASE):
        index_def = match.group(0)
        index_name = match.group(1)
        objects['indexes'][index_name] = index_def.strip()
    
    # Extract ALL functions
    func_pattern = r'CREATE (?:OR REPLACE )?FUNCTION\s+(?:public\.)?(\w+)\s*\([^)]*\).*?(?=CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|TABLE|INDEX|TRIGGER|POLICY|VIEW)|$)'
    
    matches = re.finditer(func_pattern, content, re.DOTALL | re.IGNORECASE)
    
    for match in matches:
        func_name = match.group(1)
        func_def = match.group(0).strip()
        
        # Clean up the function definition
        lines = func_def.split('\n')
        cleaned_lines = []
        brace_count = 0
        in_function = False
        
        for line in lines:
            if 'CREATE' in line and 'FUNCTION' in line:
                in_function = True
            
            if in_function:
                cleaned_lines.append(line)
                
                if '$$' in line:
                    brace_count += line.count('$$')
                elif line.strip().endswith(';') and brace_count % 2 == 0:
                    break
        
        objects['functions'][func_name] = '\n'.join(cleaned_lines)
    
    return objects

def extract_local_objects():
    """Extract relevant objects from local database"""
    
    print("Extracting objects from local database...")
    
    objects = {
        'tables': {},
        'triggers': {},
        'policies': {},
        'indexes': {},
        'functions': {}
    }
    
    # Get rd_* tables using pg_dump
    cmd = [
        'pg_dump',
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '--schema-only',
        '--no-owner',
        '--no-privileges',
        '-t', 'public.rd_*'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        content = result.stdout
        
        # Extract tables
        table_pattern = r'CREATE TABLE public\.(rd_\w+)\s*\((.*?)\);'
        for match in re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE):
            table_name = match.group(1)
            table_def = match.group(0)
            objects['tables'][table_name] = table_def.strip()
        
        # Extract triggers
        trigger_pattern = r'CREATE TRIGGER\s+(\w+)[^;]*(?:ON public\.(rd_\w+)|ON (rd_\w+))[^;]*;'
        for match in re.finditer(trigger_pattern, content, re.DOTALL | re.IGNORECASE):
            trigger_def = match.group(0)
            trigger_name = match.group(1)
            objects['triggers'][trigger_name] = trigger_def.strip()
        
        # Extract policies
        policy_pattern = r'CREATE POLICY\s+"?([^"]+)"?\s+ON public\.(rd_\w+)[^;]*;'
        for match in re.finditer(policy_pattern, content, re.DOTALL | re.IGNORECASE):
            policy_def = match.group(0)
            policy_name = match.group(1)
            table_name = match.group(2)
            policy_key = f"{table_name}_{policy_name}"
            objects['policies'][policy_key] = policy_def.strip()
        
        # Extract indexes
        index_pattern = r'CREATE[^;]*INDEX\s+(\w+)[^;]*ON public\.(rd_\w+)[^;]*;'
        for match in re.finditer(index_pattern, content, re.DOTALL | re.IGNORECASE):
            index_def = match.group(0)
            index_name = match.group(1)
            objects['indexes'][index_name] = index_def.strip()
    
    # Get functions from local database
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        """
        SELECT 
            p.proname as function_name,
            pg_get_functiondef(p.oid) as function_definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        ORDER BY p.proname;
        """
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|', 1)]
                if len(parts) >= 2:
                    func_name = parts[0]
                    func_def = parts[1] if parts[1] else ''
                    if func_name and func_def:
                        objects['functions'][func_name] = func_def
    
    return objects

def normalize_sql(sql):
    """Normalize SQL for comparison"""
    if not sql:
        return ''
    sql = re.sub(r'\s+', ' ', sql.strip())
    sql = re.sub(r'CREATE OR REPLACE', 'CREATE', sql, flags=re.IGNORECASE)
    return sql.rstrip(';')

def create_structure_migration(remote_objects, local_objects):
    """Create migration for table structures, policies, triggers, indexes"""
    
    print("Creating structure migration...")
    
    # Create migration using supabase CLI
    result = subprocess.run(['supabase', 'migration', 'new', 'sync_remote_database_structure'], 
                          capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error creating migration: {result.stderr}")
        return None
    
    # Extract migration filename
    migration_file = None
    for line in result.stdout.split('\n'):
        if 'Created new migration at' in line:
            migration_file = line.split('at ')[1].strip()
            break
    
    if not migration_file:
        print("Could not determine migration filename")
        return None
    
    migration_script = f"""-- Sync Remote Database Structure
-- Purpose: Align local database structure with remote database
-- Date: {datetime.now().strftime('%Y-%m-%d')}
-- Includes: Table changes, policies, triggers, indexes

BEGIN;

"""
    
    # Analyze differences and generate migration script
    changes_made = False
    
    # 1. Handle table differences
    table_changes = []
    for table_name in remote_objects['tables']:
        if table_name in local_objects['tables']:
            remote_def = normalize_sql(remote_objects['tables'][table_name])
            local_def = normalize_sql(local_objects['tables'][table_name])
            if remote_def != local_def:
                table_changes.append(f"-- Table {table_name} has differences - manual review needed")
                table_changes.append(f"-- Remote definition differs from local")
        else:
            # Table missing locally
            table_changes.append(f"-- Create missing table: {table_name}")
            table_changes.append(remote_objects['tables'][table_name] + ";")
    
    if table_changes:
        migration_script += "-- TABLE CHANGES\n"
        migration_script += "\n".join(table_changes) + "\n\n"
        changes_made = True
    
    # 2. Handle missing triggers
    missing_triggers = []
    for trigger_name in remote_objects['triggers']:
        if trigger_name not in local_objects['triggers']:
            missing_triggers.append(remote_objects['triggers'][trigger_name])
    
    if missing_triggers:
        migration_script += "-- MISSING TRIGGERS\n"
        for trigger in missing_triggers:
            migration_script += trigger + ";\n"
        migration_script += "\n"
        changes_made = True
    
    # 3. Handle missing policies
    missing_policies = []
    for policy_key in remote_objects['policies']:
        if policy_key not in local_objects['policies']:
            missing_policies.append(remote_objects['policies'][policy_key])
    
    if missing_policies:
        migration_script += "-- MISSING RLS POLICIES\n"
        for policy in missing_policies:
            migration_script += policy + ";\n"
        migration_script += "\n"
        changes_made = True
    
    # 4. Handle missing indexes
    missing_indexes = []
    for index_name in remote_objects['indexes']:
        if index_name not in local_objects['indexes']:
            missing_indexes.append(remote_objects['indexes'][index_name])
    
    if missing_indexes:
        migration_script += "-- MISSING INDEXES\n"
        for index in missing_indexes:
            migration_script += index + ";\n"
        migration_script += "\n"
        changes_made = True
    
    migration_script += "COMMIT;\n"
    
    if not changes_made:
        migration_script += "-- No structural changes needed\n"
    
    # Write migration file
    with open(migration_file, 'w') as f:
        f.write(migration_script)
    
    print(f"Created structure migration: {migration_file}")
    return migration_file

def create_functions_migration(remote_objects, local_objects):
    """Create migration for missing functions"""
    
    print("Creating functions migration...")
    
    # Create migration using supabase CLI
    result = subprocess.run(['supabase', 'migration', 'new', 'sync_remote_database_functions'], 
                          capture_output=True, text=True)
    
    if result.returncode != 0:
        print(f"Error creating migration: {result.stderr}")
        return None
    
    # Extract migration filename
    migration_file = None
    for line in result.stdout.split('\n'):
        if 'Created new migration at' in line:
            migration_file = line.split('at ')[1].strip()
            break
    
    if not migration_file:
        print("Could not determine migration filename")
        return None
    
    migration_script = f"""-- Sync Remote Database Functions
-- Purpose: Add missing functions from remote database
-- Date: {datetime.now().strftime('%Y-%m-%d')}

BEGIN;

"""
    
    # Find missing functions
    missing_functions = []
    different_functions = []
    
    for func_name in remote_objects['functions']:
        if func_name not in local_objects['functions']:
            missing_functions.append({
                'name': func_name,
                'definition': remote_objects['functions'][func_name]
            })
        else:
            remote_func = normalize_sql(remote_objects['functions'][func_name])
            local_func = normalize_sql(local_objects['functions'][func_name])
            if remote_func != local_func:
                different_functions.append({
                    'name': func_name,
                    'definition': remote_objects['functions'][func_name]
                })
    
    if missing_functions:
        migration_script += f"-- MISSING FUNCTIONS ({len(missing_functions)})\n"
        for func in missing_functions:
            migration_script += f"-- Function: {func['name']}\n"
            migration_script += func['definition'] + ";\n\n"
    
    if different_functions:
        migration_script += f"-- DIFFERENT FUNCTIONS ({len(different_functions)})\n"
        migration_script += "-- These functions exist locally but differ from remote\n"
        migration_script += "-- Review and update as needed\n\n"
        for func in different_functions:
            migration_script += f"-- Function: {func['name']} (REVIEW NEEDED)\n"
            migration_script += f"-- {func['definition']};\n\n"
    
    if not missing_functions and not different_functions:
        migration_script += "-- No function changes needed\n"
    
    migration_script += "COMMIT;\n"
    
    # Write migration file
    with open(migration_file, 'w') as f:
        f.write(migration_script)
    
    print(f"Created functions migration: {migration_file}")
    return migration_file

def main():
    """Main migration creation function"""
    
    print("Creating comprehensive sync migrations...")
    
    remote_objects = extract_remote_objects()
    local_objects = extract_local_objects()
    
    print(f"\nRemote objects:")
    for obj_type, objects in remote_objects.items():
        print(f"  {obj_type}: {len(objects)}")
    
    print(f"\nLocal objects:")
    for obj_type, objects in local_objects.items():
        print(f"  {obj_type}: {len(objects)}")
    
    # Create migrations
    structure_migration = create_structure_migration(remote_objects, local_objects)
    functions_migration = create_functions_migration(remote_objects, local_objects)
    
    print(f"\n✅ Sync migrations created:")
    if structure_migration:
        print(f"  1. Structure: {structure_migration}")
    if functions_migration:
        print(f"  2. Functions: {functions_migration}")
    
    print(f"\nApply in order:")
    print(f"  supabase db push")

if __name__ == "__main__":
    main()