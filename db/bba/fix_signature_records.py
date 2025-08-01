#!/usr/bin/env python3
"""
Remove problematic rd_signature_records INSERT statements from import file.
The base64 image data is causing SQL syntax errors.
"""

import re

def remove_signature_records():
    """Remove rd_signature_records INSERT statements that contain base64 image data"""
    
    # Read the import file
    with open('import_missing_tables.sql', 'r') as f:
        content = f.read()
    
    # Remove all rd_signature_records INSERT statements that contain base64 data
    print("Removing rd_signature_records INSERT statements due to base64 data issues...")
    
    # Count and remove rd_signature_records statements
    signature_pattern = r'INSERT INTO public\.rd_signature_records.*?;'
    signature_count = len(re.findall(signature_pattern, content, re.DOTALL))
    
    print(f"Found {signature_count} rd_signature_records INSERT statements to remove")
    
    # Remove them
    content_fixed = re.sub(signature_pattern, '', content, flags=re.DOTALL)
    
    # Also remove any incomplete statements that might exist
    incomplete_pattern = r'INSERT INTO public\.rd_signature_records[^\n]*\n(?:[^\n]*\n)*?(?=INSERT|--|$)'
    incomplete_count = len(re.findall(incomplete_pattern, content_fixed, re.MULTILINE))
    if incomplete_count > 0:
        print(f"Removing {incomplete_count} incomplete rd_signature_records statements")
        content_fixed = re.sub(incomplete_pattern, '', content_fixed, flags=re.MULTILINE)
    
    # Clean up any extra whitespace
    content_fixed = re.sub(r'\n\n+', '\n\n', content_fixed)
    
    # Write back the fixed content
    with open('import_missing_tables.sql', 'w') as f:
        f.write(content_fixed)
    
    print("Updated import_missing_tables.sql - removed problematic rd_signature_records statements")
    print("The import will now exclude rd_signature_records and rd_reports tables")

if __name__ == "__main__":
    remove_signature_records()