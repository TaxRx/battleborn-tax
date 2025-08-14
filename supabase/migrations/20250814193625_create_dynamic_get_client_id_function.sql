-- Create dynamic get_client_id function
-- This function can handle both direct and indirect client_id lookups using optional join parameters
-- Most common use case (business_id foreign key) is handled with convenient defaults

CREATE OR REPLACE FUNCTION public.get_client_id(
  p_table_name text,                              -- Source table name
  p_record_id uuid,                               -- Record ID in source table  
  p_join_table text DEFAULT NULL,                -- Optional join table (has client_id)
  p_foreign_key_column text DEFAULT 'business_id' -- Foreign key column (defaults to business_id)
) 
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  client_uuid uuid;
  sql_query text;
BEGIN
  -- Input validation
  IF p_table_name IS NULL OR p_record_id IS NULL THEN
    RETURN NULL;
  END IF;
  
--   -- Validate table names exist in information_schema for security
--   IF NOT EXISTS (
--     SELECT 1 FROM information_schema.tables 
--     WHERE table_schema = 'public' AND table_name = p_table_name
--   ) THEN
--     RETURN NULL;
--   END IF;
  
  -- If join table specified, validate it exists too
--   IF p_join_table IS NOT NULL AND NOT EXISTS (
--     SELECT 1 FROM information_schema.tables 
--     WHERE table_schema = 'public' AND table_name = p_join_table
--   ) THEN
--     RETURN NULL;
--   END IF;

  -- Build and execute query based on whether join is needed
  IF p_join_table IS NULL THEN
    -- Direct lookup: table has client_id column
    sql_query := format(
      'SELECT client_id FROM %I WHERE id = $1',
      p_table_name
    );
    
    EXECUTE sql_query INTO client_uuid USING p_record_id;
    
  ELSE
    -- Indirect lookup: join through related table
    sql_query := format(
      'SELECT jt.client_id FROM %I jt INNER JOIN %I st ON jt.id = st.%I WHERE st.id = $1',
      p_join_table,
      p_table_name, 
      p_foreign_key_column
    );
    
    EXECUTE sql_query INTO client_uuid USING p_record_id;
    
  END IF;

  RETURN client_uuid;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Return NULL for any errors rather than throwing
    RETURN NULL;
END;
$function$;

-- Add helpful comment
COMMENT ON FUNCTION public.get_client_id(text, uuid, text, text) IS 
'Dynamically retrieves client_id from any table, with optional join support. 
Usage examples:
- Direct: get_client_id(''rd_businesses'', business_id)
- Indirect: get_client_id(''rd_business_years'', year_id, ''rd_businesses'')
- Custom FK: get_client_id(''some_table'', record_id, ''businesses'', ''custom_business_id'')';

-- Test examples (commented out for production)
/*
-- Test direct lookups
-- SELECT get_client_id('rd_businesses', 'some-uuid-here');
-- SELECT get_client_id('businesses', 'some-uuid-here');

-- Test indirect lookups with default business_id foreign key  
-- SELECT get_client_id('rd_business_years', 'some-year-uuid', 'rd_businesses');
-- SELECT get_client_id('business_years', 'some-year-uuid', 'businesses');

-- Test with custom foreign key column
-- SELECT get_client_id('some_other_table', 'some-uuid', 'businesses', 'custom_fk_column');
*/