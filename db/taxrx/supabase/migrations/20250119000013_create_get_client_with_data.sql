-- Create the get_client_with_data function
-- Migration: 20250119000013_create_get_client_with_data.sql

-- Drop the function if it exists
DROP FUNCTION IF EXISTS get_client_with_data(UUID);

-- Create the function to get client with all related data
CREATE OR REPLACE FUNCTION get_client_with_data(p_client_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_client JSONB;
    v_personal_years JSONB;
    v_businesses JSONB;
BEGIN
    -- Get client data (including city and zip_code)
    SELECT to_jsonb(c.*) INTO v_client
    FROM clients c
    WHERE c.id = p_client_id;

    -- Get personal years
    SELECT jsonb_agg(to_jsonb(py.*)) INTO v_personal_years
    FROM personal_years py
    WHERE py.client_id = p_client_id;

    -- Get businesses with their years
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', b.id,
            'business_name', b.business_name,
            'entity_type', b.entity_type,
            'ein', b.ein,
            'business_address', b.business_address,
            'business_city', b.business_city,
            'business_state', b.business_state,
            'business_zip', b.business_zip,
            'business_phone', b.business_phone,
            'business_email', b.business_email,
            'industry', b.industry,
            'year_established', b.year_established,
            'annual_revenue', b.annual_revenue,
            'employee_count', b.employee_count,
            'is_active', b.is_active,
            'created_at', b.created_at,
            'updated_at', b.updated_at,
            'business_years', (
                SELECT jsonb_agg(to_jsonb(by.*))
                FROM business_years by
                WHERE by.business_id = b.id
            )
        )
    ) INTO v_businesses
    FROM businesses b
    WHERE b.client_id = p_client_id;

    -- Combine all data
    v_result := jsonb_build_object(
        'client', v_client,
        'personal_years', COALESCE(v_personal_years, '[]'::jsonb),
        'businesses', COALESCE(v_businesses, '[]'::jsonb)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 