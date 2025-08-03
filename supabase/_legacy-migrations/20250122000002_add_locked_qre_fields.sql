-- Add locked QRE fields to rd_business_years table for year-specific data isolation
-- Migration: 20250122000002_add_locked_qre_fields.sql

-- Add the three QRE fields to rd_business_years table
ALTER TABLE public.rd_business_years 
ADD COLUMN IF NOT EXISTS employee_qre NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS contractor_qre NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS supply_qre NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS qre_locked BOOLEAN DEFAULT FALSE;

-- Add comment to clarify the purpose
COMMENT ON COLUMN public.rd_business_years.employee_qre IS 'Locked employee QRE value for this business year';
COMMENT ON COLUMN public.rd_business_years.contractor_qre IS 'Locked contractor QRE value for this business year';
COMMENT ON COLUMN public.rd_business_years.supply_qre IS 'Locked supply QRE value for this business year';
COMMENT ON COLUMN public.rd_business_years.qre_locked IS 'Whether the QRE values are locked (not automatically calculated)';

-- Create function to update total_qre when individual QRE fields change
CREATE OR REPLACE FUNCTION update_total_qre()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_qre = COALESCE(NEW.employee_qre, 0) + COALESCE(NEW.contractor_qre, 0) + COALESCE(NEW.supply_qre, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update total_qre when individual QRE fields change
DROP TRIGGER IF EXISTS trigger_update_total_qre ON public.rd_business_years;
CREATE TRIGGER trigger_update_total_qre
  BEFORE INSERT OR UPDATE OF employee_qre, contractor_qre, supply_qre
  ON public.rd_business_years
  FOR EACH ROW
  EXECUTE FUNCTION update_total_qre(); 