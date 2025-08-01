#!/usr/bin/env python3
"""
Fixed comprehensive comparison of rd_* database objects between remote and local databases.
"""

import re
import subprocess
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
        'indexes': {}
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
        name_match = re.search(r'FUNCTION\s+(?:public\.)?(\w*rd_\w*)', func_def, re.IGNORECASE)
        if name_match:
            func_name = name_match.group(1)
            objects['functions'][func_name] = func_def.strip()
    
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
        objects['policies'][policy_name] = policy_def.strip()
    
    # Extract indexes on rd_* tables
    index_pattern = r'CREATE[^;]*INDEX\s+(\w+)[^;]*ON public\.(rd_\w+)[^;]*;'
    for match in re.finditer(index_pattern, content, re.DOTALL | re.IGNORECASE):
        index_def = match.group(0)
        index_name = match.group(1)
        objects['indexes'][index_name] = index_def.strip()
    
    return objects

def extract_local_objects():
    """Extract all rd_* related database objects from local database"""
    
    print("Extracting rd_* objects from local database...")
    
    objects = {
        'tables': {},
        'functions': {},
        'triggers': {},
        'policies': {},
        'indexes': {}
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
        
        # Extract CREATE TABLE statements
        table_pattern = r'CREATE TABLE public\.(rd_\w+)\s*\((.*?)\);'
        for match in re.finditer(table_pattern, content, re.DOTALL | re.IGNORECASE):
            table_name = match.group(1)
            table_def = match.group(0)
            objects['tables'][table_name] = table_def.strip()
        
        # Extract functions
        func_pattern = r'CREATE OR REPLACE FUNCTION[^;]*rd_[^;]*;'
        for match in re.finditer(func_pattern, content, re.DOTALL | re.IGNORECASE):
            func_def = match.group(0)
            name_match = re.search(r'FUNCTION\s+(?:public\.)?(\w*rd_\w*)', func_def, re.IGNORECASE)
            if name_match:
                func_name = name_match.group(1)
                objects['functions'][func_name] = func_def.strip()
        
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
            objects['policies'][policy_name] = policy_def.strip()
        
        # Extract indexes
        index_pattern = r'CREATE[^;]*INDEX\s+(\w+)[^;]*ON public\.(rd_\w+)[^;]*;'
        for match in re.finditer(index_pattern, content, re.DOTALL | re.IGNORECASE):
            index_def = match.group(0)
            index_name = match.group(1)
            objects['indexes'][index_name] = index_def.strip()
    
    return objects

def normalize_sql(sql):
    """Normalize SQL for comparison by removing extra whitespace and standardizing format"""
    # Remove comments
    sql = re.sub(r'--.*$', '', sql, flags=re.MULTILINE)
    # Normalize whitespace
    sql = re.sub(r'\s+', ' ', sql).strip()
    # Remove trailing semicolon for consistent comparison
    sql = sql.rstrip(';')
    return sql

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
            remote_def = normalize_sql(remote_objects[obj_type][item])
            local_def = normalize_sql(local_objects[obj_type][item])
            
            if remote_def == local_def:
                comparison[obj_type]['same'].append(item)
            else:
                comparison[obj_type]['different'].append({
                    'name': item,
                    'remote': remote_objects[obj_type][item],
                    'local': local_objects[obj_type][item]
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

def generate_diff(text1, text2):
    """Generate a simple text diff highlighting the differences"""
    lines1 = text1.split('\n')
    lines2 = text2.split('\n')
    
    diff_output = []
    max_lines = max(len(lines1), len(lines2))
    
    for i in range(max_lines):
        line1 = lines1[i] if i < len(lines1) else ''
        line2 = lines2[i] if i < len(lines2) else ''
        
        if line1 != line2:
            if line1:
                diff_output.append(f"- {line1}")
            if line2:
                diff_output.append(f"+ {line2}")
        else:
            diff_output.append(f"  {line1}")
    
    return '\n'.join(diff_output)

def generate_markdown_report(comparison):
    """Generate comprehensive markdown report"""
    
    report = f"""# RD_* Database Objects Comparison Report

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

"""
    
    # Generate summary table
    summary_data = []
    total_issues = 0
    
    for obj_type, data in comparison.items():
        same_count = len(data['same'])
        diff_count = len(data['different'])
        remote_only_count = len(data['remote_only'])
        local_only_count = len(data['local_only'])
        total = same_count + diff_count + remote_only_count + local_only_count
        
        issues = diff_count + remote_only_count + local_only_count
        total_issues += issues
        
        summary_data.append({
            'type': obj_type.title(),
            'total': total,
            'same': same_count,
            'different': diff_count,
            'remote_only': remote_only_count,
            'local_only': local_only_count,
            'issues': issues
        })
    
    report += "| Object Type | Total | Same | Different | Remote Only | Local Only | Issues |\n"
    report += "|-------------|-------|------|-----------|-------------|------------|--------|\n"
    
    for data in summary_data:
        status = "✅" if data['issues'] == 0 else "⚠️" if data['issues'] < 5 else "❌"
        report += f"| {status} {data['type']} | {data['total']} | {data['same']} | {data['different']} | {data['remote_only']} | {data['local_only']} | {data['issues']} |\n"
    
    report += f"\n**Total Issues: {total_issues}**\n"
    
    # Priority recommendations
    report += "\n## Priority Actions\n\n"
    
    high_priority = []
    medium_priority = []
    
    for obj_type, data in comparison.items():
        if data['remote_only']:
            high_priority.append(f"**{len(data['remote_only'])} {obj_type}** missing locally - need to create")
        if data['different']:
            medium_priority.append(f"**{len(data['different'])} {obj_type}** have differences - need to review and sync")
        if data['local_only']:
            medium_priority.append(f"**{len(data['local_only'])} {obj_type}** exist only locally - may need to remove or keep")
    
    if high_priority:
        report += "### 🔴 High Priority\n"
        for item in high_priority:
            report += f"- {item}\n"
        report += "\n"
    
    if medium_priority:
        report += "### 🟡 Medium Priority\n"
        for item in medium_priority:
            report += f"- {item}\n"
        report += "\n"
    
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
        
        # Different objects with diffs
        if data['different']:
            report += f"### 🔄 Different ({len(data['different'])})\n\n"
            for item in data['different']:
                report += f"#### `{item['name']}`\n\n"
                report += "**Difference:**\n```diff\n"
                diff = generate_diff(item['local'], item['remote'])
                report += diff
                report += "\n```\n\n"
        
        # Remote only objects
        if data['remote_only']:
            report += f"### ➕ Missing Locally ({len(data['remote_only'])})\n\n"
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
    report_file = 'rd_database_objects_comparison_detailed.md'
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\n✅ Comprehensive comparison report generated: {report_file}")

if __name__ == "__main__":
    main()