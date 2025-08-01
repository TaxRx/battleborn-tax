-- Add Missing Columns to RD Tables for Remote Data Import Compatibility
-- Purpose: Add columns present in remote database to local RD tables
-- This enables importing the remote RD data without schema conflicts
-- Date: 2025-07-29

BEGIN;

-- ========= ADD MISSING COLUMNS TO RD_RESEARCH_CATEGORIES =========

ALTER TABLE public.rd_research_categories 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.rd_research_categories.description IS 'Optional description for the research category';

-- ========= ADD MISSING COLUMNS TO RD_AREAS =========

ALTER TABLE public.rd_areas 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.rd_areas.description IS 'Optional description for the research area';

-- ========= ADD MISSING COLUMNS TO RD_FOCUSES =========

ALTER TABLE public.rd_focuses 
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN public.rd_focuses.description IS 'Optional description for the research focus';

-- ========= ADD MISSING COLUMNS TO RD_BUSINESSES =========

-- Add missing columns to rd_businesses
ALTER TABLE public.rd_businesses 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS image_path TEXT,
ADD COLUMN IF NOT EXISTS naics TEXT,
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS github_token TEXT,
ADD COLUMN IF NOT EXISTS portal_email TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.rd_businesses.website IS 'Business website URL';
COMMENT ON COLUMN public.rd_businesses.image_path IS 'Path to business logo/image';
COMMENT ON COLUMN public.rd_businesses.naics IS 'NAICS industry classification code';
COMMENT ON COLUMN public.rd_businesses.category_id IS 'Reference to research category (optional)';
COMMENT ON COLUMN public.rd_businesses.github_token IS 'GitHub integration token (optional)';
COMMENT ON COLUMN public.rd_businesses.portal_email IS 'Client portal email address (optional)';

-- Add foreign key constraint for category_id if it references rd_research_categories
ALTER TABLE public.rd_businesses 
ADD CONSTRAINT rd_businesses_category_id_fkey 
FOREIGN KEY (category_id) REFERENCES public.rd_research_categories(id) ON DELETE SET NULL;

-- ========= ADD MISSING COLUMNS TO RD_BUSINESS_YEARS =========

-- Add QC (Quality Control) related columns
ALTER TABLE public.rd_business_years 
ADD COLUMN IF NOT EXISTS qc_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS qc_approved_by UUID,
ADD COLUMN IF NOT EXISTS qc_approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS qc_notes TEXT;

-- Add payment tracking columns
ALTER TABLE public.rd_business_years 
ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(15,2);

-- Add document management columns
ALTER TABLE public.rd_business_years 
ADD COLUMN IF NOT EXISTS documents_released BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS documents_released_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS documents_released_by UUID;

-- Add QRE (Qualified Research Expenses) breakdown columns
ALTER TABLE public.rd_business_years 
ADD COLUMN IF NOT EXISTS employee_qre NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS contractor_qre NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS supply_qre NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS qre_locked BOOLEAN DEFAULT false;

-- Add credit calculation columns
ALTER TABLE public.rd_business_years 
ADD COLUMN IF NOT EXISTS federal_credit NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS state_credit NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credits_calculated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS credits_locked_by UUID,
ADD COLUMN IF NOT EXISTS credits_locked_at TIMESTAMP WITH TIME ZONE;

-- Add comments for new columns
COMMENT ON COLUMN public.rd_business_years.qc_status IS 'Quality control status (pending, approved, rejected)';
COMMENT ON COLUMN public.rd_business_years.qc_approved_by IS 'User who approved the QC process';
COMMENT ON COLUMN public.rd_business_years.qc_approved_at IS 'Timestamp of QC approval';
COMMENT ON COLUMN public.rd_business_years.qc_notes IS 'Quality control review notes';

COMMENT ON COLUMN public.rd_business_years.payment_received IS 'Whether payment has been received';
COMMENT ON COLUMN public.rd_business_years.payment_received_at IS 'Timestamp of payment receipt';
COMMENT ON COLUMN public.rd_business_years.payment_amount IS 'Amount of payment received';

COMMENT ON COLUMN public.rd_business_years.documents_released IS 'Whether documents have been released to client';
COMMENT ON COLUMN public.rd_business_years.documents_released_at IS 'Timestamp of document release';
COMMENT ON COLUMN public.rd_business_years.documents_released_by IS 'User who released the documents';

COMMENT ON COLUMN public.rd_business_years.employee_qre IS 'Qualified Research Expenses for employees';
COMMENT ON COLUMN public.rd_business_years.contractor_qre IS 'Qualified Research Expenses for contractors';
COMMENT ON COLUMN public.rd_business_years.supply_qre IS 'Qualified Research Expenses for supplies';
COMMENT ON COLUMN public.rd_business_years.qre_locked IS 'Whether QRE calculations are locked';

COMMENT ON COLUMN public.rd_business_years.federal_credit IS 'Calculated federal R&D credit amount';
COMMENT ON COLUMN public.rd_business_years.state_credit IS 'Calculated state R&D credit amount';
COMMENT ON COLUMN public.rd_business_years.credits_locked IS 'Whether credit calculations are locked';
COMMENT ON COLUMN public.rd_business_years.credits_calculated_at IS 'Timestamp of credit calculation';
COMMENT ON COLUMN public.rd_business_years.credits_locked_by IS 'User who locked the credit calculations';
COMMENT ON COLUMN public.rd_business_years.credits_locked_at IS 'Timestamp of credit lock';

-- Add foreign key constraints for user references
ALTER TABLE public.rd_business_years 
ADD CONSTRAINT rd_business_years_qc_approved_by_fkey 
FOREIGN KEY (qc_approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.rd_business_years 
ADD CONSTRAINT rd_business_years_documents_released_by_fkey 
FOREIGN KEY (documents_released_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.rd_business_years 
ADD CONSTRAINT rd_business_years_credits_locked_by_fkey 
FOREIGN KEY (credits_locked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add check constraint for QC status
ALTER TABLE public.rd_business_years 
ADD CONSTRAINT rd_business_years_qc_status_check 
CHECK (qc_status IN ('pending', 'approved', 'rejected', 'in_review'));

-- ========= ADD MISSING COLUMNS TO TAX_PROPOSALS =========

-- Add missing columns for remote data compatibility
ALTER TABLE public.tax_proposals 
ADD COLUMN IF NOT EXISTS affiliate_id UUID,
ADD COLUMN IF NOT EXISTS client_name TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.tax_proposals.affiliate_id IS 'Reference to affiliate who created the proposal (optional)';
COMMENT ON COLUMN public.tax_proposals.client_name IS 'Cached client name for quick access (optional)';

-- Add foreign key constraint for affiliate_id if needed
-- Note: We don't add the FK constraint since we don't have an affiliates table reference in the remote data

COMMIT;