-- Update QC Status Constraint to Include 'ready_for_review'
-- Purpose: Remote data contains 'ready_for_review' status not in our original constraint
-- Date: 2025-07-29

BEGIN;

-- Drop the existing constraint
ALTER TABLE public.rd_business_years 
DROP CONSTRAINT IF EXISTS rd_business_years_qc_status_check;

-- Add updated constraint with 'ready_for_review' included
ALTER TABLE public.rd_business_years 
ADD CONSTRAINT rd_business_years_qc_status_check 
CHECK (qc_status IN ('pending', 'approved', 'rejected', 'in_review', 'ready_for_review'));

COMMIT;