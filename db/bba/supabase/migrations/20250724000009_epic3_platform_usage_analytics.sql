-- Epic 3 Sprint 4: Platform Usage Analytics
-- File: 20250724000009_epic3_platform_usage_analytics.sql
-- Purpose: Platform usage tracking, analytics, and performance monitoring
-- Story: 4.3 - Platform Usage Analytics (7 points)

BEGIN;

-- ========= PART 1: USAGE TRACKING TABLES =========

-- Create platform usage metrics table
CREATE TABLE IF NOT EXISTS public.platform_usage_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL,
    metric_hour INTEGER DEFAULT 0 CHECK (metric_hour >= 0 AND metric_hour <= 23),
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL DEFAULT 0,
    dimensions JSONB DEFAULT '{}',
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    tool_id UUID REFERENCES public.tools(id) ON DELETE SET NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.platform_usage_metrics IS 'Aggregated platform usage metrics for analytics';

-- Create feature usage tracking table
CREATE TABLE IF NOT EXISTS public.feature_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    feature_category VARCHAR(50) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    first_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(profile_id, feature_name)
);

COMMENT ON TABLE public.feature_usage_tracking IS 'Track feature adoption and usage patterns';

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    endpoint VARCHAR(200),
    operation_type VARCHAR(50),
    response_time_ms INTEGER,
    status_code INTEGER,
    error_message TEXT,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    request_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.performance_metrics IS 'API and operation performance tracking';

-- ========= PART 2: ANALYTICS AGGREGATION FUNCTIONS =========

-- Function to aggregate daily usage metrics
CREATE OR REPLACE FUNCTION aggregate_daily_usage_metrics(
    p_date DATE DEFAULT CURRENT_DATE - INTERVAL '1 day'
) RETURNS TABLE (
    metric_type VARCHAR,
    metric_count INTEGER,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
    v_end_time TIMESTAMP WITH TIME ZONE;
BEGIN
    v_start_time := p_date::TIMESTAMP WITH TIME ZONE;
    v_end_time := (p_date + INTERVAL '1 day')::TIMESTAMP WITH TIME ZONE;
    
    -- Active users metric
    INSERT INTO public.platform_usage_metrics (
        metric_date, metric_type, metric_name, metric_value
    )
    SELECT 
        p_date,
        'user_activity',
        'daily_active_users',
        COUNT(DISTINCT actor_id)
    FROM public.account_activities
    WHERE created_at >= v_start_time AND created_at < v_end_time;
    
    -- Tool usage metrics
    INSERT INTO public.platform_usage_metrics (
        metric_date, metric_type, metric_name, metric_value, tool_id
    )
    SELECT 
        p_date,
        'tool_usage',
        'daily_tool_sessions',
        COUNT(*),
        tool_id
    FROM public.tool_usage_logs
    WHERE session_start >= v_start_time AND session_start < v_end_time
    GROUP BY tool_id;
    
    -- Account activity metrics
    INSERT INTO public.platform_usage_metrics (
        metric_date, metric_type, metric_name, metric_value, dimensions
    )
    SELECT 
        p_date,
        'account_activity',
        'activities_by_type',
        COUNT(*),
        jsonb_build_object('activity_type', activity_type)
    FROM public.account_activities
    WHERE created_at >= v_start_time AND created_at < v_end_time
    GROUP BY activity_type;
    
    -- Payment success rate
    INSERT INTO public.platform_usage_metrics (
        metric_date, metric_type, metric_name, metric_value, dimensions
    )
    SELECT 
        p_date,
        'financial',
        'payment_success_rate',
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(*) FILTER (WHERE status = 'succeeded')::NUMERIC / COUNT(*)::NUMERIC) * 100
            ELSE 0
        END,
        jsonb_build_object(
            'total_payments', COUNT(*),
            'successful_payments', COUNT(*) FILTER (WHERE status = 'succeeded')
        )
    FROM public.payments
    WHERE created_at >= v_start_time AND created_at < v_end_time;
    
    RETURN QUERY
    SELECT 
        'user_activity'::VARCHAR, 
        COUNT(*)::INTEGER,
        TRUE,
        'User activity metrics aggregated'::TEXT
    UNION ALL
    SELECT 
        'tool_usage'::VARCHAR,
        COUNT(*)::INTEGER,
        TRUE,
        'Tool usage metrics aggregated'::TEXT
    UNION ALL
    SELECT 
        'financial'::VARCHAR,
        COUNT(*)::INTEGER,
        TRUE,
        'Financial metrics aggregated'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION aggregate_daily_usage_metrics IS 'Aggregate daily platform usage metrics';

