-- Sample data for Epic 2 Client Dashboard Enhancement
-- This script creates sample activities and engagement data for testing

-- First, let's get some existing client IDs to work with
-- We'll use the first client in the system for our samples

DO $$
DECLARE
    sample_client_id UUID;
    sample_user_id UUID;
    activity_id UUID;
BEGIN
    -- Get a sample client ID
    SELECT id INTO sample_client_id FROM clients LIMIT 1;
    
    -- Get a sample user ID
    SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
    
    -- If we don't have any clients or users, create sample ones
    IF sample_client_id IS NULL THEN
        INSERT INTO clients (id, full_name, email, filing_status, state, phone, home_address, created_at)
        VALUES (
            gen_random_uuid(),
            'Sample Business LLC',
            'sample@business.com',
            'MFJ',
            'CA',
            '(555) 123-4567',
            '123 Main St, Sample City, CA 90210',
            NOW()
        ) RETURNING id INTO sample_client_id;
    END IF;
    
    IF sample_user_id IS NULL THEN
        -- For testing, we'll use a placeholder user ID
        sample_user_id := gen_random_uuid();
    END IF;
    
    -- Create sample activities
    INSERT INTO client_activities (client_id, user_id, activity_type, title, description, priority, metadata, is_read, created_at) VALUES
    (sample_client_id, sample_user_id, 'login', 'User logged into dashboard', 'Regular login session started', 'medium', '{"ip_address": "192.168.1.100", "user_agent": "Chrome/91.0"}', true, NOW() - INTERVAL '2 hours'),
    (sample_client_id, sample_user_id, 'document_upload', 'Tax document uploaded', 'Uploaded W-2 form for 2024', 'high', '{"file_name": "w2_2024.pdf", "file_size": 1024000}', false, NOW() - INTERVAL '1 hour'),
    (sample_client_id, sample_user_id, 'proposal_view', 'Viewed tax proposal', 'Opened and reviewed tax savings proposal #1', 'medium', '{"proposal_id": "12345", "view_duration": 300}', false, NOW() - INTERVAL '45 minutes'),
    (sample_client_id, sample_user_id, 'profile_update', 'Updated business profile', 'Changed business address and phone number', 'low', '{"fields_changed": ["address", "phone"]}', true, NOW() - INTERVAL '30 minutes'),
    (sample_client_id, sample_user_id, 'calculation_run', 'Ran tax calculation', 'Performed tax savings calculation for 2024', 'high', '{"calculation_type": "full", "estimated_savings": 15000}', false, NOW() - INTERVAL '20 minutes'),
    (sample_client_id, sample_user_id, 'message_sent', 'Sent message to advisor', 'Asked question about retirement contributions', 'medium', '{"message_length": 150, "topic": "retirement"}', true, NOW() - INTERVAL '15 minutes'),
    (sample_client_id, sample_user_id, 'meeting_scheduled', 'Scheduled consultation', 'Booked 30-minute tax planning session', 'high', '{"meeting_date": "2025-01-15", "duration": 30}', false, NOW() - INTERVAL '10 minutes'),
    (sample_client_id, sample_user_id, 'tool_enrollment', 'Enrolled in Augusta Rule', 'Started Augusta Rule tax strategy tool', 'high', '{"tool_name": "Augusta Rule", "enrollment_fee": 500}', false, NOW() - INTERVAL '5 minutes');
    
    -- Create engagement status
    INSERT INTO client_engagement_status (client_id, status, last_activity_at, last_login_at, total_activities, pending_actions, completion_percentage, next_action_due, notes)
    VALUES (
        sample_client_id,
        'active',
        NOW() - INTERVAL '5 minutes',
        NOW() - INTERVAL '2 hours',
        8,
        3,
        65.50,
        NOW() + INTERVAL '2 days',
        'Client is actively engaged with tax planning process'
    ) ON CONFLICT (client_id) DO UPDATE SET
        status = EXCLUDED.status,
        last_activity_at = EXCLUDED.last_activity_at,
        last_login_at = EXCLUDED.last_login_at,
        total_activities = EXCLUDED.total_activities,
        pending_actions = EXCLUDED.pending_actions,
        completion_percentage = EXCLUDED.completion_percentage,
        next_action_due = EXCLUDED.next_action_due,
        notes = EXCLUDED.notes,
        updated_at = NOW();
    
    -- Create sample dashboard metrics cache
    INSERT INTO client_dashboard_metrics (client_id, metric_type, metric_value, metric_data, calculated_at, expires_at)
    VALUES (
        sample_client_id,
        'overview',
        0,
        jsonb_build_object(
            'total_proposals', 3,
            'active_proposals', 2,
            'total_savings', 25000,
            'recent_activities', 8,
            'completion_rate', 65.50,
            'calculated_at', NOW()
        ),
        NOW(),
        NOW() + INTERVAL '1 hour'
    ) ON CONFLICT (client_id, metric_type) DO UPDATE SET
        metric_data = EXCLUDED.metric_data,
        calculated_at = EXCLUDED.calculated_at,
        expires_at = EXCLUDED.expires_at,
        updated_at = NOW();
    
    -- Create some additional sample activities for the past week
    INSERT INTO client_activities (client_id, user_id, activity_type, title, description, priority, metadata, is_read, created_at) VALUES
    (sample_client_id, sample_user_id, 'login', 'User login', 'Dashboard access', 'low', '{}', true, NOW() - INTERVAL '1 day'),
    (sample_client_id, sample_user_id, 'document_upload', 'Uploaded 1099 form', 'Tax document for investment income', 'medium', '{"file_name": "1099_2024.pdf"}', true, NOW() - INTERVAL '2 days'),
    (sample_client_id, sample_user_id, 'proposal_view', 'Reviewed proposal', 'Checked tax strategy recommendations', 'medium', '{}', true, NOW() - INTERVAL '3 days'),
    (sample_client_id, sample_user_id, 'status_update', 'Status changed', 'Moved to active engagement phase', 'high', '{"previous_status": "pending", "new_status": "active"}', true, NOW() - INTERVAL '4 days'),
    (sample_client_id, sample_user_id, 'calculation_run', 'Quick calculation', 'Estimated quarterly taxes', 'medium', '{"calculation_type": "quarterly"}', true, NOW() - INTERVAL '5 days'),
    (sample_client_id, sample_user_id, 'meeting_scheduled', 'Follow-up meeting', 'Scheduled strategy review session', 'high', '{"meeting_type": "follow_up"}', true, NOW() - INTERVAL '6 days'),
    (sample_client_id, sample_user_id, 'profile_update', 'Updated tax info', 'Added dependent information', 'low', '{"fields_updated": ["dependents"]}', true, NOW() - INTERVAL '7 days');
    
    RAISE NOTICE 'Sample data created successfully for client ID: %', sample_client_id;
    RAISE NOTICE 'Total activities created: %', (SELECT COUNT(*) FROM client_activities WHERE client_id = sample_client_id);
    RAISE NOTICE 'Engagement status created: %', (SELECT status FROM client_engagement_status WHERE client_id = sample_client_id);
END $$; 