import re
import subprocess
import sys

def get_local_table_columns(table_name):
    """Get column names from local database table"""
    try:
        cmd = f'psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT column_name FROM information_schema.columns WHERE table_name = \'{table_name}\' AND table_schema = \'public\' ORDER BY ordinal_position;" -t'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            columns = []
            for line in result.stdout.strip().split('\n'):
                col = line.strip()
                if col:
                    columns.append(col)
            return columns
        return None
    except:
        return None

def extract_insert_columns(insert_statement):
    """Extract table name and column names from INSERT statement"""
    match = re.search(r'INSERT INTO public\.(\w+) \((.*?)\) VALUES', insert_statement)
    if match:
        table = match.group(1)
        columns = [col.strip() for col in match.group(2).split(',')]
        return table, columns
    return None, []

def check_table_exists(table_name):
    """Check if table exists in local database"""
    try:
        cmd = f'psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT 1 FROM information_schema.tables WHERE table_name = \'{table_name}\' AND table_schema = \'public\';" -t'
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0 and result.stdout.strip()
    except:
        return False

def main():
    print("Validating import compatibility with local database...")
    print("=" * 60)
    
    issues = []
    tables_checked = set()
    
    with open('import_remote_data.sql', 'r') as f:
        content = f.read()
    
    # Find all INSERT statements
    insert_statements = re.findall(r'INSERT INTO public\.\w+ \([^)]+\) VALUES[^;]+;', content, re.MULTILINE | re.DOTALL)
    
    print(f"Found {len(insert_statements)} INSERT statements to validate...")
    
    # Group by table and check first statement of each table
    table_inserts = {}
    for insert in insert_statements:
        table, columns = extract_insert_columns(insert)
        if table and table not in table_inserts:
            table_inserts[table] = (insert, columns)
    
    for table, (insert, columns) in table_inserts.items():
        print(f"\nChecking table: {table}")
        
        # Check if table exists
        if not check_table_exists(table):
            issues.append(f"❌ Table '{table}' does not exist in local database")
            continue
        
        # Get local table columns
        local_columns = get_local_table_columns(table)
        if not local_columns:
            issues.append(f"❌ Could not get schema for table '{table}'")
            continue
        
        # Compare columns
        missing_columns = []
        for col in columns:
            clean_col = col.strip().strip('"')
            if clean_col not in local_columns:
                missing_columns.append(clean_col)
        
        if missing_columns:
            issues.append(f"❌ Table '{table}': Missing columns in local DB: {missing_columns}")
            print(f"  Import columns: {columns}")
            print(f"  Local columns: {local_columns}")
        else:
            print(f"  ✅ All columns compatible ({len(columns)} columns)")
        
        tables_checked.add(table)
    
    # Summary
    print(f"\n" + "=" * 60)
    print(f"Validation Summary:")
    print(f"Tables checked: {len(tables_checked)}")
    print(f"Issues found: {len(issues)}")
    
    if issues:
        print(f"\n⚠️  COMPATIBILITY ISSUES FOUND:")
        for issue in issues:
            print(f"  {issue}")
        print(f"\n❌ IMPORT WILL LIKELY FAIL - Issues must be resolved first")
    else:
        print(f"\n✅ ALL CHECKS PASSED\! Import should be compatible.")
    
    print(f"\nTables validated: {', '.join(sorted(tables_checked))}")
    
    return len(issues) == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