-- Function to get usage trends
CREATE OR REPLACE FUNCTION get_usage_trends(
    p_metric_type VARCHAR,
    p_days INTEGER DEFAULT 30,
    p_account_id UUID DEFAULT NULL
) RETURNS TABLE (
    metric_date DATE,
    metric_name VARCHAR,
    metric_value NUMERIC,
    dimensions JSONB,
    trend_direction VARCHAR,
    percentage_change NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_metrics AS (
        SELECT 
            pum.metric_date,
            pum.metric_name,
            pum.metric_value,
            pum.dimensions,
            LAG(pum.metric_value) OVER (
                PARTITION BY pum.metric_name 
                ORDER BY pum.metric_date
            ) as previous_value
        FROM public.platform_usage_metrics pum
        WHERE pum.metric_type = p_metric_type
          AND pum.metric_date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
          AND (p_account_id IS NULL OR pum.account_id = p_account_id)
    )
    SELECT 
        dm.metric_date,
        dm.metric_name,
        dm.metric_value,
        dm.dimensions,
        CASE 
            WHEN dm.previous_value IS NULL THEN 'new'
            WHEN dm.metric_value > dm.previous_value THEN 'up'
            WHEN dm.metric_value < dm.previous_value THEN 'down'
            ELSE 'stable'
        END as trend_direction,
        CASE 
            WHEN dm.previous_value IS NOT NULL AND dm.previous_value > 0 THEN
                ((dm.metric_value - dm.previous_value) / dm.previous_value) * 100
            ELSE NULL
        END as percentage_change
    FROM daily_metrics dm
    ORDER BY dm.metric_date DESC, dm.metric_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_usage_trends IS 'Get usage trends with percentage changes';

-- Function to track feature usage
CREATE OR REPLACE FUNCTION track_feature_usage(
    p_profile_id UUID,
    p_feature_name VARCHAR,
    p_feature_category VARCHAR,
    p_metadata JSONB DEFAULT '{}'
) RETURNS VOID AS $$
BEGIN
    INSERT INTO public.feature_usage_tracking (
        profile_id,
        feature_name,
        feature_category,
        usage_metadata,
        last_used_at
    ) VALUES (
        p_profile_id,
        p_feature_name,
        p_feature_category,
        p_metadata,
        NOW()
    )
    ON CONFLICT (profile_id, feature_name) DO UPDATE
    SET 
        usage_count = feature_usage_tracking.usage_count + 1,
        last_used_at = NOW(),
        usage_metadata = feature_usage_tracking.usage_metadata || p_metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION track_feature_usage IS 'Track feature usage for adoption analytics';

-- Function to get feature adoption stats
CREATE OR REPLACE FUNCTION get_feature_adoption_stats(
    p_feature_category VARCHAR DEFAULT NULL,
    p_days INTEGER DEFAULT 30
) RETURNS TABLE (
    feature_name VARCHAR,
    feature_category VARCHAR,
    total_users INTEGER,
    total_usage_count BIGINT,
    avg_usage_per_user NUMERIC,
    adoption_rate NUMERIC,
    first_adoption DATE,
    last_adoption DATE
) AS $$
DECLARE
    v_total_active_users INTEGER;
BEGIN
    -- Get total active users in period
    SELECT COUNT(DISTINCT profile_id) INTO v_total_active_users
    FROM public.account_activities
    WHERE created_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL;
    
    RETURN QUERY
    SELECT 
        fut.feature_name,
        fut.feature_category,
        COUNT(DISTINCT fut.profile_id)::INTEGER as total_users,
        SUM(fut.usage_count)::BIGINT as total_usage_count,
        AVG(fut.usage_count)::NUMERIC as avg_usage_per_user,
        CASE 
            WHEN v_total_active_users > 0 THEN
                (COUNT(DISTINCT fut.profile_id)::NUMERIC / v_total_active_users::NUMERIC) * 100
            ELSE 0
        END as adoption_rate,
        MIN(fut.first_used_at::DATE) as first_adoption,
        MAX(fut.last_used_at::DATE) as last_adoption
    FROM public.feature_usage_tracking fut
    WHERE (p_feature_category IS NULL OR fut.feature_category = p_feature_category)
      AND fut.last_used_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    GROUP BY fut.feature_name, fut.feature_category
    ORDER BY total_users DESC, total_usage_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_feature_adoption_stats IS 'Get feature adoption statistics';

-- Function to analyze performance metrics
CREATE OR REPLACE FUNCTION analyze_performance_metrics(
    p_hours INTEGER DEFAULT 24,
    p_percentile INTEGER DEFAULT 95
) RETURNS TABLE (
    endpoint VARCHAR,
    operation_type VARCHAR,
    request_count BIGINT,
    avg_response_time_ms NUMERIC,
    p95_response_time_ms NUMERIC,
    error_rate NUMERIC,
    success_rate NUMERIC,
    unique_users INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.endpoint,
        pm.operation_type,
        COUNT(*)::BIGINT as request_count,
        AVG(pm.response_time_ms)::NUMERIC as avg_response_time_ms,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY pm.response_time_ms)::NUMERIC as p95_response_time_ms,
        (COUNT(*) FILTER (WHERE pm.status_code >= 400)::NUMERIC / COUNT(*)::NUMERIC) * 100 as error_rate,
        (COUNT(*) FILTER (WHERE pm.status_code < 400)::NUMERIC / COUNT(*)::NUMERIC) * 100 as success_rate,
        COUNT(DISTINCT pm.profile_id)::INTEGER as unique_users
    FROM public.performance_metrics pm
    WHERE pm.metric_timestamp >= NOW() - (p_hours || ' hours')::INTERVAL
    GROUP BY pm.endpoint, pm.operation_type
    ORDER BY request_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analyze_performance_metrics IS 'Analyze API performance metrics';

-- Function to get capacity planning metrics
CREATE OR REPLACE FUNCTION get_capacity_planning_metrics(
    p_days INTEGER DEFAULT 90
) RETURNS TABLE (
    metric_name VARCHAR,
    current_value NUMERIC,
    growth_rate NUMERIC,
    projected_30_days NUMERIC,
    projected_90_days NUMERIC,
    capacity_threshold NUMERIC,
    days_until_threshold INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH growth_data AS (
        SELECT 
            'active_users' as metric_name,
            COUNT(DISTINCT profile_id) as current_value,
            COUNT(DISTINCT profile_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_value,
            COUNT(DISTINCT profile_id) FILTER (WHERE created_at >= NOW() - INTERVAL '90 days') as older_value
        FROM public.account_activities
        WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
    ),
    growth_rates AS (
        SELECT 
            metric_name,
            current_value,
            CASE 
                WHEN older_value > 0 THEN 
                    ((recent_value::NUMERIC - older_value::NUMERIC) / older_value::NUMERIC) * 100
                ELSE 0
            END as growth_rate
        FROM growth_data
    )
    SELECT 
        gr.metric_name,
        gr.current_value,
        gr.growth_rate,
        gr.current_value * (1 + gr.growth_rate/100) as projected_30_days,
        gr.current_value * POWER(1 + gr.growth_rate/100, 3) as projected_90_days,
        10000::NUMERIC as capacity_threshold, -- Example threshold
        CASE 
            WHEN gr.growth_rate > 0 THEN
                (LOG(10000::NUMERIC / gr.current_value) / LOG(1 + gr.growth_rate/100) * 30)::INTEGER
            ELSE NULL
        END as days_until_threshold
    FROM growth_rates gr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_capacity_planning_metrics IS 'Get capacity planning projections';

-- ========= PART 3: INDEXES FOR PERFORMANCE =========

-- Platform usage metrics indexes
CREATE INDEX IF NOT EXISTS idx_platform_usage_metrics_date ON public.platform_usage_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_platform_usage_metrics_type ON public.platform_usage_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_platform_usage_metrics_account ON public.platform_usage_metrics(account_id) WHERE account_id IS NOT NULL;

-- Feature usage tracking indexes
CREATE INDEX IF NOT EXISTS idx_feature_usage_profile ON public.feature_usage_tracking(profile_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_category ON public.feature_usage_tracking(feature_category);
CREATE INDEX IF NOT EXISTS idx_feature_usage_last_used ON public.feature_usage_tracking(last_used_at DESC);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON public.performance_metrics(metric_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_endpoint ON public.performance_metrics(endpoint, operation_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_status ON public.performance_metrics(status_code);

-- ========= PART 4: ENABLE ROW LEVEL SECURITY =========

ALTER TABLE public.platform_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- ========= PART 5: CREATE RLS POLICIES =========

-- Platform usage metrics policies (admin only)
CREATE POLICY "Admins can view platform usage metrics" ON public.platform_usage_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- Feature usage tracking policies
CREATE POLICY "Users can view own feature usage" ON public.feature_usage_tracking
    FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all feature usage" ON public.feature_usage_tracking
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- Performance metrics policies (admin only)
CREATE POLICY "Admins can view performance metrics" ON public.performance_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- ========= PART 6: GRANT PERMISSIONS =========

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION aggregate_daily_usage_metrics(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_trends(VARCHAR, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION track_feature_usage(UUID, VARCHAR, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION get_feature_adoption_stats(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_performance_metrics(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_capacity_planning_metrics(INTEGER) TO authenticated;

-- Grant table permissions
GRANT SELECT ON public.platform_usage_metrics TO authenticated;
GRANT SELECT, INSERT ON public.feature_usage_tracking TO authenticated;
GRANT SELECT ON public.performance_metrics TO authenticated;

COMMIT;