-- Epic 3 Sprint 3: Bulk Profile Operations System
-- File: 20250724000006_epic3_bulk_profile_operations.sql
-- Purpose: Comprehensive bulk operations for profile management with tracking and rollback
-- Story: 3.4 - Bulk Profile Operations (6 points)

BEGIN;

-- ========= PART 1: BULK OPERATIONS TRACKING TABLE =========

-- Create bulk operations tracking table
CREATE TABLE IF NOT EXISTS public.bulk_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(50) NOT NULL,
    operation_name VARCHAR(200) NOT NULL,
    initiated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_profile_ids UUID[] NOT NULL,
    operation_data JSONB DEFAULT '{}',
    total_targets INTEGER NOT NULL,
    processed_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    progress_percentage NUMERIC(5,2) DEFAULT 0.00,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_at TIMESTAMP WITH TIME ZONE,
    results JSONB DEFAULT '[]',
    errors JSONB DEFAULT '[]',
    rollback_data JSONB DEFAULT '{}',
    can_rollback BOOLEAN DEFAULT false,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    rollback_reason TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.bulk_operations IS 'Tracking and management for bulk profile operations';

-- Add constraints
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_bulk_operation_type' 
    AND conrelid = 'public.bulk_operations'::regclass
  ) THEN
    ALTER TABLE public.bulk_operations
    ADD CONSTRAINT check_bulk_operation_type 
    CHECK (operation_type IN (
        'update_status', 'assign_role', 'revoke_role', 'grant_permission', 
        'revoke_permission', 'sync_auth', 'verify_email', 'reset_password',
        'update_metadata', 'merge_profiles', 'archive_profiles',
        'transfer_ownership', 'bulk_invite'
    ));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_bulk_operation_status' 
    AND conrelid = 'public.bulk_operations'::regclass
  ) THEN
    ALTER TABLE public.bulk_operations
    ADD CONSTRAINT check_bulk_operation_status 
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'rolled_back'));
  END IF;
END $$;

-- Create indexes for bulk operations
CREATE INDEX IF NOT EXISTS idx_bulk_operations_initiated_by ON public.bulk_operations(initiated_by);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_status ON public.bulk_operations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_type ON public.bulk_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_bulk_operations_completed_at ON public.bulk_operations(completed_at DESC) WHERE completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bulk_operations_can_rollback ON public.bulk_operations(can_rollback, completed_at DESC) WHERE can_rollback = true;

-- ========= PART 2: BULK OPERATION RESULTS TABLE =========

-- Create detailed results table for individual profile operations
CREATE TABLE IF NOT EXISTS public.bulk_operation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bulk_operation_id UUID NOT NULL REFERENCES public.bulk_operations(id) ON DELETE CASCADE,
    target_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    success BOOLEAN,
    result_data JSONB DEFAULT '{}',
    error_message TEXT,
    error_code VARCHAR(50),
    retry_count INTEGER DEFAULT 0,
    rollback_data JSONB DEFAULT '{}',
    rolled_back BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.bulk_operation_results IS 'Detailed results for individual profile operations within bulk operations';

-- Add constraints for results
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_bulk_result_status' 
    AND conrelid = 'public.bulk_operation_results'::regclass
  ) THEN
    ALTER TABLE public.bulk_operation_results
    ADD CONSTRAINT check_bulk_result_status 
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped', 'rolled_back'));
  END IF;
END $$;

