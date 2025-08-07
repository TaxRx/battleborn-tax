# Run This SQL in Your Supabase Dashboard

## To Fix the 404 Error

1. **Go to your Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste the SQL**
   - Copy the entire contents of `CREATE_FUNCTION_SQL.sql`
   - Paste it into the SQL editor

4. **Run the Query**
   - Click the "Run" button (or press Ctrl+Enter)
   - You should see a success message

5. **Test Client Creation**
   - Go back to your app and try creating a client again
   - The 404 error should be resolved

## What This Does

This SQL script creates the missing `create_client_with_business` function that your frontend is trying to call. The function:

- Creates a new client record in `admin_client_files`
- Handles business creation if the client is a business owner
- Maps entity types correctly between frontend and database
- Includes all the new fields you added (dependents, phone, etc.)

## If You Still Get Errors

If you still get errors after running this SQL, please share the exact error message and I'll help you troubleshoot further. 