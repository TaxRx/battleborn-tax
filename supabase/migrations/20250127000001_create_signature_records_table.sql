-- Create signature records table for jurat signatures
-- Migration: 20250127000001_create_signature_records_table.sql

CREATE TABLE IF NOT EXISTS public.rd_signature_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    business_year_id uuid NOT NULL REFERENCES public.rd_business_years(id) ON DELETE CASCADE,
    signer_name text NOT NULL,
    signer_title text,
    signer_email text,
    signature_image text NOT NULL, -- Base64 encoded signature image
    ip_address text NOT NULL,
    signed_at timestamptz NOT NULL,
    jurat_text text NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_rd_signature_records_business_year_id ON public.rd_signature_records(business_year_id);
CREATE INDEX IF NOT EXISTS idx_rd_signature_records_signed_at ON public.rd_signature_records(signed_at);

-- Add RLS policies
ALTER TABLE public.rd_signature_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see signature records for businesses they have access to
CREATE POLICY "Users can view signature records for their businesses" ON public.rd_signature_records
    FOR SELECT USING (
        business_year_id IN (
            SELECT by.id 
            FROM public.rd_business_years by
            JOIN public.rd_businesses b ON by.business_id = b.id
            JOIN public.clients c ON b.client_id = c.id
            WHERE c.created_by = auth.uid()
        )
    );

-- Policy: Users can insert signature records for their businesses  
CREATE POLICY "Users can create signature records for their businesses" ON public.rd_signature_records
    FOR INSERT WITH CHECK (
        business_year_id IN (
            SELECT by.id 
            FROM public.rd_business_years by
            JOIN public.rd_businesses b ON by.business_id = b.id
            JOIN public.clients c ON b.client_id = c.id
            WHERE c.created_by = auth.uid()
        )
    );

-- Policy: Admin can manage all signature records
CREATE POLICY "Admin can manage all signature records" ON public.rd_signature_records
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Add comments
COMMENT ON TABLE public.rd_signature_records IS 'Records of digital signatures for jurat statements with audit trail';
COMMENT ON COLUMN public.rd_signature_records.business_year_id IS 'Reference to the business year this signature applies to';
COMMENT ON COLUMN public.rd_signature_records.signer_name IS 'Full name of the person who signed';
COMMENT ON COLUMN public.rd_signature_records.signer_title IS 'Job title of the person who signed';
COMMENT ON COLUMN public.rd_signature_records.signer_email IS 'Email address of the person who signed';
COMMENT ON COLUMN public.rd_signature_records.signature_image IS 'Base64 encoded signature image from canvas';
COMMENT ON COLUMN public.rd_signature_records.ip_address IS 'IP address of the signer for audit purposes';
COMMENT ON COLUMN public.rd_signature_records.signed_at IS 'Timestamp when the signature was created';
COMMENT ON COLUMN public.rd_signature_records.jurat_text IS 'The full text of the jurat statement that was signed'; 