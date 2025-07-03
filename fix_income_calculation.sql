-- Fix income calculation in get_unified_client_list function
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_unified_client_list(
    p_tool_filter TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL,
    p_affiliate_id UUID DEFAULT NULL
)
RETURNS TABLE (
    client_file_id UUID,
    business_id UUID,
    admin_id UUID,
    affiliate_id UUID,
    archived BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    email TEXT,
    business_name TEXT,
    entity_type TEXT,
    tool_slug TEXT,
    tool_status TEXT,
    total_income DECIMAL(15,2),
    filing_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        acf.id AS client_file_id,
        acf.business_id,
        acf.admin_id,
        acf.affiliate_id,
        acf.archived,
        acf.created_at,
        acf.full_name,
        acf.email,
        cb.business_name,
        cb.entity_type,
        te.tool_slug,
        te.status AS tool_status,
        COALESCE(
            (SELECT (wages_income + passive_income + unearned_income + capital_gains) 
             FROM personal_years py 
             WHERE py.client_id = acf.id 
             ORDER BY py.year DESC 
             LIMIT 1),
            (acf.wages_income + acf.passive_income + acf.unearned_income + acf.capital_gains)
        ) AS total_income,
        acf.filing_status
    FROM public.admin_client_files acf
    LEFT JOIN public.centralized_businesses cb ON acf.business_id = cb.id
    LEFT JOIN public.tool_enrollments te ON te.business_id = cb.id
    WHERE acf.archived IS NOT TRUE
    AND (p_tool_filter IS NULL OR te.tool_slug = p_tool_filter)
    AND (p_admin_id IS NULL OR acf.admin_id = p_admin_id)
    AND (p_affiliate_id IS NULL OR acf.affiliate_id = p_affiliate_id)
    ORDER BY acf.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_unified_client_list TO authenticated; 