#!/usr/bin/env python3
"""
Comprehensive analysis of ALL functions in remote vs local databases.
"""

import re
import subprocess
from datetime import datetime

def extract_remote_functions():
    """Extract ALL functions from remote schema"""
    
    print("Extracting ALL functions from remote schema...")
    
    with open('/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_database_schema_full.sql', 'r') as f:
        content = f.read()
    
    functions = {}
    
    # Extract ALL CREATE FUNCTION or CREATE OR REPLACE FUNCTION statements
    func_pattern = r'CREATE (?:OR REPLACE )?FUNCTION\s+(?:public\.)?(\w+)\s*\([^)]*\).*?(?=CREATE\s+(?:OR\s+REPLACE\s+)?(?:FUNCTION|TABLE|INDEX|TRIGGER|POLICY|VIEW)|$)'
    
    matches = re.finditer(func_pattern, content, re.DOTALL | re.IGNORECASE)
    
    for match in matches:
        func_name = match.group(1)
        func_def = match.group(0).strip()
        
        # Clean up the function definition to end at the proper boundary
        lines = func_def.split('\n')
        cleaned_lines = []
        brace_count = 0
        in_function = False
        
        for line in lines:
            if 'CREATE' in line and 'FUNCTION' in line:
                in_function = True
            
            if in_function:
                cleaned_lines.append(line)
                
                # Count $$ delimiters or semicolons to find function end
                if '$$' in line:
                    brace_count += line.count('$$')
                elif line.strip().endswith(';') and brace_count % 2 == 0:
                    break
        
        functions[func_name] = '\n'.join(cleaned_lines)
    
    print(f"Found {len(functions)} functions in remote schema")
    return functions

def extract_local_functions():
    """Extract ALL functions from local database"""
    
    print("Extracting ALL functions from local database...")
    
    functions = {}
    
    # Get all function names and definitions from local database
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
        AND p.prokind = 'f'  -- Only functions, not procedures
        ORDER BY p.proname;
        """
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        for line in result.stdout.split('\n'):
            line = line.strip()
            if line and '|' in line:
                parts = [p.strip() for p in line.split('|', 1)]  # Split on first | only
                if len(parts) >= 2:
                    func_name = parts[0]
                    func_def = parts[1] if parts[1] else ''
                    if func_name and func_def:
                        functions[func_name] = func_def
    
    print(f"Found {len(functions)} functions in local database")
    return functions

def normalize_function_sql(sql):
    """Normalize function SQL for comparison"""
    if not sql:
        return ''
    
    # Remove extra whitespace and normalize
    sql = re.sub(r'\s+', ' ', sql.strip())
    
    # Remove common variations that don't affect functionality
    sql = re.sub(r'CREATE OR REPLACE FUNCTION', 'CREATE FUNCTION', sql, flags=re.IGNORECASE)
    sql = re.sub(r'public\.', '', sql)  # Remove schema prefix
    
    return sql

def compare_functions(remote_functions, local_functions):
    """Compare functions between remote and local"""
    
    comparison = {
        'same': [],
        'different': [],
        'remote_only': [],
        'local_only': []
    }
    
    all_functions = set(remote_functions.keys()) | set(local_functions.keys())
    
    for func_name in all_functions:
        if func_name in remote_functions and func_name in local_functions:
            remote_sql = normalize_function_sql(remote_functions[func_name])
            local_sql = normalize_function_sql(local_functions[func_name])
            
            if remote_sql == local_sql:
                comparison['same'].append(func_name)
            else:
                comparison['different'].append({
                    'name': func_name,
                    'remote': remote_functions[func_name],
                    'local': local_functions[func_name]
                })
        elif func_name in remote_functions:
            comparison['remote_only'].append({
                'name': func_name,
                'definition': remote_functions[func_name]
            })
        else:  # local only
            comparison['local_only'].append({
                'name': func_name,
                'definition': local_functions[func_name]
            })
    
    return comparison

def generate_function_diff(remote_sql, local_sql):
    """Generate a readable diff between two function definitions"""
    remote_lines = remote_sql.split('\n')
    local_lines = local_sql.split('\n')
    
    max_lines = max(len(remote_lines), len(local_lines))
    diff_lines = []
    
    for i in range(max_lines):
        remote_line = remote_lines[i] if i < len(remote_lines) else ''
        local_line = local_lines[i] if i < len(local_lines) else ''
        
        if remote_line != local_line:
            if remote_line.strip():
                diff_lines.append(f"- {remote_line}")
            if local_line.strip():
                diff_lines.append(f"+ {local_line}")
        else:
            if remote_line.strip():  # Only show non-empty matching lines
                diff_lines.append(f"  {remote_line}")
    
    return '\n'.join(diff_lines)

def generate_functions_report(comparison):
    """Generate markdown report for functions comparison"""
    
    total_functions = len(comparison['same']) + len(comparison['different']) + len(comparison['remote_only']) + len(comparison['local_only'])
    issues = len(comparison['different']) + len(comparison['remote_only']) + len(comparison['local_only'])
    
    report = f"""# Database Functions Comparison Report

Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Summary

