-- Epic 2 Migration: Client Activities and Engagement Tracking
-- Created: 2025-01-12
-- Purpose: Add tables and functions needed for the client dashboard

-- Create activity types enum
CREATE TYPE activity_type AS ENUM (
    'login',
    'document_upload',
    'proposal_view',
    'profile_update',
    'calculation_run',
    'message_sent',
    'meeting_scheduled',
    'payment_made',
    'tool_enrollment',
    'status_update'
);

-- Create activity priority enum
CREATE TYPE activity_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

-- Create engagement status enum
CREATE TYPE engagement_status AS ENUM (
    'active',
    'inactive',
    'pending',
    'completed',
    'on_hold',
    'cancelled'
);

-- Create client_activities table for tracking all client actions
CREATE TABLE client_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type activity_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority activity_priority DEFAULT 'medium',
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for client_activities
CREATE INDEX idx_client_activities_client_id ON client_activities(client_id);
CREATE INDEX idx_client_activities_user_id ON client_activities(user_id);
CREATE INDEX idx_client_activities_type ON client_activities(activity_type);
CREATE INDEX idx_client_activities_created ON client_activities(created_at DESC);
CREATE INDEX idx_client_activities_priority ON client_activities(priority);
CREATE INDEX idx_client_activities_unread ON client_activities(is_read) WHERE is_read = false;

-- Create client_engagement_status table for tracking overall engagement
CREATE TABLE client_engagement_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    status engagement_status NOT NULL DEFAULT 'active',
    last_activity_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    total_activities INTEGER DEFAULT 0,
    pending_actions INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    next_action_due TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one status record per client
    UNIQUE(client_id)
);

-- Create indexes for client_engagement_status
CREATE INDEX idx_client_engagement_status ON client_engagement_status(status);
CREATE INDEX idx_client_engagement_last_activity ON client_engagement_status(last_activity_at DESC);
CREATE INDEX idx_client_engagement_pending ON client_engagement_status(pending_actions) WHERE pending_actions > 0;

-- Create client_dashboard_metrics table for cached dashboard data
CREATE TABLE client_dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_value NUMERIC,
    metric_data JSONB DEFAULT '{}',
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique metric per client
    UNIQUE(client_id, metric_type)
);

-- Create indexes for client_dashboard_metrics
CREATE INDEX idx_client_dashboard_metrics_client ON client_dashboard_metrics(client_id);
CREATE INDEX idx_client_dashboard_metrics_type ON client_dashboard_metrics(metric_type);
CREATE INDEX idx_client_dashboard_metrics_expires ON client_dashboard_metrics(expires_at);

-- Enable RLS on all new tables
ALTER TABLE client_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engagement_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_activities
CREATE POLICY "Client users can view their activities" ON client_activities
    FOR SELECT
    USING (user_has_client_access(auth.uid(), client_id));

CREATE POLICY "Client users can insert their activities" ON client_activities
    FOR INSERT
    WITH CHECK (user_has_client_access(auth.uid(), client_id));

CREATE POLICY "Client owners can update activities" ON client_activities
    FOR UPDATE
    USING (user_has_client_role(auth.uid(), client_id, 'owner'));

-- Create RLS policies for client_engagement_status
CREATE POLICY "Client users can view engagement status" ON client_engagement_status
    FOR SELECT
    USING (user_has_client_access(auth.uid(), client_id));

CREATE POLICY "Client owners can update engagement status" ON client_engagement_status
    FOR UPDATE
    USING (user_has_client_role(auth.uid(), client_id, 'owner'));

-- Create RLS policies for client_dashboard_metrics
CREATE POLICY "Client users can view dashboard metrics" ON client_dashboard_metrics
    FOR SELECT
    USING (user_has_client_access(auth.uid(), client_id));

CREATE POLICY "System can manage dashboard metrics" ON client_dashboard_metrics
    FOR ALL
    USING (true);

