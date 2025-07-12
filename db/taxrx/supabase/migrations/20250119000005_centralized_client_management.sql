-- Centralized Tax Planning Client Management System
-- Migration: 20250119000005_centralized_client_management.sql

-- 1. Note: admin_client_files table already exists with the following structure:
-- id, client_id, admin_id, affiliate_id, status, created_at, updated_at, 
-- tax_profile_data, last_calculation_date, projected_savings, archived, archived_at
-- No need to create it again

-- 2. Create the centralized_businesses table (normalized business data for centralized management)
-- Drop existing table if it exists to ensure correct schema
DROP TABLE IF EXISTS public.centralized_businesses CASCADE;

CREATE TABLE public.centralized_businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name TEXT NOT NULL,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('LLC', 'S-Corp', 'C-Corp', 'Partnership', 'Sole Proprietorship', 'Other')),
    ein TEXT,
    business_address TEXT,
    business_city TEXT,
    business_state TEXT,
    business_zip TEXT,
    business_phone TEXT,
    business_email TEXT,
    industry TEXT,
    year_established INTEGER,
    annual_revenue DECIMAL(15,2),
    employee_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id),
    archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP WITH TIME ZONE,
    archived_by UUID REFERENCES public.profiles(id)
);

-- 3. Create the tool_enrollments table (tracks tool participation)
-- Drop existing table if it exists to ensure correct schema
DROP TABLE IF EXISTS public.tool_enrollments CASCADE;

CREATE TABLE public.tool_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_file_id UUID NOT NULL REFERENCES public.admin_client_files(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.centralized_businesses(id) ON DELETE CASCADE,
    tool_slug TEXT NOT NULL CHECK (tool_slug IN ('rd', 'augusta', 'hire_children', 'cost_segregation', 'convertible_bonds', 'tax_planning')),
    enrolled_by UUID REFERENCES public.profiles(id),
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
    notes TEXT,
    UNIQUE(client_file_id, business_id, tool_slug)
);

-- 4. Update admin_client_files table to include business_id
ALTER TABLE public.admin_client_files 
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES public.centralized_businesses(id) ON DELETE SET NULL;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_centralized_businesses_created_by ON public.centralized_businesses(created_by);
CREATE INDEX IF NOT EXISTS idx_centralized_businesses_archived ON public.centralized_businesses(archived);
CREATE INDEX IF NOT EXISTS idx_tool_enrollments_client_file_id ON public.tool_enrollments(client_file_id);
CREATE INDEX IF NOT EXISTS idx_tool_enrollments_business_id ON public.tool_enrollments(business_id);
CREATE INDEX IF NOT EXISTS idx_tool_enrollments_tool_slug ON public.tool_enrollments(tool_slug);
CREATE INDEX IF NOT EXISTS idx_tool_enrollments_status ON public.tool_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_admin_client_files_business_id ON public.admin_client_files(business_id);

-- 6. Create RLS policies for centralized_businesses table
ALTER TABLE public.centralized_businesses ENABLE ROW LEVEL SECURITY;

-- Admins can see all businesses
CREATE POLICY "Admins can view all businesses" ON public.centralized_businesses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can see businesses they created or are enrolled in
CREATE POLICY "Users can view their own businesses" ON public.centralized_businesses
    FOR SELECT USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.tool_enrollments te
            JOIN public.admin_client_files acf ON te.client_file_id = acf.id
            WHERE te.business_id = centralized_businesses.id 
            AND acf.admin_id = auth.uid()
        )
    );

-- Admins can insert/update/delete all businesses
CREATE POLICY "Admins can manage all businesses" ON public.centralized_businesses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can manage their own businesses
CREATE POLICY "Users can manage their own businesses" ON public.centralized_businesses
    FOR ALL USING (created_by = auth.uid());

-- 6. Create RLS policies for tool_enrollments table
ALTER TABLE public.tool_enrollments ENABLE ROW LEVEL SECURITY;

-- Admins can see all enrollments
CREATE POLICY "Admins can view all tool enrollments" ON public.tool_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can see their own enrollments
CREATE POLICY "Users can view their own tool enrollments" ON public.tool_enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.admin_client_files acf
            WHERE acf.id = tool_enrollments.client_file_id
            AND acf.admin_id = auth.uid()
        )
    );

-- Admins can manage all enrollments
CREATE POLICY "Admins can manage all tool enrollments" ON public.tool_enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can manage their own enrollments
CREATE POLICY "Users can manage their own tool enrollments" ON public.tool_enrollments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_client_files acf
            WHERE acf.id = tool_enrollments.client_file_id
            AND acf.admin_id = auth.uid()
        )
    );

