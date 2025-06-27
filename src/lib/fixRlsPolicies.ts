import { supabase } from './supabase';

/**
 * Fix missing RLS policies for tax_profiles table
 * This function adds the missing INSERT policies that allow admins to create tax profiles
 */
export const fixRlsPolicies = async () => {
  try {
    console.log('Attempting to fix RLS policies for tax_profiles...');
    
    // Add INSERT policy for admins to create tax profiles
    const { error: adminPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Admins can insert tax profiles" ON public.tax_profiles
        FOR INSERT WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
          )
        );
      `
    });

    if (adminPolicyError) {
      console.error('Error creating admin INSERT policy:', adminPolicyError);
    } else {
      console.log('Successfully created admin INSERT policy for tax_profiles');
    }

    // Add INSERT policy for users to create their own tax profiles
    const { error: userPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can insert their own tax profile" ON public.tax_profiles
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    });

    if (userPolicyError) {
      console.error('Error creating user INSERT policy:', userPolicyError);
    } else {
      console.log('Successfully created user INSERT policy for tax_profiles');
    }

    // Add INSERT policy for user_preferences as well
    const { error: preferencesPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY IF NOT EXISTS "Users can insert their own preferences" ON public.user_preferences
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    });

    if (preferencesPolicyError) {
      console.error('Error creating user_preferences INSERT policy:', preferencesPolicyError);
    } else {
      console.log('Successfully created user_preferences INSERT policy');
    }

    return {
      success: true,
      errors: [adminPolicyError, userPolicyError, preferencesPolicyError].filter(Boolean)
    };

  } catch (error) {
    console.error('Error fixing RLS policies:', error);
    return {
      success: false,
      error
    };
  }
};

/**
 * Alternative approach: Use direct SQL execution if RPC is not available
 */
export const fixRlsPoliciesDirect = async () => {
  try {
    console.log('Attempting to fix RLS policies using direct SQL...');
    
    // This approach requires the user to manually execute the SQL in Supabase dashboard
    const sqlCommands = [
      `-- Drop existing policies first (if they exist) to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert tax profiles" ON public.tax_profiles;
DROP POLICY IF EXISTS "Users can insert their own tax profile" ON public.tax_profiles;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;

-- Create new policies
CREATE POLICY "Admins can insert tax profiles" ON public.tax_profiles
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);`,
      
      `CREATE POLICY "Users can insert their own tax profile" ON public.tax_profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
FOR INSERT WITH CHECK (auth.uid() = user_id);`
    ];

    console.log('Please execute the following SQL commands in your Supabase SQL Editor:');
    sqlCommands.forEach((sql, index) => {
      console.log(`\n--- Command ${index + 1} ---`);
      console.log(sql);
    });

    return {
      success: true,
      message: 'SQL commands logged to console. Please execute them in Supabase dashboard.'
    };

  } catch (error) {
    console.error('Error in direct SQL approach:', error);
    return {
      success: false,
      error
    };
  }
}; 