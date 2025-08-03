-- Fix RLS policies for rd_signature_records to work with both admin and client access
-- Migration: 20250128000002_fix_signature_rls_policies.sql

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view signature records for their businesses" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Users can create signature records for their businesses" ON public.rd_signature_records;
DROP POLICY IF EXISTS "Admin can manage all signature records" ON public.rd_signature_records;

-- Create updated policies that work with the actual schema

-- Policy: Anyone authenticated can view signature records (for admin preview and client access)
CREATE POLICY "Allow authenticated users to view signatures" ON public.rd_signature_records
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Anyone authenticated can create signature records (for admin preview and client signing)
CREATE POLICY "Allow authenticated users to create signatures" ON public.rd_signature_records
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Admin can manage all signature records  
CREATE POLICY "Admin can manage all signature records" ON public.rd_signature_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DO $$ BEGIN 
  RAISE NOTICE 'Successfully updated RLS policies for rd_signature_records table';
  RAISE NOTICE 'Fixed policies to allow both admin preview and client portal access';
END $$; 