-- Create indexes for bulk operation results
CREATE INDEX IF NOT EXISTS idx_bulk_operation_results_bulk_id ON public.bulk_operation_results(bulk_operation_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_results_profile_id ON public.bulk_operation_results(target_profile_id);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_results_status ON public.bulk_operation_results(status);
CREATE INDEX IF NOT EXISTS idx_bulk_operation_results_sequence ON public.bulk_operation_results(bulk_operation_id, sequence_number);

-- ========= PART 3: BULK OPERATION FUNCTIONS =========

-- Function to create bulk operation
CREATE OR REPLACE FUNCTION create_bulk_operation(
    p_operation_type VARCHAR,
    p_operation_name VARCHAR,
    p_target_profile_ids UUID[],
    p_operation_data JSONB DEFAULT '{}',
    p_metadata JSONB DEFAULT '{}'
) RETURNS TABLE (
    operation_id UUID,
    total_targets INTEGER,
    estimated_duration_minutes INTEGER
) AS $$
DECLARE
    v_operation_id UUID;
    v_initiated_by UUID;
    v_total_targets INTEGER;
    v_estimated_duration INTEGER;
BEGIN
    -- Get current user
    v_initiated_by := auth.uid();
    v_total_targets := array_length(p_target_profile_ids, 1);
    
    -- Estimate duration based on operation type and target count
    v_estimated_duration := CASE p_operation_type
        WHEN 'update_status' THEN v_total_targets * 2
        WHEN 'assign_role' THEN v_total_targets * 3
        WHEN 'sync_auth' THEN v_total_targets * 5
        WHEN 'verify_email' THEN v_total_targets * 4
        ELSE v_total_targets * 3
    END;
    
    -- Create bulk operation record
    INSERT INTO public.bulk_operations (
        operation_type, operation_name, initiated_by, target_profile_ids,
        operation_data, total_targets, metadata,
        estimated_completion_at
    ) VALUES (
        p_operation_type, p_operation_name, v_initiated_by, p_target_profile_ids,
        p_operation_data, v_total_targets, p_metadata,
        NOW() + (v_estimated_duration || ' minutes')::INTERVAL
    ) RETURNING id INTO v_operation_id;
    
    -- Create individual result records
    INSERT INTO public.bulk_operation_results (
        bulk_operation_id, target_profile_id, sequence_number
    )
    SELECT 
        v_operation_id, 
        unnest(p_target_profile_ids), 
        generate_series(1, v_total_targets);
    
    RETURN QUERY SELECT 
        v_operation_id as operation_id,
        v_total_targets as total_targets,
        v_estimated_duration as estimated_duration_minutes;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION create_bulk_operation IS 'Create a new bulk operation with tracking records';

-- Function to process individual profile in bulk operation
CREATE OR REPLACE FUNCTION process_bulk_operation_target(
    p_bulk_operation_id UUID,
    p_target_profile_id UUID,
    p_operation_type VARCHAR,
    p_operation_data JSONB
) RETURNS TABLE (
    success BOOLEAN,
    result_data JSONB,
    error_message TEXT,
    rollback_data JSONB
) AS $$
DECLARE
    v_start_time TIMESTAMP := clock_timestamp();
    v_success BOOLEAN := FALSE;
    v_result JSONB := '{}';
    v_error_msg TEXT := NULL;
    v_rollback JSONB := '{}';
    v_duration INTEGER;
    profile_record RECORD;
BEGIN
    -- Update result record to running
    UPDATE public.bulk_operation_results 
    SET status = 'running', started_at = v_start_time
    WHERE bulk_operation_id = p_bulk_operation_id 
      AND target_profile_id = p_target_profile_id;
    
    -- Get profile data for rollback
    SELECT * INTO profile_record FROM public.profiles WHERE id = p_target_profile_id;
    
    BEGIN
        -- Process based on operation type
        CASE p_operation_type
            WHEN 'update_status' THEN
                -- Update profile status
                UPDATE public.profiles 
                SET 
                    status = (p_operation_data->>'status')::VARCHAR,
                    updated_at = NOW()
                WHERE id = p_target_profile_id;
                
                v_rollback := jsonb_build_object(
                    'operation_type', 'update_status',
                    'original_status', profile_record.status
                );
                v_result := jsonb_build_object('new_status', p_operation_data->>'status');
                v_success := TRUE;
                
            WHEN 'assign_role' THEN
                -- Assign role to profile
                PERFORM assign_profile_role(
                    p_target_profile_id,
                    p_operation_data->>'role_name',
                    COALESCE(p_operation_data->>'scope', 'global'),
                    (p_operation_data->>'scope_id')::UUID,
                    (p_operation_data->>'expires_at')::TIMESTAMP WITH TIME ZONE,
                    p_operation_data->>'notes'
                );
                
                v_rollback := jsonb_build_object(
                    'operation_type', 'revoke_role',
                    'role_name', p_operation_data->>'role_name'
                );
                v_result := jsonb_build_object('role_assigned', p_operation_data->>'role_name');
                v_success := TRUE;
                
            WHEN 'verify_email' THEN
                -- Verify email
                UPDATE public.profiles 
                SET 
                    is_verified = TRUE,
                    updated_at = NOW()
                WHERE id = p_target_profile_id;
                
                v_rollback := jsonb_build_object(
                    'operation_type', 'update_verification',
                    'original_verified', profile_record.is_verified
                );
                v_result := jsonb_build_object('verified', true);
                v_success := TRUE;
                
            WHEN 'sync_auth' THEN
                -- Sync with auth
                PERFORM sync_profile_with_auth(p_target_profile_id, 'auto');
                v_result := jsonb_build_object('synced', true);
                v_success := TRUE;
                
            ELSE
                v_error_msg := 'Unsupported operation type: ' || p_operation_type;
                v_success := FALSE;
        END CASE;
        
    EXCEPTION WHEN OTHERS THEN
        v_error_msg := SQLERRM;
        v_success := FALSE;
    END;
    
    -- Calculate duration
    v_duration := EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start_time)::INTEGER;
    
    -- Update result record
    UPDATE public.bulk_operation_results 
    SET 
        status = CASE WHEN v_success THEN 'completed' ELSE 'failed' END,
        completed_at = clock_timestamp(),
        duration_ms = v_duration,
        success = v_success,
        result_data = v_result,
        error_message = v_error_msg,
        rollback_data = v_rollback,
        updated_at = NOW()
    WHERE bulk_operation_id = p_bulk_operation_id 
      AND target_profile_id = p_target_profile_id;
    
    -- Update bulk operation progress
    UPDATE public.bulk_operations 
    SET 
        processed_count = processed_count + 1,
        success_count = success_count + CASE WHEN v_success THEN 1 ELSE 0 END,
        failed_count = failed_count + CASE WHEN v_success THEN 0 ELSE 1 END,
        progress_percentage = ROUND(
            ((processed_count + 1)::NUMERIC / total_targets::NUMERIC) * 100, 2
        ),
        updated_at = NOW()
    WHERE id = p_bulk_operation_id;
    
    RETURN QUERY SELECT 
        v_success as success,
        v_result as result_data,
        v_error_msg as error_message,
        v_rollback as rollback_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION process_bulk_operation_target IS 'Process individual profile within a bulk operation';

