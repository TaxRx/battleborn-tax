-- Update check_document_release_eligibility function to use rd_signature_records table
-- Migration: 20250813031127_update_check_document_release_eligibility_use_signature_records.sql
-- Purpose: Fix jurat signature checking to use the actual rd_signature_records table

DROP FUNCTION IF EXISTS public.check_document_release_eligibility(uuid, varchar);

CREATE OR REPLACE FUNCTION public.check_document_release_eligibility(p_business_year_id uuid, p_document_type character varying)
 RETURNS TABLE(can_release boolean, reason text, jurat_signed boolean, payment_received boolean, qc_approved boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  business_year_record RECORD;
  control_record RECORD;
  jurat_exists BOOLEAN;
BEGIN
  -- Get business year info
  SELECT * INTO business_year_record
  FROM rd_business_years
  WHERE id = p_business_year_id;
  
  -- Get document control info
  SELECT * INTO control_record
  FROM rd_qc_document_controls
  WHERE business_year_id = p_business_year_id 
  AND document_type = p_document_type;
  
  -- Check if jurat is signed (using rd_signature_records table)
  SELECT EXISTS(
    SELECT 1 FROM rd_signature_records 
    WHERE business_year_id = p_business_year_id
  ) INTO jurat_exists;
  
  -- Determine if document can be released based on type and requirements
  CASE p_document_type
    WHEN 'research_report' THEN
      -- Research Report: Available when QC marks as ready
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('ready_for_review', 'approved', 'complete')),
        CASE 
          WHEN business_year_record.qc_status IN ('ready_for_review', 'approved', 'complete') THEN 'Document approved for release'
          ELSE 'Document pending QC approval'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
        
    WHEN 'filing_guide' THEN
      -- Filing Guide: Available after jurat signed + QC approval + payment
      RETURN QUERY SELECT 
        (jurat_exists AND business_year_record.qc_status IN ('approved', 'complete')
        AND COALESCE(business_year_record.payment_received, FALSE)
        ),
        CASE 
          WHEN NOT jurat_exists THEN 'Jurat must be signed first'
          WHEN business_year_record.qc_status NOT IN ('approved', 'complete') THEN 'QC approval required'
          WHEN NOT COALESCE(business_year_record.payment_received, FALSE) THEN 'Payment required'
          ELSE 'Document approved for release'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
        
    WHEN 'allocation_report' THEN
      -- Allocation Report: Available after QC approval  
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('approved', 'complete')),
        CASE 
          WHEN business_year_record.qc_status IN ('approved', 'complete') THEN 'Document approved for release'
          ELSE 'Document pending QC approval'
        END,
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
        
    ELSE
      -- Default: Require QC approval
      RETURN QUERY SELECT 
        (business_year_record.qc_status IN ('approved', 'complete')),
        'Document pending QC approval',
        jurat_exists,
        COALESCE(business_year_record.payment_received, FALSE),
        (business_year_record.qc_status IN ('approved', 'complete'));
  END CASE;
END;
$function$;