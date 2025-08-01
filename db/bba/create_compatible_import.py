import re

# Tables and columns that need to be removed for compatibility
problematic_tables = {
    'profiles': ['is_admin', 'has_completed_tax_profile'],
    'tax_proposals': ['affiliate_id', 'client_name'],
    'rd_research_categories': ['description'],
    'rd_areas': ['description'],
    'rd_businesses': ['website', 'image_path', 'naics', 'category_id', 'github_token', 'portal_email'],
    'rd_business_years': [
        'qc_status', 'qc_approved_by', 'qc_approved_at', 'payment_received', 
        'payment_received_at', 'qc_notes', 'payment_amount', 'documents_released',
        'documents_released_at', 'documents_released_by', 'employee_qre', 
        'contractor_qre', 'supply_qre', 'qre_locked', 'federal_credit', 
        'state_credit', 'credits_locked', 'credits_calculated_at', 
        'credits_locked_by', 'credits_locked_at'
    ],
    'rd_focuses': ['description']
}

def process_insert_statement(line):
    """Process a single INSERT statement to remove incompatible columns"""
    # Extract table name
    table_match = re.search(r'INSERT INTO public\.(\w+)', line)
    if not table_match:
        return line
    
    table_name = table_match.group(1)
    if table_name not in problematic_tables:
        return line
    
    # Extract columns and values parts
    match = re.search(r'INSERT INTO public\.\w+ \((.*?)\) VALUES \((.*?)\);', line, re.DOTALL)
    if not match:
        return line
    
    columns_str = match.group(1)
    values_str = match.group(2)
    
    # Split columns
    columns = [col.strip() for col in columns_str.split(',')]
    
    # Simple value splitting (assuming well-formed data)
    values = []
    depth = 0
    current = ""
    in_string = False
    string_char = None
    
    for char in values_str:
        if not in_string:
            if char in ["'", '"']:
                in_string = True
                string_char = char
            elif char == '(':
                depth += 1
            elif char == ')':
                depth -= 1
            elif char == ',' and depth == 0:
                values.append(current.strip())
                current = ""
                continue
        else:
            if char == string_char:
                # Check if it's escaped
                if len(current) == 0 or current[-1] \!= '\\':
                    in_string = False
                    string_char = None
        
        current += char
    
    if current.strip():
        values.append(current.strip())
    
    # Remove problematic columns
    remove_columns = problematic_tables[table_name]
    new_columns = []
    new_values = []
    
    for i, col in enumerate(columns):
        if col.strip() not in remove_columns:
            new_columns.append(col.strip())
            if i < len(values):
                new_values.append(values[i])
    
    # Reconstruct statement
    new_statement = f"INSERT INTO public.{table_name} ({', '.join(new_columns)}) VALUES ({', '.join(new_values)});"
    return new_statement

def main():
    print("Creating schema-compatible import script...")
    
    with open('import_remote_data.sql', 'r') as f:
        content = f.read()
    
    lines = content.split('\n')
    processed_lines = []
    
    for line in lines:
        if line.strip().startswith('INSERT INTO public.'):
            processed_line = process_insert_statement(line)
            processed_lines.append(processed_line)
        else:
            processed_lines.append(line)
    
    # Write the compatible version
    with open('import_remote_data_compatible.sql', 'w') as f:
        f.write('\n'.join(processed_lines))
    
    print("✅ Created import_remote_data_compatible.sql")
    print("\nSchema fixes applied:")
    for table, cols in problematic_tables.items():
        print(f"  • {table}: Removed {len(cols)} incompatible columns")

if __name__ == "__main__":
    main()