-- 7. Create functions for business management
CREATE OR REPLACE FUNCTION public.create_business_with_enrollment(
    p_business_name TEXT,
    p_entity_type TEXT,
    p_client_file_id UUID,
    p_tool_slug TEXT,
    p_ein TEXT DEFAULT NULL,
    p_business_address TEXT DEFAULT NULL,
    p_business_city TEXT DEFAULT NULL,
    p_business_state TEXT DEFAULT NULL,
    p_business_zip TEXT DEFAULT NULL,
    p_business_phone TEXT DEFAULT NULL,
    p_business_email TEXT DEFAULT NULL,
    p_industry TEXT DEFAULT NULL,
    p_year_established INTEGER DEFAULT NULL,
    p_annual_revenue DECIMAL(15,2) DEFAULT NULL,
    p_employee_count INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_business_id UUID;
BEGIN
    -- Insert business
    INSERT INTO public.centralized_businesses (
        business_name,
        entity_type,
        ein,
        business_address,
        business_city,
        business_state,
        business_zip,
        business_phone,
        business_email,
        industry,
        year_established,
        annual_revenue,
        employee_count,
        created_by
    ) VALUES (
        p_business_name,
        p_entity_type,
        p_ein,
        p_business_address,
        p_business_city,
        p_business_state,
        p_business_zip,
        p_business_phone,
        p_business_email,
        p_industry,
        p_year_established,
        p_annual_revenue,
        p_employee_count,
        auth.uid()
    ) RETURNING id INTO v_business_id;

    -- Create tool enrollment
    INSERT INTO public.tool_enrollments (
        client_file_id,
        business_id,
        tool_slug,
        enrolled_by
    ) VALUES (
        p_client_file_id,
        v_business_id,
        p_tool_slug,
        auth.uid()
    );

    RETURN v_business_id;
END;
$$;

-- 8. Create function to get unified client list
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
            (SELECT total_income FROM personal_tax_years pty 
             WHERE pty.client_id = acf.id 
             ORDER BY pty.tax_year DESC 
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

-- 9. Create function to archive/unarchive clients
CREATE OR REPLACE FUNCTION public.archive_client(
    p_client_file_id UUID,
    p_archive BOOLEAN DEFAULT TRUE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.admin_client_files 
    SET 
        archived = p_archive,
        archived_at = CASE WHEN p_archive THEN NOW() ELSE NULL END
    WHERE id = p_client_file_id;
    
    RETURN FOUND;
END;
$$;

-- 10. Create function to get client tools
CREATE OR REPLACE FUNCTION public.get_client_tools(
    p_client_file_id UUID,
    p_business_id UUID DEFAULT NULL
)
RETURNS TABLE (
    tool_slug TEXT,
    tool_name TEXT,
    status TEXT,
    enrolled_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        te.tool_slug,
        CASE te.tool_slug
            WHEN 'rd' THEN 'R&D Tax Calculator'
            WHEN 'augusta' THEN 'Augusta Rule Estimator'
            WHEN 'hire_children' THEN 'Hire Children Calculator'
            WHEN 'cost_segregation' THEN 'Cost Segregation Calculator'
            WHEN 'convertible_bonds' THEN 'Convertible Tax Bonds Calculator'
            WHEN 'tax_planning' THEN 'Tax Planning'
            ELSE te.tool_slug
        END AS tool_name,
        te.status,
        te.enrolled_at
    FROM public.tool_enrollments te
    WHERE te.client_file_id = p_client_file_id
    AND (p_business_id IS NULL OR te.business_id = p_business_id)
    ORDER BY te.enrolled_at DESC;
END;
$$;

-- 11. Create function to enroll client in tool
CREATE OR REPLACE FUNCTION public.enroll_client_in_tool(
    p_client_file_id UUID,
    p_business_id UUID,
    p_tool_slug TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_enrollment_id UUID;
BEGIN
    INSERT INTO public.tool_enrollments (
        client_file_id,
        business_id,
        tool_slug,
        enrolled_by,
        notes
    ) VALUES (
        p_client_file_id,
        p_business_id,
        p_tool_slug,
        auth.uid(),
        p_notes
    ) ON CONFLICT (client_file_id, business_id, tool_slug) 
    DO UPDATE SET 
        status = 'active',
        notes = COALESCE(p_notes, tool_enrollments.notes),
        enrolled_at = NOW()
    RETURNING id INTO v_enrollment_id;
    
    RETURN v_enrollment_id;
END;
$$;

-- 12. Add comments for documentation
COMMENT ON TABLE public.centralized_businesses IS 'Centralized business information for all tax tools';
COMMENT ON TABLE public.tool_enrollments IS 'Tracks which clients/businesses are enrolled in which tax tools';
COMMENT ON FUNCTION public.create_business_with_enrollment IS 'Creates a new business and enrolls it in a tax tool';
COMMENT ON FUNCTION public.get_unified_client_list IS 'Returns unified client list with filtering options';
COMMENT ON FUNCTION public.archive_client IS 'Archives or unarchives a client';
COMMENT ON FUNCTION public.get_client_tools IS 'Returns all tools a client is enrolled in';
COMMENT ON FUNCTION public.enroll_client_in_tool IS 'Enrolls a client/business in a tax tool';

-- 13. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centralized_businesses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_enrollments TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_business_with_enrollment TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unified_client_list TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_client TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_client_tools TO authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_client_in_tool TO authenticated;

-- 14. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_centralized_businesses_updated_at 
    BEFORE UPDATE ON public.centralized_businesses 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 