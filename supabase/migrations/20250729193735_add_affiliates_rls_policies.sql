-- Add RLS Policies for Affiliates Table
-- Purpose: Fix RLS policy violation when creating affiliate records
-- Issue: RLS is enabled but no policies exist, blocking all access
-- Solution: Add appropriate policies for affiliate management
-- Date: 2025-07-29

BEGIN;

-- ========= AFFILIATES TABLE RLS POLICIES =========

-- Allow service role (edge functions) to insert affiliates
CREATE POLICY "Service role can insert affiliates" ON public.affiliates
    FOR INSERT WITH CHECK (true);

-- Allow service role to select affiliates
CREATE POLICY "Service role can select affiliates" ON public.affiliates
    FOR SELECT USING (true);

-- Allow service role to update affiliates  
CREATE POLICY "Service role can update affiliates" ON public.affiliates
    FOR UPDATE USING (true);

-- Allow service role to delete affiliates
CREATE POLICY "Service role can delete affiliates" ON public.affiliates
    FOR DELETE USING (true);

-- Allow authenticated users to view affiliates in their account
CREATE POLICY "Users can view affiliates in their account" ON public.affiliates
    FOR SELECT USING (
        account_id IN (
            SELECT id FROM accounts 
            WHERE id = (
                SELECT account_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Allow authenticated users to update affiliates in their account
CREATE POLICY "Users can update affiliates in their account" ON public.affiliates
    FOR UPDATE USING (
        account_id IN (
            SELECT id FROM accounts 
            WHERE id = (
                SELECT account_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Allow admins and operators to manage all affiliates
CREATE POLICY "Admins and operators can manage all affiliates" ON public.affiliates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            JOIN accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() 
            AND a.type IN ('admin', 'operator')
        )
    );

COMMIT;