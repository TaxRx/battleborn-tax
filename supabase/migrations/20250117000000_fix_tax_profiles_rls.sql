-- Fix tax_profiles RLS policies to allow INSERT operations
-- Migration: 20250117000000_fix_tax_profiles_rls.sql

-- Drop existing policies first (if they exist) to avoid conflicts
DROP POLICY IF EXISTS "Admins can insert tax profiles" ON public.tax_profiles;
DROP POLICY IF EXISTS "Users can insert their own tax profile" ON public.tax_profiles;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;

-- Add INSERT policy for tax_profiles to allow admins to create tax profiles
CREATE POLICY "Admins can insert tax profiles" ON public.tax_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Also add INSERT policy for regular users to create their own tax profiles
CREATE POLICY "Users can insert their own tax profile" ON public.tax_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add INSERT policy for user_preferences as well (in case it's missing)
CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Comments for documentation
COMMENT ON POLICY "Admins can insert tax profiles" ON public.tax_profiles IS 'Allows admins to create tax profiles for clients';
COMMENT ON POLICY "Users can insert their own tax profile" ON public.tax_profiles IS 'Allows users to create their own tax profiles';
COMMENT ON POLICY "Users can insert their own preferences" ON public.user_preferences IS 'Allows users to create their own preferences'; 