| Status | Count | Description |
|--------|-------|-------------|
| ✅ Identical | {len(comparison['same'])} | Functions that are exactly the same |
| 🔄 Different | {len(comparison['different'])} | Functions that exist in both but differ |
| ➕ Remote Only | {len(comparison['remote_only'])} | Functions missing from local database |
| ➖ Local Only | {len(comparison['local_only'])} | Functions missing from remote database |
| **Total** | **{total_functions}** | **Total functions analyzed** |
| **Issues** | **{issues}** | **Functions requiring attention** |

"""
    
    if issues == 0:
        report += "🎉 **All functions are synchronized!**\n\n"
    else:
        report += f"⚠️ **{issues} functions need attention**\n\n"
    
    # Priority recommendations
    if comparison['remote_only']:
        report += "### 🔴 High Priority: Missing Functions\n"
        report += f"**{len(comparison['remote_only'])} functions** exist in remote but not locally. These should be created:\n"
        for func in comparison['remote_only']:
            report += f"- `{func['name']}`\n"
        report += "\n"
    
    if comparison['different']:
        report += "### 🟡 Medium Priority: Different Functions\n"
        report += f"**{len(comparison['different'])} functions** have differences that should be reviewed:\n"
        for func in comparison['different']:
            report += f"- `{func['name']}`\n"
        report += "\n"
    
    if comparison['local_only']:
        report += "### 🟢 Low Priority: Local Only Functions\n"
        report += f"**{len(comparison['local_only'])} functions** exist only locally. Review if needed:\n"
        for func in comparison['local_only']:
            report += f"- `{func['name']}`\n"
        report += "\n"
    
    # Detailed sections
    if comparison['same']:
        report += f"## ✅ Identical Functions ({len(comparison['same'])})\n\n"
        for func_name in sorted(comparison['same']):
            report += f"- `{func_name}`\n"
        report += "\n"
    
    if comparison['different']:
        report += f"## 🔄 Different Functions ({len(comparison['different'])})\n\n"
        for func in comparison['different']:
            report += f"### `{func['name']}`\n\n"
            report += "**Differences:**\n```diff\n"
            diff = generate_function_diff(func['remote'], func['local'])
            report += diff
            report += "\n```\n\n"
    
    if comparison['remote_only']:
        report += f"## ➕ Missing Functions (Remote Only) ({len(comparison['remote_only'])})\n\n"
        for func in comparison['remote_only']:
            report += f"### `{func['name']}`\n\n"
            report += "**Definition to add locally:**\n```sql\n"
            report += func['definition']
            report += "\n```\n\n"
    
    if comparison['local_only']:
        report += f"## ➖ Local Only Functions ({len(comparison['local_only'])})\n\n"
        for func in comparison['local_only']:
            report += f"### `{func['name']}`\n\n"
            report += "**Local definition:**\n```sql\n"
            report += func['definition']
            report += "\n```\n\n"
    
    return report

def main():
    """Main function comparison"""
    
    print("Starting comprehensive functions comparison...")
    
    remote_functions = extract_remote_functions()
    local_functions = extract_local_functions()
    
    comparison = compare_functions(remote_functions, local_functions)
    
    report = generate_functions_report(comparison)
    
    # Write report to file
    report_file = 'database_functions_comparison.md'
    with open(report_file, 'w') as f:
        f.write(report)
    
    print(f"\n✅ Functions comparison report generated: {report_file}")
    
    # Summary output
    print(f"\nSummary:")
    print(f"  Remote functions: {len(remote_functions)}")
    print(f"  Local functions: {len(local_functions)}")
    print(f"  Identical: {len(comparison['same'])}")
    print(f"  Different: {len(comparison['different'])}")
    print(f"  Remote only: {len(comparison['remote_only'])}")
    print(f"  Local only: {len(comparison['local_only'])}")

if __name__ == "__main__":
    main()