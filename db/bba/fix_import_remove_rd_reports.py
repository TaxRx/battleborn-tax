#!/usr/bin/env python3
"""
Remove problematic rd_reports INSERT statements from import file.
The HTML content is causing SQL syntax errors due to improper escaping.
"""

import re

def remove_rd_reports():
    """Remove rd_reports INSERT statements that are causing issues"""
    
    # Read the import file
    with open('import_missing_tables.sql', 'r') as f:
        content = f.read()
    
    # Remove all rd_reports INSERT statements
    # They contain unescaped HTML that's breaking the SQL
    print("Removing rd_reports INSERT statements due to HTML escaping issues...")
    
    # Remove rd_reports INSERT statements
    # First, let's count how many we're removing
    rd_reports_pattern = r'INSERT INTO public\.rd_reports.*?;'
    rd_reports_count = len(re.findall(rd_reports_pattern, content, re.DOTALL))
    
    print(f"Found {rd_reports_count} rd_reports INSERT statements to remove")
    
    # Remove them
    content_fixed = re.sub(rd_reports_pattern, '', content, flags=re.DOTALL)
    
    # Also remove any incomplete rd_reports statements that might be causing the trailing junk error
    # Look for lines that start with INSERT INTO public.rd_reports but don't end properly
    incomplete_pattern = r'INSERT INTO public\.rd_reports[^\n]*\n(?:[^\n]*\n)*?(?=INSERT|--|$)'
    incomplete_count = len(re.findall(incomplete_pattern, content_fixed, re.MULTILINE))
    if incomplete_count > 0:
        print(f"Removing {incomplete_count} incomplete rd_reports statements")
        content_fixed = re.sub(incomplete_pattern, '', content_fixed, flags=re.MULTILINE)
    
    # Clean up any extra whitespace
    content_fixed = re.sub(r'\n\n+', '\n\n', content_fixed)
    
    # Write back the fixed content
    with open('import_missing_tables.sql', 'w') as f:
        f.write(content_fixed)
    
    print("Updated import_missing_tables.sql - removed problematic rd_reports statements")
    print("The import will now include all other tables except rd_reports")

if __name__ == "__main__":
    remove_rd_reports()