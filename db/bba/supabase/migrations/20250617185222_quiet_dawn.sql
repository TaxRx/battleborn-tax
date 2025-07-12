

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'tax_year'
  ) THEN
    ALTER TABLE clients ADD COLUMN tax_year integer NOT NULL DEFAULT 2024;

  END IF;

END $$;
;