-- Function to complete bulk operation
CREATE OR REPLACE FUNCTION complete_bulk_operation(
    p_bulk_operation_id UUID
) RETURNS TABLE (
    success BOOLEAN,
    total_processed INTEGER,
    total_successful INTEGER,
    total_failed INTEGER,
    can_rollback BOOLEAN
) AS $$
DECLARE
    v_total_processed INTEGER;
    v_total_successful INTEGER;
    v_total_failed INTEGER;
    v_can_rollback BOOLEAN;
BEGIN
    -- Get final counts
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE success = TRUE),
        COUNT(*) FILTER (WHERE success = FALSE)
    INTO v_total_processed, v_total_successful, v_total_failed
    FROM public.bulk_operation_results
    WHERE bulk_operation_id = p_bulk_operation_id;
    
    -- Determine if rollback is possible
    v_can_rollback := v_total_successful > 0 AND EXISTS (
        SELECT 1 FROM public.bulk_operation_results
        WHERE bulk_operation_id = p_bulk_operation_id 
          AND success = TRUE 
          AND rollback_data != '{}'
    );
    
    -- Update bulk operation
    UPDATE public.bulk_operations 
    SET 
        status = CASE 
            WHEN v_total_failed = 0 THEN 'completed'
            WHEN v_total_successful = 0 THEN 'failed'
            ELSE 'completed'
        END,
        completed_at = NOW(),
        can_rollback = v_can_rollback,
        progress_percentage = 100.00,
        updated_at = NOW()
    WHERE id = p_bulk_operation_id;
    
    RETURN QUERY SELECT 
        TRUE as success,
        v_total_processed as total_processed,
        v_total_successful as total_successful,
        v_total_failed as total_failed,
        v_can_rollback as can_rollback;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION complete_bulk_operation IS 'Mark bulk operation as complete and update final statistics';

