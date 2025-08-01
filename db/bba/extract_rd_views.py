#!/usr/bin/env python3
"""
Extract all rd_* VIEW definitions from remote schema dump.
Creates a migration to add these missing views.
"""

import re
import sys

def extract_rd_views(content):
    """Extract complete CREATE VIEW statements for rd_* views."""
    views = []
    
    # Pattern to match CREATE VIEW statements for rd_* views
    # This captures the complete view definition including the semicolon
    pattern = r'CREATE VIEW public\.rd_\w+ AS.*?;'
    matches = re.findall(pattern, content, re.DOTALL | re.MULTILINE)
    
    return matches

def main():
    remote_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/db/bba/remote_schema_dump_0731.sql'
    output_file = '/Users/admin/CodeProjects/openside/battleborn/taxapp/supabase/migrations/20250731253000_add_rd_views.sql'
    
    print("🔍 Extracting rd_* view definitions from remote schema...")
    
    with open(remote_file, 'r') as f:
        content = f.read()
    
    # Extract all rd_* views
    rd_views = extract_rd_views(content)
    
    print(f"📊 Found {len(rd_views)} rd_* views")
    
    if not rd_views:
        print("❌ No rd_* views found in remote schema")
        return
    
    # Create migration content
    migration_content = """-- Add missing rd_* views from remote database
-- Extracted from remote schema dump
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: CREATE VIEW statements for rd_* views
-- =============================================================================

"""
    
    # Add each view definition
    for i, view_def in enumerate(rd_views, 1):
        migration_content += f"-- View {i}/{len(rd_views)}\n"
        migration_content += f"{view_def.strip()}\n\n"
    
    # Write migration file
    with open(output_file, 'w') as f:
        f.write(migration_content)
    
    print(f"✅ Created views migration: {output_file}")
    
    # Display view names for verification
    print(f"\n📋 Views found:")
    for view_def in rd_views:
        match = re.search(r'CREATE VIEW public\.(rd_\w+)', view_def)
        if match:
            print(f"  - {match.group(1)}")

if __name__ == "__main__":
    main()