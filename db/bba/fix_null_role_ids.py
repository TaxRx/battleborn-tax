#!/usr/bin/env python3
"""
Fix NULL role_id values in rd_employees by assigning default roles from the same business.
"""

import re

def fix_null_role_ids():
    """Fix NULL role_id values in the import script"""
    
    # Read the import file
    with open('import_missing_tables.sql', 'r') as f:
        content = f.read()
    
    # Extract business to role mapping from rd_roles inserts
    business_roles = {}
    role_pattern = r"INSERT INTO public\.rd_roles.*?VALUES \('([^']+)', '([^']+)', '[^']+'"
    
    for match in re.finditer(role_pattern, content):
        role_id = match.group(1)
        business_id = match.group(2)
        if business_id not in business_roles:
            business_roles[business_id] = role_id
    
    print("Found roles for businesses:")
    for business_id, role_id in business_roles.items():
        print(f"  {business_id[:8]}... -> {role_id[:8]}...")
    
    # Fix NULL role_id values in rd_employees
    employee_pattern = r"(INSERT INTO public\.rd_employees.*?VALUES \('[^']+', '([^']+)', '[^']+', )NULL(, false, [^;]+;)"
    
    def replace_null_role(match):
        prefix = match.group(1)
        business_id = match.group(2)
        suffix = match.group(3)
        
        if business_id in business_roles:
            default_role = business_roles[business_id]
            return f"{prefix}'{default_role}'{suffix}"
        else:
            print(f"Warning: No role found for business {business_id}")
            return match.group(0)  # Return unchanged
    
    # Apply fixes
    original_nulls = len(re.findall(r"INSERT INTO public\.rd_employees.*?NULL.*?false", content))
    fixed_content = re.sub(employee_pattern, replace_null_role, content)
    remaining_nulls = len(re.findall(r"INSERT INTO public\.rd_employees.*?NULL.*?false", fixed_content))
    
    print(f"\nFixed {original_nulls - remaining_nulls} NULL role_id values")
    print(f"Remaining NULL role_id values: {remaining_nulls}")
    
    # Write back the fixed content
    with open('import_missing_tables.sql', 'w') as f:
        f.write(fixed_content)
    
    print("Updated import_missing_tables.sql")

if __name__ == "__main__":
    fix_null_role_ids()