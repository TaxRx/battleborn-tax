-- Add missing indexes and policies for tax_calculations and tax_proposals tables
-- Extracted from remote schema dump
-- Date: 2025-07-31

-- =============================================================================
-- SECTION 1: Missing indexes for tax tables (skip if already exist)
-- =============================================================================

-- Note: Indexes already exist locally, skipping creation
-- If needed, uncomment the following:
/*
CREATE INDEX IF NOT EXISTS tax_calculations_user_id_idx ON public.tax_calculations USING btree (user_id);
CREATE INDEX IF NOT EXISTS tax_calculations_year_idx ON public.tax_calculations USING btree (year);
CREATE INDEX IF NOT EXISTS idx_tax_proposals_affiliate_id ON public.tax_proposals USING btree (affiliate_id);
CREATE INDEX IF NOT EXISTS idx_tax_proposals_status ON public.tax_proposals USING btree (status);
CREATE INDEX IF NOT EXISTS idx_tax_proposals_user_id ON public.tax_proposals USING btree (user_id);
*/

-- =============================================================================
-- SECTION 2: Missing RLS policies for tax tables (skip - all already exist)
-- =============================================================================

-- Note: All RLS policies already exist locally, skipping creation
-- Both tax_calculations and tax_proposals tables already have proper RLS policies

/*
-- Policies for tax_calculations (already exist)
CREATE POLICY "Users can delete own calculations" ON public.tax_calculations FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert own calculations" ON public.tax_calculations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update own calculations" ON public.tax_calculations FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own calculations" ON public.tax_calculations FOR SELECT TO authenticated USING ((auth.uid() = user_id));

-- Policies for tax_proposals (already exist)
CREATE POLICY "Admins can view all tax proposals" ON public.tax_proposals FOR SELECT USING (((auth.jwt() ->> 'role'::text) = 'admin'::text));
CREATE POLICY "Allow all delete for dev" ON public.tax_proposals FOR DELETE USING (true);
CREATE POLICY "Allow all insert for dev" ON public.tax_proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all select for debug" ON public.tax_proposals FOR SELECT USING (true);
CREATE POLICY "Allow all select for dev" ON public.tax_proposals FOR SELECT USING (true);
CREATE POLICY "Allow all update for dev" ON public.tax_proposals FOR UPDATE USING (true);
CREATE POLICY "Users can insert their own tax proposals" ON public.tax_proposals FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own tax proposals" ON public.tax_proposals FOR UPDATE USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own tax proposals" ON public.tax_proposals FOR SELECT USING ((auth.uid() = user_id));
*/