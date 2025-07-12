-- Migration: Add historical data fields to rd_businesses table
-- Date: 2024-12-20
-- Description: Add historical data for R&D tax credit base period calculations

-- Add historical data as JSONB for flexibility (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rd_businesses' 
        AND column_name = 'historical_data'
    ) THEN
        ALTER TABLE rd_businesses ADD COLUMN historical_data JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Add index for historical data queries (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'rd_businesses' 
        AND indexname = 'idx_rd_businesses_historical_data'
    ) THEN
        CREATE INDEX idx_rd_businesses_historical_data 
        ON rd_businesses USING GIN (historical_data);
    END IF;
END $$;

-- Add comment explaining the historical_data structure
COMMENT ON COLUMN rd_businesses.historical_data IS 
'JSON array of historical data objects with structure: 
[{"year": 2020, "gross_receipts": 1000000, "qre": 50000}, ...]
Used for R&D tax credit base period calculations.';

-- Update existing records to have empty historical data
UPDATE rd_businesses 
SET historical_data = '[]'::jsonb 
WHERE historical_data IS NULL;

-- Make historical_data NOT NULL after setting default values
ALTER TABLE rd_businesses 
ALTER COLUMN historical_data SET NOT NULL;

-- Add validation function for historical data structure (only if it doesn't exist)
CREATE OR REPLACE FUNCTION validate_historical_data(data JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's an array
  IF jsonb_typeof(data) != 'array' THEN
    RETURN FALSE;
  END IF;
  
  -- Check each object in the array
  FOR i IN 0..jsonb_array_length(data) - 1 LOOP
    DECLARE
      item JSONB := data->i;
    BEGIN
      -- Check required fields exist and are numbers
      IF NOT (item ? 'year' AND item ? 'gross_receipts' AND item ? 'qre') THEN
        RETURN FALSE;
      END IF;
      
      -- Check year is reasonable
      IF (item->>'year')::INTEGER < 1900 OR (item->>'year')::INTEGER > EXTRACT(YEAR FROM CURRENT_DATE) + 1 THEN
        RETURN FALSE;
      END IF;
      
      -- Check amounts are non-negative
      IF (item->>'gross_receipts')::NUMERIC < 0 OR (item->>'qre')::NUMERIC < 0 THEN
        RETURN FALSE;
      END IF;
    END;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for historical data validation (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_historical_data_structure'
    ) THEN
        ALTER TABLE rd_businesses 
        ADD CONSTRAINT check_historical_data_structure 
        CHECK (validate_historical_data(historical_data));
    END IF;
END $$;

-- Create function to get base period years for a business (only if it doesn't exist)
CREATE OR REPLACE FUNCTION get_base_period_years(
  business_start_year INTEGER,
  tax_year INTEGER
)
RETURNS INTEGER[] AS $$
DECLARE
  start_from_year INTEGER;
  years INTEGER[] := ARRAY[]::INTEGER[];
  year INTEGER;
BEGIN
  -- Start from 8 years ago or business start year, whichever is later
  start_from_year := GREATEST(business_start_year, tax_year - 8);
  
  -- Generate array of years from start_from_year to tax_year - 1
  FOR year IN start_from_year..(tax_year - 1) LOOP
    years := array_append(years, year);
  END LOOP;
  
  RETURN years;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate base amount for R&D credit (only if it doesn't exist)
CREATE OR REPLACE FUNCTION calculate_base_amount(
  business_id UUID,
  tax_year INTEGER
)
RETURNS NUMERIC AS $$
DECLARE
  business_record RECORD;
  base_period_years INTEGER[];
  total_gross_receipts NUMERIC := 0;
  total_qre NUMERIC := 0;
  year_count INTEGER := 0;
  year INTEGER;
  historical_item JSONB;
BEGIN
  -- Get business record
  SELECT * INTO business_record 
  FROM rd_businesses 
  WHERE id = business_id;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Get base period years
  base_period_years := get_base_period_years(business_record.start_year, tax_year);
  
  -- Calculate averages from historical data
  FOREACH year IN ARRAY base_period_years LOOP
    -- Find historical data for this year
    FOR historical_item IN SELECT jsonb_array_elements(business_record.historical_data) LOOP
      IF (historical_item->>'year')::INTEGER = year THEN
        total_gross_receipts := total_gross_receipts + (historical_item->>'gross_receipts')::NUMERIC;
        total_qre := total_qre + (historical_item->>'qre')::NUMERIC;
        year_count := year_count + 1;
        EXIT;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Return average QRE if we have data, otherwise 0
  IF year_count > 0 THEN
    RETURN total_qre / year_count;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_base_period_years(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_base_amount(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_historical_data(JSONB) TO authenticated; 