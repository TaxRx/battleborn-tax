-- Client Tracking System - Prevent Client Loss in Referral Process
-- Migration: 20250116100000_add_client_tracking.sql

-- Client Profiles - Comprehensive client information and tracking
CREATE TABLE client_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    
    -- Contact preferences
    preferred_contact_method TEXT CHECK (preferred_contact_method IN ('email', 'phone', 'text')) DEFAULT 'email',
    timezone TEXT DEFAULT 'UTC',
    
    -- Tax profile summary (for quick reference)
    annual_income DECIMAL(12,2) DEFAULT 0,
    filing_status TEXT NOT NULL,
    state TEXT NOT NULL,
    business_owner BOOLEAN DEFAULT FALSE,
    
    -- Tracking & Status
    current_stage TEXT CHECK (current_stage IN (
        'initial_contact',
        'tax_analysis_complete',
        'proposal_created',
        'proposal_submitted',
        'admin_review',
        'expert_assigned',
        'expert_contacted',
        'implementation_active',
        'completed',
        'lost_to_follow_up',
        'declined_services',
        'competitor_lost'
    )) DEFAULT 'initial_contact',
    last_contact_date TIMESTAMPTZ,
    next_followup_date TIMESTAMPTZ,
    assigned_affiliate_id UUID REFERENCES profiles(id),
    assigned_expert_id UUID REFERENCES experts(id),
    
    -- Engagement tracking
    engagement_score INTEGER DEFAULT 5 CHECK (engagement_score >= 1 AND engagement_score <= 10),
    
    -- Risk indicators
    at_risk_of_loss BOOLEAN DEFAULT FALSE,
    days_since_last_contact INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Communications - Log all interactions
CREATE TABLE client_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    user_role TEXT CHECK (user_role IN ('affiliate', 'admin', 'expert')) NOT NULL,
    communication_type TEXT CHECK (communication_type IN ('email', 'phone', 'meeting', 'text', 'system_note')) NOT NULL,
    subject TEXT,
    summary TEXT NOT NULL,
    outcome TEXT CHECK (outcome IN ('positive', 'neutral', 'negative', 'no_response')) DEFAULT 'neutral',
    next_action_required TEXT,
    next_action_due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Alerts - Automated and manual alerts to prevent client loss
CREATE TABLE client_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
    alert_type TEXT CHECK (alert_type IN (
        'no_contact_7_days',
        'no_contact_14_days',
        'no_contact_30_days',
        'expert_no_response',
        'client_not_responding',
        'proposal_stuck_in_review',
        'implementation_delayed',
        'payment_overdue',
        'competitor_threat',
        'dissatisfaction_detected'
    )) NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    action_required TEXT NOT NULL,
    assigned_to UUID REFERENCES profiles(id),
    due_date TIMESTAMPTZ,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_client_profiles_stage ON client_profiles(current_stage);
CREATE INDEX idx_client_profiles_risk ON client_profiles(at_risk_of_loss);
CREATE INDEX idx_client_profiles_affiliate ON client_profiles(assigned_affiliate_id);
CREATE INDEX idx_client_profiles_expert ON client_profiles(assigned_expert_id);
CREATE INDEX idx_client_communications_client ON client_communications(client_id);
CREATE INDEX idx_client_communications_user ON client_communications(user_id);
CREATE INDEX idx_client_alerts_client ON client_alerts(client_id);
CREATE INDEX idx_client_alerts_severity ON client_alerts(severity);
CREATE INDEX idx_client_alerts_unresolved ON client_alerts(is_resolved) WHERE is_resolved = FALSE;

-- Function to automatically update days_since_last_contact
CREATE OR REPLACE FUNCTION update_client_last_contact()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE client_profiles 
    SET 
        last_contact_date = NEW.created_at,
        days_since_last_contact = 0,
        updated_at = NOW()
    WHERE id = NEW.client_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last contact when communication is logged
CREATE TRIGGER trigger_update_client_last_contact
    AFTER INSERT ON client_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_client_last_contact();

