#!/usr/bin/env python3
"""
Comprehensive comparison of rd_* database objects between remote and local databases.
Generates a detailed markdown report showing differences in tables, functions, triggers, policies, etc.
"""

import re
import subprocess
import json
from datetime import datetime

def extract_remote_objects():
    """Extract all rd_* related database objects from remote schema"""
    
    print("Extracting rd_* objects from remote schema...")
    
    with open('/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_database_schema_full.sql', 'r') as f:
        content = f.read()
    
    objects = {
        'tables': {},
        'functions': {},
        'triggers': {},
        'policies': {},
        'indexes': {},
        'views': {},
        'sequences': {}
    }
    
    # Extract CREATE TABLE statements for rd_* tables
    table_pattern = r'CREATE TABLE public\.(rd_\w+)\s*\((.*?)\);'
    for match in re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE):
        table_name = match.group(1)
        table_def = match.group(0)
        objects['tables'][table_name] = table_def.strip()
    
    # Extract functions related to rd_*
    func_pattern = r'CREATE OR REPLACE FUNCTION[^;]*rd_[^;]*;'
    for match in re.finditer(func_pattern, content, re.DOTALL | re.IGNORECASE):
        func_def = match.group(0)
        # Extract function name
        name_match = re.search(r'FUNCTION\s+(?:public\.)?(\w*rd_\w*)', func_def, re.IGNORECASE)
        if name_match:
            func_name = name_match.group(1)
            objects['functions'][func_name] = func_def.strip()
    
    # Extract triggers on rd_* tables
    trigger_pattern = r'CREATE TRIGGER[^;]*(?:ON public\.rd_\w+|rd_\w+)[^;]*;'
    for match in re.finditer(trigger_pattern, content, re.DOTALL | re.IGNORECASE):
        trigger_def = match.group(0)
        # Extract trigger name
        name_match = re.search(r'CREATE TRIGGER\s+(\w+)', trigger_def, re.IGNORECASE)
        if name_match:
            trigger_name = name_match.group(1)
            objects['triggers'][trigger_name] = trigger_def.strip()
    
    # Extract RLS policies for rd_* tables
    policy_pattern = r'CREATE POLICY[^;]*ON public\.rd_\w+[^;]*;'
    for match in re.finditer(policy_pattern, content, re.DOTALL | re.IGNORECASE):
        policy_def = match.group(0)
        # Extract policy name
        name_match = re.search(r'CREATE POLICY\s+"?([^"]+)"?\s+ON', policy_def, re.IGNORECASE)
        if name_match:
            policy_name = name_match.group(1)
            objects['policies'][policy_name] = policy_def.strip()
    
    # Extract indexes on rd_* tables
    index_pattern = r'CREATE[^;]*INDEX[^;]*ON public\.rd_\w+[^;]*;'
    for match in re.finditer(index_pattern, content, re.DOTALL | re.IGNORECASE):
        index_def = match.group(0)
        # Extract index name
        name_match = re.search(r'INDEX\s+(?:IF NOT EXISTS\s+)?(\w+)', index_def, re.IGNORECASE)
        if name_match:
            index_name = name_match.group(1)
            objects['indexes'][index_name] = index_def.strip()
    
    # Extract views that reference rd_* tables
    view_pattern = r'CREATE VIEW[^;]*(?:FROM|JOIN)[^;]*rd_\w+[^;]*;'
    for match in re.finditer(view_pattern, content, re.DOTALL | re.IGNORECASE):
        view_def = match.group(0)
        # Extract view name
        name_match = re.search(r'CREATE VIEW\s+(?:public\.)?(\w+)', view_def, re.IGNORECASE)
        if name_match:
            view_name = name_match.group(1)
            objects['views'][view_name] = view_def.strip()
    
    # Extract sequences for rd_* tables
    seq_pattern = r'CREATE SEQUENCE[^;]*rd_\w+[^;]*;'
    for match in re.finditer(seq_pattern, content, re.DOTALL | re.IGNORECASE):
        seq_def = match.group(0)
        # Extract sequence name
        name_match = re.search(r'CREATE SEQUENCE\s+(?:public\.)?(\w*rd_\w*)', seq_def, re.IGNORECASE)
        if name_match:
            seq_name = name_match.group(1)
            objects['sequences'][seq_name] = seq_def.strip()
    
    return objects