-- ========= PART 4: ROLLBACK FUNCTIONS =========

-- Function to rollback bulk operation
CREATE OR REPLACE FUNCTION rollback_bulk_operation(
    p_bulk_operation_id UUID,
    p_rollback_reason TEXT DEFAULT NULL
) RETURNS TABLE (
    success BOOLEAN,
    rolled_back_count INTEGER,
    failed_rollback_count INTEGER,
    message TEXT
) AS $$
DECLARE
    v_operation_record RECORD;
    v_result_record RECORD;
    v_rolled_back_count INTEGER := 0;
    v_failed_rollback_count INTEGER := 0;
    v_rollback_data JSONB;
BEGIN
    -- Get bulk operation
    SELECT * INTO v_operation_record 
    FROM public.bulk_operations 
    WHERE id = p_bulk_operation_id AND can_rollback = TRUE;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT 
            FALSE as success,
            0 as rolled_back_count,
            0 as failed_rollback_count,
            'Bulk operation not found or cannot be rolled back'::TEXT as message;
        RETURN;
    END IF;
    
    -- Process rollback for each successful result
    FOR v_result_record IN 
        SELECT * FROM public.bulk_operation_results
        WHERE bulk_operation_id = p_bulk_operation_id 
          AND success = TRUE 
          AND rolled_back = FALSE
          AND rollback_data != '{}'
        ORDER BY sequence_number DESC
    LOOP
        BEGIN
            v_rollback_data := v_result_record.rollback_data;
            
            -- Execute rollback based on operation type
            CASE v_rollback_data->>'operation_type'
                WHEN 'update_status' THEN
                    UPDATE public.profiles 
                    SET status = (v_rollback_data->>'original_status')::VARCHAR
                    WHERE id = v_result_record.target_profile_id;
                    
                WHEN 'revoke_role' THEN
                    -- Find and revoke the role that was assigned
                    PERFORM revoke_profile_role(
                        (SELECT id FROM public.profile_roles 
                         WHERE profile_id = v_result_record.target_profile_id 
                           AND role_name = v_rollback_data->>'role_name'
                           AND is_active = TRUE
                         LIMIT 1),
                        'Bulk operation rollback'
                    );
                    
                WHEN 'update_verification' THEN
                    UPDATE public.profiles 
                    SET is_verified = (v_rollback_data->>'original_verified')::BOOLEAN
                    WHERE id = v_result_record.target_profile_id;
            END CASE;
            
            -- Mark as rolled back
            UPDATE public.bulk_operation_results 
            SET rolled_back = TRUE, updated_at = NOW()
            WHERE id = v_result_record.id;
            
            v_rolled_back_count := v_rolled_back_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            v_failed_rollback_count := v_failed_rollback_count + 1;
        END;
    END LOOP;
    
    -- Update bulk operation
    UPDATE public.bulk_operations 
    SET 
        status = 'rolled_back',
        rolled_back_at = NOW(),
        rollback_reason = p_rollback_reason,
        updated_at = NOW()
    WHERE id = p_bulk_operation_id;
    
    RETURN QUERY SELECT 
        TRUE as success,
        v_rolled_back_count as rolled_back_count,
        v_failed_rollback_count as failed_rollback_count,
        ('Rollback completed: ' || v_rolled_back_count || ' operations reversed')::TEXT as message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION rollback_bulk_operation IS 'Rollback a completed bulk operation';