-- Function to automatically create alerts based on client activity
CREATE OR REPLACE FUNCTION check_client_alerts()
RETURNS void AS $$
DECLARE
    client_record RECORD;
BEGIN
    -- Check for clients with no contact in 7+ days
    FOR client_record IN 
        SELECT id, full_name, days_since_last_contact, current_stage
        FROM client_profiles 
        WHERE days_since_last_contact >= 7 
        AND at_risk_of_loss = FALSE
        AND current_stage NOT IN ('completed', 'lost_to_follow_up', 'declined_services', 'competitor_lost')
    LOOP
        -- Create appropriate alert based on days since contact
        IF client_record.days_since_last_contact >= 30 THEN
            INSERT INTO client_alerts (client_id, alert_type, severity, title, description, action_required)
            VALUES (
                client_record.id,
                'no_contact_30_days',
                'urgent',
                'Client Not Contacted in 30+ Days - URGENT',
                client_record.full_name || ' has not been contacted in ' || client_record.days_since_last_contact || ' days. High risk of losing client.',
                'Immediate escalation and contact required'
            );
        ELSIF client_record.days_since_last_contact >= 14 THEN
            INSERT INTO client_alerts (client_id, alert_type, severity, title, description, action_required)
            VALUES (
                client_record.id,
                'no_contact_14_days',
                'high',
                'Client Not Contacted in 14+ Days',
                client_record.full_name || ' has not been contacted in ' || client_record.days_since_last_contact || ' days. Risk of losing client.',
                'Follow-up required from assigned expert or affiliate'
            );
        ELSIF client_record.days_since_last_contact >= 7 THEN
            INSERT INTO client_alerts (client_id, alert_type, severity, title, description, action_required)
            VALUES (
                client_record.id,
                'no_contact_7_days',
                'medium',
                'Client Not Contacted in 7+ Days',
                client_record.full_name || ' has not been contacted in ' || client_record.days_since_last_contact || ' days.',
                'Schedule follow-up contact'
            );
        END IF;
        
        -- Mark client as at risk if 14+ days
        IF client_record.days_since_last_contact >= 14 THEN
            UPDATE client_profiles 
            SET at_risk_of_loss = TRUE, updated_at = NOW()
            WHERE id = client_record.id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to update days_since_last_contact daily
CREATE OR REPLACE FUNCTION update_days_since_contact()
RETURNS void AS $$
BEGIN
    UPDATE client_profiles 
    SET 
        days_since_last_contact = CASE 
            WHEN last_contact_date IS NULL THEN 
                EXTRACT(DAYS FROM (NOW() - created_at))::INTEGER
            ELSE 
                EXTRACT(DAYS FROM (NOW() - last_contact_date))::INTEGER
        END,
        updated_at = NOW()
    WHERE current_stage NOT IN ('completed', 'lost_to_follow_up', 'declined_services', 'competitor_lost');
    
    -- Run alert checks after updating days
    PERFORM check_client_alerts();
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_alerts ENABLE ROW LEVEL SECURITY;

-- Allow admins full access
CREATE POLICY "Admins can manage all client profiles" ON client_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all client communications" ON client_communications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all client alerts" ON client_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow affiliates to see their own clients
CREATE POLICY "Affiliates can see their assigned clients" ON client_profiles
    FOR SELECT USING (assigned_affiliate_id = auth.uid());

-- Allow experts to see their assigned clients
CREATE POLICY "Experts can see their assigned clients" ON client_profiles
    FOR SELECT USING (assigned_expert_id = auth.uid());

-- Comments for documentation
COMMENT ON TABLE client_profiles IS 'Comprehensive client tracking to prevent loss during referral process';
COMMENT ON TABLE client_communications IS 'Log of all client interactions across affiliate, admin, and expert teams';
COMMENT ON TABLE client_alerts IS 'Automated and manual alerts to prevent client loss';
COMMENT ON FUNCTION update_days_since_contact() IS 'Daily function to update client contact tracking and generate alerts';
COMMENT ON FUNCTION check_client_alerts() IS 'Automated alert generation based on client engagement patterns'; 