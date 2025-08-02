-- Comprehensive fix for RLS policies for rd_signature_records
-- Migration: 20250128000003_fix_signature_rls_policies_comprehensive.sql

-- Drop ALL existing policies (comprehensive cleanup)
DROP POLICY IF EXISTS "Users can view signature records for their businesses" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Users can create signature records for their businesses" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Users can update signature records for their businesses" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Admin can manage all signature records" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Admin can view all signatures" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Anyone can create signatures via portal" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Allow authenticated users to view signatures" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Allow authenticated users to create signatures" ON public.rd_signature_records;

-- Recreate clean, working policies

-- Policy 1: Anyone authenticated can view signature records (for admin preview and client access)
CREATE POLICY "authenticated_users_can_view_signatures" ON public.rd_signature_records
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy 2: Anyone authenticated can create signature records (for admin preview and client signing)
CREATE POLICY "authenticated_users_can_create_signatures" ON public.rd_signature_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Admin can manage all signature records (update/delete)
CREATE POLICY "admin_can_manage_all_signatures" ON public.rd_signature_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DO $$ BEGIN 
  RAISE NOTICE 'Successfully cleaned up and recreated RLS policies for rd_signature_records table';
  RAISE NOTICE 'Fixed policies to allow both admin preview and client portal access';
  RAISE NOTICE 'Policies created: authenticated_users_can_view_signatures, authenticated_users_can_create_signatures, admin_can_manage_all_signatures';
END $$; 