-- Create function to log client activities
CREATE OR REPLACE FUNCTION log_client_activity(
    p_client_id UUID,
    p_user_id UUID,
    p_activity_type activity_type,
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_priority activity_priority DEFAULT 'medium',
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    -- Insert the activity
    INSERT INTO client_activities (
        client_id, user_id, activity_type, title, description, priority, metadata
    ) VALUES (
        p_client_id, p_user_id, p_activity_type, p_title, p_description, p_priority, p_metadata
    ) RETURNING id INTO activity_id;
    
    -- Update engagement status
    INSERT INTO client_engagement_status (client_id, last_activity_at, total_activities)
    VALUES (p_client_id, NOW(), 1)
    ON CONFLICT (client_id) DO UPDATE SET
        last_activity_at = NOW(),
        total_activities = client_engagement_status.total_activities + 1,
        updated_at = NOW();
    
    -- Update last login if it's a login activity
    IF p_activity_type = 'login' THEN
        UPDATE client_engagement_status 
        SET last_login_at = NOW(), updated_at = NOW()
        WHERE client_id = p_client_id;
    END IF;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update engagement status
CREATE OR REPLACE FUNCTION update_client_engagement_status(
    p_client_id UUID,
    p_status engagement_status DEFAULT NULL,
    p_pending_actions INTEGER DEFAULT NULL,
    p_completion_percentage DECIMAL DEFAULT NULL,
    p_next_action_due TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO client_engagement_status (client_id, status, pending_actions, completion_percentage, next_action_due)
    VALUES (p_client_id, COALESCE(p_status, 'active'), COALESCE(p_pending_actions, 0), COALESCE(p_completion_percentage, 0.00), p_next_action_due)
    ON CONFLICT (client_id) DO UPDATE SET
        status = COALESCE(p_status, client_engagement_status.status),
        pending_actions = COALESCE(p_pending_actions, client_engagement_status.pending_actions),
        completion_percentage = COALESCE(p_completion_percentage, client_engagement_status.completion_percentage),
        next_action_due = COALESCE(p_next_action_due, client_engagement_status.next_action_due),
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate dashboard metrics
CREATE OR REPLACE FUNCTION calculate_dashboard_metrics(p_client_id UUID) RETURNS JSONB AS $$
DECLARE
    metrics JSONB := '{}';
    total_proposals INTEGER;
    active_proposals INTEGER;
    total_savings DECIMAL;
    recent_activities INTEGER;
    completion_rate DECIMAL;
BEGIN
    -- Calculate proposal metrics
    SELECT COUNT(*), COUNT(CASE WHEN status != 'cancelled' THEN 1 END), COALESCE(SUM(total_savings), 0)
    INTO total_proposals, active_proposals, total_savings
    FROM tax_proposals WHERE client_id = p_client_id::TEXT;
    
    -- Calculate recent activity count (last 30 days)
    SELECT COUNT(*)
    INTO recent_activities
    FROM client_activities 
    WHERE client_id = p_client_id AND created_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate completion rate based on engagement status
    SELECT completion_percentage
    INTO completion_rate
    FROM client_engagement_status
    WHERE client_id = p_client_id;
    
    -- Build metrics JSON
    metrics := jsonb_build_object(
        'total_proposals', COALESCE(total_proposals, 0),
        'active_proposals', COALESCE(active_proposals, 0),
        'total_savings', COALESCE(total_savings, 0),
        'recent_activities', COALESCE(recent_activities, 0),
        'completion_rate', COALESCE(completion_rate, 0.00),
        'calculated_at', NOW()
    );
    
    -- Cache the metrics
    INSERT INTO client_dashboard_metrics (client_id, metric_type, metric_data, expires_at)
    VALUES (p_client_id, 'overview', metrics, NOW() + INTERVAL '1 hour')
    ON CONFLICT (client_id, metric_type) DO UPDATE SET
        metric_data = metrics,
        calculated_at = NOW(),
        expires_at = NOW() + INTERVAL '1 hour',
        updated_at = NOW();
    
    RETURN metrics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create updated_at triggers for all new tables
CREATE TRIGGER update_client_activities_updated_at
    BEFORE UPDATE ON client_activities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_engagement_status_updated_at
    BEFORE UPDATE ON client_engagement_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_dashboard_metrics_updated_at
    BEFORE UPDATE ON client_dashboard_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for recent client activities
CREATE VIEW recent_client_activities AS
SELECT 
    ca.*,
    c.full_name as client_name,
    p.full_name as user_name
FROM client_activities ca
JOIN clients c ON ca.client_id = c.id
LEFT JOIN profiles p ON ca.user_id = p.id
WHERE ca.created_at >= NOW() - INTERVAL '30 days'
ORDER BY ca.created_at DESC;

-- Create view for client dashboard summary
CREATE VIEW client_dashboard_summary AS
SELECT 
    c.id,
    c.full_name,
    c.email,
    ces.status as engagement_status,
    ces.last_activity_at,
    ces.last_login_at,
    ces.total_activities,
    ces.pending_actions,
    ces.completion_percentage,
    ces.next_action_due,
    COUNT(ca.id) as recent_activities_count,
    COUNT(CASE WHEN ca.is_read = false THEN 1 END) as unread_activities_count
FROM clients c
LEFT JOIN client_engagement_status ces ON c.id = ces.client_id
LEFT JOIN client_activities ca ON c.id = ca.client_id AND ca.created_at >= NOW() - INTERVAL '7 days'
GROUP BY c.id, c.full_name, c.email, ces.status, ces.last_activity_at, ces.last_login_at, 
         ces.total_activities, ces.pending_actions, ces.completion_percentage, ces.next_action_due;

-- Add comments for documentation
COMMENT ON TABLE client_activities IS 'Tracks all client activities for dashboard display and audit purposes';
COMMENT ON TABLE client_engagement_status IS 'Maintains current engagement status and metrics for each client';
COMMENT ON TABLE client_dashboard_metrics IS 'Cached dashboard metrics for performance optimization';
COMMENT ON FUNCTION log_client_activity IS 'Logs a client activity and updates engagement status';
COMMENT ON FUNCTION update_client_engagement_status IS 'Updates client engagement status and metrics';
COMMENT ON FUNCTION calculate_dashboard_metrics IS 'Calculates and caches dashboard metrics for a client'; 