def extract_local_objects():
    """Extract all rd_* related database objects from local database"""
    
    print("Extracting rd_* objects from local database...")
    
    objects = {
        'tables': {},
        'functions': {},
        'triggers': {},
        'policies': {},
        'indexes': {},
        'views': {},
        'sequences': {}
    }
    
    # Get tables
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        """
        SELECT 
            schemaname, 
            tablename,
            pg_get_tabledef('public.' || tablename) as table_def
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE 'rd_%'
        ORDER BY tablename;
        """
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 3 and parts[1].startswith('rd_'):
                    table_name = parts[1]
                    # Get proper table definition using pg_dump
                    table_def = get_local_table_def(table_name)
                    objects['tables'][table_name] = table_def
    
    # Get functions
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        """
        SELECT 
            proname,
            pg_get_functiondef(oid) as func_def
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname LIKE '%rd_%'
        ORDER BY proname;
        """
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 2 and 'rd_' in parts[0]:
                    func_name = parts[0]
                    func_def = parts[1] if len(parts) > 1 else ''
                    objects['functions'][func_name] = func_def
    
    # Get triggers on rd_* tables
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        """
        SELECT 
            t.tgname,
            pg_get_triggerdef(t.oid) as trigger_def
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname LIKE 'rd_%'
        AND NOT t.tgisinternal
        ORDER BY t.tgname;
        """
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 2:
                    trigger_name = parts[0]
                    trigger_def = parts[1] if len(parts) > 1 else ''
                    objects['triggers'][trigger_name] = trigger_def
    
    # Get RLS policies for rd_* tables
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        """
        SELECT 
            pol.policyname,
            'CREATE POLICY ' || quote_ident(pol.policyname) || ' ON ' || 
            quote_ident(c.relname) || ' FOR ' || pol.cmd || 
            ' TO ' || array_to_string(pol.roles, ', ') ||
            CASE WHEN pol.qual IS NOT NULL THEN ' USING (' || pg_get_expr(pol.qual, pol.polrelid) || ')' ELSE '' END ||
            CASE WHEN pol.with_check IS NOT NULL THEN ' WITH CHECK (' || pg_get_expr(pol.with_check, pol.polrelid) || ')' ELSE '' END || ';'
            as policy_def
        FROM pg_policy pol
        JOIN pg_class c ON pol.polrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
        AND c.relname LIKE 'rd_%'
        ORDER BY pol.policyname;
        """
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 2:
                    policy_name = parts[0]
                    policy_def = parts[1] if len(parts) > 1 else ''
                    objects['policies'][policy_name] = policy_def
    
    # Get indexes on rd_* tables
    cmd = [
        'psql', 
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '-t', '-c',
        """
        SELECT 
            i.indexname,
            i.indexdef
        FROM pg_indexes i
        WHERE i.schemaname = 'public'
        AND i.tablename LIKE 'rd_%'
        ORDER BY i.indexname;
        """
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|')]
                if len(parts) >= 2:
                    index_name = parts[0]
                    index_def = parts[1] if len(parts) > 1 else ''
                    objects['indexes'][index_name] = index_def
    
    return objects

def get_local_table_def(table_name):
    """Get table definition using pg_dump for consistent formatting"""
    cmd = [
        'pg_dump',
        'postgresql://postgres:postgres@localhost:54322/postgres',
        '--schema-only',
        '--no-owner',
        '--no-privileges',
        '-t', f'public.{table_name}'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        # Extract just the CREATE TABLE statement
        lines = result.stdout.split('\n')
        table_def_lines = []
        in_table = False
        
        for line in lines:
            if line.startswith(f'CREATE TABLE public.{table_name}'):
                in_table = True
            
            if in_table:
                table_def_lines.append(line)
                if line.strip().endswith(');'):
                    break
        
        return '\n'.join(table_def_lines)
    
    return ''

def compare_objects(remote_objects, local_objects):
    """Compare remote and local objects and categorize differences"""
    
    comparison = {}
    
    for obj_type in remote_objects.keys():
        comparison[obj_type] = {
            'same': [],
            'different': [],
            'remote_only': [],
            'local_only': []
        }
        
        remote_items = set(remote_objects[obj_type].keys())
        local_items = set(local_objects[obj_type].keys())
        
        # Items that exist in both
        common_items = remote_items & local_items
        for item in common_items:
            remote_def = remote_objects[obj_type][item].strip()
            local_def = local_objects[obj_type][item].strip()
            
            if remote_def == local_def:
                comparison[obj_type]['same'].append(item)
            else:
                comparison[obj_type]['different'].append({
                    'name': item,
                    'remote': remote_def,
                    'local': local_def
                })
        
        # Items only in remote
        remote_only = remote_items - local_items
        for item in remote_only:
            comparison[obj_type]['remote_only'].append({
                'name': item,
                'definition': remote_objects[obj_type][item]
            })
        
        # Items only in local
        local_only = local_items - remote_items
        for item in local_only:
            comparison[obj_type]['local_only'].append({
                'name': item,
                'definition': local_objects[obj_type][item]
            })
    
    return comparison

def generate_markdown_report(comparison):
    """Generate comprehensive markdown report"""
    
    report = f"""# RD_* Database Objects Comparison Report

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

"""
    
    # Generate summary table
    summary_data = []
    for obj_type, data in comparison.items():
        same_count = len(data['same'])
        diff_count = len(data['different'])
        remote_only_count = len(data['remote_only'])
        local_only_count = len(data['local_only'])
        total = same_count + diff_count + remote_only_count + local_only_count
        
        summary_data.append({
            'type': obj_type.title(),
            'total': total,
            'same': same_count,
            'different': diff_count,
            'remote_only': remote_only_count,
            'local_only': local_only_count
        })
    
    report += "| Object Type | Total | Same | Different | Remote Only | Local Only |\n"
    report += "|-------------|-------|------|-----------|-------------|------------|\n"
    
    for data in summary_data:
        report += f"| {data['type']} | {data['total']} | {data['same']} | {data['different']} | {data['remote_only']} | {data['local_only']} |\n"
    
    # Detailed sections for each object type
    for obj_type, data in comparison.items():
        if not any([data['same'], data['different'], data['remote_only'], data['local_only']]):
            continue
            
        report += f"\n## {obj_type.title()}\n\n"
        
        # Same objects
        if data['same']:
            report += f"### ✅ Identical ({len(data['same'])})\n\n"
            for item in sorted(data['same']):
                report += f"- `{item}`\n"
            report += "\n"
        
        # Different objects
        if data['different']:
            report += f"### 🔄 Different ({len(data['different'])})\n\n"
            for item in data['different']:
                report += f"#### `{item['name']}`\n\n"
                report += "**Remote:**\n```sql\n"
                report += item['remote']
                report += "\n```\n\n**Local:**\n```sql\n"
                report += item['local']
                report += "\n```\n\n"
        
        # Remote only objects
        if data['remote_only']:
            report += f"### ➕ Remote Only ({len(data['remote_only'])})\n\n"
            for item in data['remote_only']:
                report += f"#### `{item['name']}`\n\n"
                report += "```sql\n"
                report += item['definition']
                report += "\n```\n\n"
        
        # Local only objects
        if data['local_only']:
            report += f"### ➖ Local Only ({len(data['local_only'])})\n\n"
            for item in data['local_only']:
                report += f"#### `{item['name']}`\n\n"
                report += "```sql\n"
                report += item['definition']
                report += "\n```\n\n"
    
    return report

def main():
    """Main comparison function"""
    
    print("Starting comprehensive rd_* database objects comparison...")
    
    remote_objects = extract_remote_objects()
    local_objects = extract_local_objects()
    
    print(f"\nRemote objects found:")
    for obj_type, objects in remote_objects.items():
        print(f"  {obj_type}: {len(objects)}")
    
    print(f"\nLocal objects found:")
    for obj_type, objects in local_objects.items():
        print(f"  {obj_type}: {len(objects)}")
    
    comparison = compare_objects(remote_objects, local_objects)
    
    report = generate_markdown_report(comparison)
    
    # Write report to file
    report_file = 'rd_database_objects_comparison.md'
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\n✅ Comprehensive comparison report generated: {report_file}")

if __name__ == "__main__":
    main()