-- ========= PART 5: HELPER VIEWS =========

-- View for bulk operation summaries
CREATE OR REPLACE VIEW bulk_operation_summaries AS
SELECT 
    bo.id,
    bo.operation_type,
    bo.operation_name,
    bo.status,
    bo.total_targets,
    bo.processed_count,
    bo.success_count,
    bo.failed_count,
    bo.progress_percentage,
    bo.can_rollback,
    bo.created_at,
    bo.started_at,
    bo.completed_at,
    bo.estimated_completion_at,
    p.full_name as initiated_by_name,
    p.email as initiated_by_email,
    CASE 
        WHEN bo.completed_at IS NOT NULL THEN 
            EXTRACT(EPOCH FROM (bo.completed_at - bo.started_at))::INTEGER
        WHEN bo.started_at IS NOT NULL THEN
            EXTRACT(EPOCH FROM (NOW() - bo.started_at))::INTEGER
        ELSE NULL
    END as duration_seconds,
    CASE 
        WHEN bo.status = 'completed' AND bo.failed_count = 0 THEN 'success'
        WHEN bo.status = 'completed' AND bo.failed_count > 0 THEN 'partial'
        WHEN bo.status = 'failed' THEN 'failed'
        WHEN bo.status = 'rolled_back' THEN 'rolled_back'
        ELSE bo.status
    END as overall_status
FROM public.bulk_operations bo
LEFT JOIN public.profiles p ON bo.initiated_by = p.id;

COMMENT ON VIEW bulk_operation_summaries IS 'Summary view for bulk operations with computed fields';

-- ========= PART 6: ENABLE ROW LEVEL SECURITY =========

ALTER TABLE public.bulk_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_operation_results ENABLE ROW LEVEL SECURITY;

-- ========= PART 7: CREATE RLS POLICIES =========

-- Bulk operations policies
CREATE POLICY "Users can view their own bulk operations" ON public.bulk_operations
    FOR SELECT USING (initiated_by = auth.uid());

CREATE POLICY "Admins can view all bulk operations" ON public.bulk_operations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

CREATE POLICY "Users can create bulk operations" ON public.bulk_operations
    FOR INSERT WITH CHECK (initiated_by = auth.uid());

CREATE POLICY "Users can update their own bulk operations" ON public.bulk_operations
    FOR UPDATE USING (initiated_by = auth.uid());

-- Bulk operation results policies
CREATE POLICY "Users can view results of their own bulk operations" ON public.bulk_operation_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bulk_operations bo
            WHERE bo.id = bulk_operation_id AND bo.initiated_by = auth.uid()
        )
    );

CREATE POLICY "Admins can view all bulk operation results" ON public.bulk_operation_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p 
            JOIN public.accounts a ON p.account_id = a.id
            WHERE p.id = auth.uid() AND a.type = 'admin'
        )
    );

-- ========= PART 8: GRANT PERMISSIONS =========

-- Grant execute permissions for bulk operation functions
GRANT EXECUTE ON FUNCTION create_bulk_operation(VARCHAR, VARCHAR, UUID[], JSONB, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION process_bulk_operation_target(UUID, UUID, VARCHAR, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_bulk_operation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION rollback_bulk_operation(UUID, TEXT) TO authenticated;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON public.bulk_operations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.bulk_operation_results TO authenticated;

-- Grant view permissions
GRANT SELECT ON bulk_operation_summaries TO authenticated;

-- Grant sequence usage
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

COMMIT;