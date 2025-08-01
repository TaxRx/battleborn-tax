#\!/bin/bash

# Fix profiles table - remove is_admin and has_completed_tax_profile columns
sed -i '' 's/INSERT INTO public\.profiles (\([^)]*\), is_admin\([^)]*\), has_completed_tax_profile\([^)]*\)) VALUES (\([^,]*\), \([^,]*\), \([^,]*\), \([^,]*\), \([^,]*\), \([^,]*\), \([^,]*\), \([^)]*\));/INSERT INTO public.profiles (\1\2\3) VALUES (\4, \5, \6, \9, \10);/g' import_remote_data_compatible.sql

# For simpler fix, let's manually identify and fix the most problematic inserts
echo "Attempting to fix schema compatibility issues..."

# Remove the problematic columns by using a more targeted approach
# First, let's see what we're working with
grep -n "INSERT INTO public.profiles" import_remote_data_compatible.sql | head -3
