-- Epic 3 Sprint 2 Day 4: Tool Analytics Database Functions
-- File: 20250722000000_tool_analytics_functions.sql
-- Purpose: Create comprehensive analytics functions for tool usage reporting

BEGIN;

-- ========= PART 1: TOOL USAGE METRICS FUNCTION =========

-- Function to get comprehensive tool usage metrics
CREATE OR REPLACE FUNCTION get_tool_usage_metrics(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_account_id UUID DEFAULT NULL,
    p_tool_id UUID DEFAULT NULL
) RETURNS TABLE (
    total_events BIGINT,
    unique_accounts BIGINT,
    unique_users BIGINT,
    avg_session_duration NUMERIC,
    success_rate NUMERIC,
    data_volume_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT tul.account_id) as unique_accounts,
        COUNT(DISTINCT tul.profile_id) as unique_users,
        COALESCE(AVG(tul.duration_seconds), 0) as avg_session_duration,
        COALESCE(
            (COUNT(*) FILTER (WHERE tul.success = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 
            100
        ) as success_rate,
        COALESCE(SUM(tul.data_volume_mb), 0) as data_volume_mb
    FROM public.tool_usage_logs tul
    WHERE tul.created_at >= p_start_date 
        AND tul.created_at <= p_end_date
        AND (p_account_id IS NULL OR tul.account_id = p_account_id)
        AND (p_tool_id IS NULL OR tul.tool_id = p_tool_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tool_usage_metrics IS 'Get comprehensive usage metrics for specified time period and optional filters';

-- ========= PART 2: USAGE TRENDS FUNCTION =========

-- Function to get usage trends over time
CREATE OR REPLACE FUNCTION get_usage_trends(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_interval VARCHAR DEFAULT 'day'
) RETURNS TABLE (
    date TIMESTAMP WITH TIME ZONE,
    total_events BIGINT,
    unique_accounts BIGINT,
    avg_duration NUMERIC,
    success_rate NUMERIC
) AS $$
DECLARE
    trunc_format TEXT;
BEGIN
    -- Set truncation format based on interval
    CASE p_interval
        WHEN 'hour' THEN trunc_format := 'hour';
        WHEN 'day' THEN trunc_format := 'day';
        WHEN 'week' THEN trunc_format := 'week';
        WHEN 'month' THEN trunc_format := 'month';
        ELSE trunc_format := 'day';
    END CASE;

    RETURN QUERY
    SELECT 
        date_trunc(trunc_format, tul.created_at) as date,
        COUNT(*) as total_events,
        COUNT(DISTINCT tul.account_id) as unique_accounts,
        COALESCE(AVG(tul.duration_seconds), 0) as avg_duration,
        COALESCE(
            (COUNT(*) FILTER (WHERE tul.success = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100), 
            100
        ) as success_rate
    FROM public.tool_usage_logs tul
    WHERE tul.created_at >= p_start_date 
        AND tul.created_at <= p_end_date
    GROUP BY date_trunc(trunc_format, tul.created_at)
    ORDER BY date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_usage_trends IS 'Get usage trends aggregated by specified time interval';

-- ========= PART 3: ACCOUNT USAGE ANALYTICS FUNCTION =========

-- Function to get detailed account usage analytics
CREATE OR REPLACE FUNCTION get_account_usage_analytics(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_account_type VARCHAR DEFAULT NULL
) RETURNS TABLE (
    account_id UUID,
    account_name VARCHAR,
    account_type VARCHAR,
    total_events BIGINT,
    unique_tools BIGINT,
    avg_session_duration NUMERIC,
    last_activity TIMESTAMP WITH TIME ZONE,
    most_used_tool VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH account_stats AS (
        SELECT 
            tul.account_id,
            COUNT(*) as total_events,
            COUNT(DISTINCT tul.tool_id) as unique_tools,
            AVG(tul.duration_seconds) as avg_session_duration,
            MAX(tul.created_at) as last_activity
        FROM public.tool_usage_logs tul
        WHERE tul.created_at >= p_start_date 
            AND tul.created_at <= p_end_date
        GROUP BY tul.account_id
    ),
    most_used_tools AS (
        SELECT DISTINCT ON (tul.account_id)
            tul.account_id,
            t.name as most_used_tool
        FROM public.tool_usage_logs tul
        JOIN public.tools t ON tul.tool_id = t.id
        WHERE tul.created_at >= p_start_date 
            AND tul.created_at <= p_end_date
        GROUP BY tul.account_id, tul.tool_id, t.name
        ORDER BY tul.account_id, COUNT(*) DESC
    )
    SELECT 
        a.id as account_id,
        a.name as account_name,
        a.type as account_type,
        COALESCE(ast.total_events, 0) as total_events,
        COALESCE(ast.unique_tools, 0) as unique_tools,
        COALESCE(ast.avg_session_duration, 0) as avg_session_duration,
        ast.last_activity,
        mut.most_used_tool
    FROM public.accounts a
    LEFT JOIN account_stats ast ON a.id = ast.account_id
    LEFT JOIN most_used_tools mut ON a.id = mut.account_id
    WHERE (p_account_type IS NULL OR a.type = p_account_type)
        AND ast.total_events > 0
    ORDER BY ast.total_events DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_account_usage_analytics IS 'Get detailed analytics for accounts with usage data';

-- ========= PART 4: TOOL USAGE ANALYTICS FUNCTION =========

-- Function to get detailed tool usage analytics
CREATE OR REPLACE FUNCTION get_tool_usage_analytics(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_tool_category VARCHAR DEFAULT NULL
) RETURNS TABLE (
    tool_id UUID,
    tool_name VARCHAR,
    category VARCHAR,
    total_events BIGINT,
    unique_accounts BIGINT,
    avg_duration NUMERIC,
    success_rate NUMERIC,
    growth_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH current_period AS (
        SELECT 
            tul.tool_id,
            COUNT(*) as current_events,
            COUNT(DISTINCT tul.account_id) as unique_accounts,
            AVG(tul.duration_seconds) as avg_duration,
            (COUNT(*) FILTER (WHERE tul.success = true)::NUMERIC / NULLIF(COUNT(*), 0) * 100) as success_rate
        FROM public.tool_usage_logs tul
        WHERE tul.created_at >= p_start_date 
            AND tul.created_at <= p_end_date
        GROUP BY tul.tool_id
    ),
    previous_period AS (
        SELECT 
            tul.tool_id,
            COUNT(*) as previous_events
        FROM public.tool_usage_logs tul
        WHERE tul.created_at >= (p_start_date - (p_end_date - p_start_date))
            AND tul.created_at < p_start_date
        GROUP BY tul.tool_id
    )
    SELECT 
        t.id as tool_id,
        t.name as tool_name,
        t.category,
        COALESCE(cp.current_events, 0) as total_events,
        COALESCE(cp.unique_accounts, 0) as unique_accounts,
        COALESCE(cp.avg_duration, 0) as avg_duration,
        COALESCE(cp.success_rate, 100) as success_rate,
        CASE 
            WHEN pp.previous_events > 0 THEN 
                ((cp.current_events::NUMERIC - pp.previous_events::NUMERIC) / pp.previous_events::NUMERIC * 100)
            ELSE 0
        END as growth_rate
    FROM public.tools t
    LEFT JOIN current_period cp ON t.id = cp.tool_id
    LEFT JOIN previous_period pp ON t.id = pp.tool_id
    WHERE (p_tool_category IS NULL OR t.category = p_tool_category)
        AND cp.current_events > 0
    ORDER BY cp.current_events DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_tool_usage_analytics IS 'Get detailed analytics for tools with growth rate comparison';

-- ========= PART 5: USAGE EXPORT DATA FUNCTION =========

-- Function to get comprehensive data for export
CREATE OR REPLACE FUNCTION get_usage_export_data(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE,
    p_account_id UUID DEFAULT NULL,
    p_tool_id UUID DEFAULT NULL,
    p_format VARCHAR DEFAULT 'csv'
) RETURNS TABLE (
    event_date TIMESTAMP WITH TIME ZONE,
    account_name VARCHAR,
    account_type VARCHAR,
    tool_name VARCHAR,
    tool_category VARCHAR,
    action VARCHAR,
    feature_used VARCHAR,
    duration_seconds INTEGER,
    data_volume_mb NUMERIC,
    success BOOLEAN,
    error_code VARCHAR,
    session_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tul.created_at as event_date,
        a.name as account_name,
        a.type as account_type,
        t.name as tool_name,
        t.category as tool_category,
        tul.action,
        tul.feature_used,
        tul.duration_seconds,
        tul.data_volume_mb,
        tul.success,
        tul.error_code,
        tul.session_id
    FROM public.tool_usage_logs tul
    JOIN public.accounts a ON tul.account_id = a.id
    JOIN public.tools t ON tul.tool_id = t.id
    WHERE tul.created_at >= p_start_date 
        AND tul.created_at <= p_end_date
        AND (p_account_id IS NULL OR tul.account_id = p_account_id)
        AND (p_tool_id IS NULL OR tul.tool_id = p_tool_id)
    ORDER BY tul.created_at DESC
    LIMIT 10000; -- Limit to prevent excessive data export
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_usage_export_data IS 'Get comprehensive usage data for export in various formats';

-- ========= PART 6: ANALYTICS PERFORMANCE VIEWS =========

-- Create materialized view for daily usage summary (for better performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_usage_summary AS
SELECT 
    date_trunc('day', tul.created_at) as usage_date,
    tul.tool_id,
    t.name as tool_name,
    t.slug as tool_slug,
    COUNT(*) as total_events,
    COUNT(DISTINCT tul.account_id) as unique_accounts,
    COUNT(DISTINCT tul.profile_id) as unique_users,
    AVG(tul.duration_seconds) as avg_duration_seconds,
    SUM(tul.data_volume_mb) as total_data_volume_mb,
    COUNT(*) FILTER (WHERE tul.success = false) as failed_events,
    COUNT(*) FILTER (WHERE tul.success = true) as successful_events
FROM public.tool_usage_logs tul
JOIN public.tools t ON tul.tool_id = t.id
WHERE tul.created_at >= NOW() - INTERVAL '365 days'
GROUP BY date_trunc('day', tul.created_at), tul.tool_id, t.name, t.slug
ORDER BY usage_date DESC, total_events DESC;

-- Create unique index for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_usage_summary_unique 
    ON daily_usage_summary(usage_date, tool_id);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_daily_usage_summary_date 
    ON daily_usage_summary(usage_date DESC);

CREATE INDEX IF NOT EXISTS idx_daily_usage_summary_tool 
    ON daily_usage_summary(tool_id, usage_date DESC);

COMMENT ON MATERIALIZED VIEW daily_usage_summary IS 'Pre-computed daily usage statistics for improved analytics performance';

-- ========= PART 7: REFRESH FUNCTION FOR MATERIALIZED VIEW =========

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_usage_analytics() RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_usage_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_usage_analytics IS 'Refresh the daily usage summary materialized view';

-- ========= PART 8: AUTOMATIC REFRESH SETUP =========

-- Create a function to schedule automatic refresh (would need pg_cron extension in production)
CREATE OR REPLACE FUNCTION schedule_analytics_refresh() RETURNS VOID AS $$
BEGIN
    -- This would require pg_cron extension
    -- For now, we'll document the manual refresh process
    RAISE NOTICE 'To enable automatic refresh, install pg_cron extension and run:';
    RAISE NOTICE 'SELECT cron.schedule(''refresh-usage-analytics'', ''0 2 * * *'', ''SELECT refresh_usage_analytics();'');';
END;
$$ LANGUAGE plpgsql;

-- ========= PART 9: GRANT PERMISSIONS =========

-- Grant execute permissions for analytics functions
GRANT EXECUTE ON FUNCTION get_tool_usage_metrics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_trends(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_account_usage_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tool_usage_analytics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION get_usage_export_data(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, UUID, UUID, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_usage_analytics() TO authenticated;

-- Grant select permissions on materialized view
GRANT SELECT ON daily_usage_summary TO authenticated;

COMMIT;