import re
import sys

# Tables that exist in both databases and should be imported
common_tables = {
    'admin_client_files', 'augusta_rule_details', 'business_years', 'businesses', 
    'calculations', 'centralized_businesses', 'charitable_donation_details', 
    'clients', 'commission_transactions', 'contractor_expenses', 
    'convertible_tax_bonds_details', 'cost_segregation_details', 'employees', 
    'experts', 'family_management_company_details', 'form_6765_overrides', 
    'hire_children_details', 'leads', 'personal_years', 'profiles', 
    'proposal_assignments', 'proposal_timeline', 'rd_areas', 'rd_business_years', 
    'rd_businesses', 'rd_focuses', 'rd_research_categories', 'strategy_details', 
    'tax_proposals', 'users'
}

# Read the dump file
with open('remote_database_data_dump.sql', 'r') as f:
    content = f.read()

# Split into sections by table
sections = re.split(r'(^-- Data for Name: .*?; Type: TABLE DATA; Schema: .*?; Owner: .*?$)', content, flags=re.MULTILINE)

filtered_content = []
filtered_content.append("-- Filtered Data Import from Remote Database\n")
filtered_content.append("-- Created: 2025-07-29\n")
filtered_content.append("-- WARNING: DO NOT RUN THIS MANUALLY - USER WILL RUN WHEN READY\n\n")
filtered_content.append("BEGIN;\n\n")
filtered_content.append("-- Disable triggers to prevent FK constraint issues during import\n")
filtered_content.append("SET session_replication_role = replica;\n\n")

i = 0
while i < len(sections):
    section = sections[i]
    if section.startswith('-- Data for Name:'):
        # Extract table name
        match = re.search(r'-- Data for Name: (.*?);.*Schema: (.*?);', section)
        if match:
            table_name = match.group(1)
            schema_name = match.group(2)
            
            # Only include public schema tables that exist in both databases
            if schema_name == 'public' and table_name in common_tables:
                filtered_content.append(f"\n-- Data for table: {table_name}\n")
                filtered_content.append(section + "\n")
                
                # Add the data section that follows
                if i + 1 < len(sections):
                    data_section = sections[i + 1]
                    # Clean up any problematic INSERT statements
                    if data_section and not data_section.startswith('--'):
                        filtered_content.append(data_section)
    i += 1

filtered_content.append("\n-- Re-enable triggers\n")
filtered_content.append("SET session_replication_role = DEFAULT;\n\n")
filtered_content.append("COMMIT;\n")

# Write filtered content
with open('import_remote_data.sql', 'w') as f:
    f.write(''.join(filtered_content))

print("Created import_remote_data.sql with filtered data from common tables")
print(f"Tables included: {', '.join(sorted(common_tables))}")
