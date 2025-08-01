-- Migration: Add federal and state credit management fields to rd_business_years
-- Purpose: Allow QC team to edit and lock calculated R&D credit values for client portal display

-- Add credit management columns to rd_business_years table
ALTER TABLE public.rd_business_years
ADD COLUMN IF NOT EXISTS federal_credit NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS state_credit NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS credits_calculated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS credits_locked_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS credits_locked_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN public.rd_business_years.federal_credit IS 'Federal R&D tax credit amount (editable and lockable)';
COMMENT ON COLUMN public.rd_business_years.state_credit IS 'State R&D tax credit amount (editable and lockable)';
COMMENT ON COLUMN public.rd_business_years.credits_locked IS 'Whether the credit values are locked from further calculation updates';
COMMENT ON COLUMN public.rd_business_years.credits_calculated_at IS 'When the credits were last calculated or manually updated';
COMMENT ON COLUMN public.rd_business_years.credits_locked_by IS 'Who locked the credit values';
COMMENT ON COLUMN public.rd_business_years.credits_locked_at IS 'When the credit values were locked';

-- Create index for efficient credit queries
CREATE INDEX IF NOT EXISTS idx_rd_business_years_credits_locked 
ON public.rd_business_years(credits_locked) 
WHERE credits_locked = true;

-- Create trigger to update credits_calculated_at when credit values change
CREATE OR REPLACE FUNCTION update_credits_calculated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update timestamp if credit values actually changed and not during lock operation
    IF (OLD.federal_credit IS DISTINCT FROM NEW.federal_credit OR 
        OLD.state_credit IS DISTINCT FROM NEW.state_credit) AND
       (OLD.credits_locked_at IS NOT DISTINCT FROM NEW.credits_locked_at) THEN
        NEW.credits_calculated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rd_business_years_credits_calculated_at
    BEFORE UPDATE OF federal_credit, state_credit
    ON public.rd_business_years
    FOR EACH ROW
    EXECUTE FUNCTION update_credits_calculated_at();

-- Update existing records to set credits_calculated_at for records that have credit values
UPDATE public.rd_business_years 
SET credits_calculated_at = updated_at 
WHERE (federal_credit > 0 OR state_credit > 0) 
  AND credits_calculated_at IS NULL; 