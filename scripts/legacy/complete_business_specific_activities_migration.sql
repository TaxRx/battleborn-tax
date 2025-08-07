-- =============================================================================
-- COMPLETE BUSINESS-SPECIFIC ACTIVITIES MIGRATION
-- =============================================================================
-- This migration ensures all functionality for business-specific research 
-- activities is properly implemented for IP protection
-- =============================================================================

DO $$ 
BEGIN 
    RAISE NOTICE 'Starting business-specific activities migration...';
    
    -- 1. Add business_id column to rd_research_activities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_research_activities' 
                   AND column_name = 'business_id') THEN
        ALTER TABLE rd_research_activities 
        ADD COLUMN business_id UUID REFERENCES rd_businesses(id) ON DELETE CASCADE;
        
        COMMENT ON COLUMN rd_research_activities.business_id IS 
        'Foreign key to rd_businesses. NULL = global activity available to all businesses. Non-NULL = business-specific activity for IP protection.';
        
        CREATE INDEX idx_rd_research_activities_business_id 
        ON rd_research_activities(business_id);
        
        CREATE INDEX idx_rd_research_activities_global 
        ON rd_research_activities(id) WHERE business_id IS NULL;
        
        RAISE NOTICE '✅ Added business_id column to rd_research_activities';
    ELSE
        RAISE NOTICE '✅ business_id column already exists in rd_research_activities';
    END IF;
    
    -- 2. Add activity snapshot columns to rd_selected_activities (if they don't exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_activities' 
                   AND column_name = 'activity_title_snapshot') THEN
        ALTER TABLE rd_selected_activities 
        ADD COLUMN activity_title_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_activities.activity_title_snapshot IS 
        'Snapshot of activity title when selected. Preserves historical data if master activity is modified.';
        
        RAISE NOTICE '✅ Added activity_title_snapshot column to rd_selected_activities';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_activities' 
                   AND column_name = 'activity_category_snapshot') THEN
        ALTER TABLE rd_selected_activities 
        ADD COLUMN activity_category_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_activities.activity_category_snapshot IS 
        'Snapshot of activity category when selected.';
        
        RAISE NOTICE '✅ Added activity_category_snapshot column to rd_selected_activities';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_activities' 
                   AND column_name = 'activity_focus_snapshot') THEN
        ALTER TABLE rd_selected_activities 
        ADD COLUMN activity_focus_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_activities.activity_focus_snapshot IS 
        'Snapshot of activity focus when selected.';
        
        RAISE NOTICE '✅ Added activity_focus_snapshot column to rd_selected_activities';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_activities' 
                   AND column_name = 'activity_area_snapshot') THEN
        ALTER TABLE rd_selected_activities 
        ADD COLUMN activity_area_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_activities.activity_area_snapshot IS 
        'Snapshot of activity area when selected.';
        
        RAISE NOTICE '✅ Added activity_area_snapshot column to rd_selected_activities';
    END IF;
    
    -- 3. Add comprehensive snapshot columns to rd_selected_subcomponents (if they don't exist)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_subcomponents' 
                   AND column_name = 'subcomponent_name_snapshot') THEN
        ALTER TABLE rd_selected_subcomponents 
        ADD COLUMN subcomponent_name_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_subcomponents.subcomponent_name_snapshot IS 
        'Snapshot of subcomponent name when selected.';
        
        RAISE NOTICE '✅ Added subcomponent_name_snapshot column to rd_selected_subcomponents';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_subcomponents' 
                   AND column_name = 'subcomponent_description_snapshot') THEN
        ALTER TABLE rd_selected_subcomponents 
        ADD COLUMN subcomponent_description_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_subcomponents.subcomponent_description_snapshot IS 
        'Snapshot of subcomponent description when selected.';
        
        RAISE NOTICE '✅ Added subcomponent_description_snapshot column to rd_selected_subcomponents';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_subcomponents' 
                   AND column_name = 'step_name_snapshot') THEN
        ALTER TABLE rd_selected_subcomponents 
        ADD COLUMN step_name_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_subcomponents.step_name_snapshot IS 
        'Snapshot of step name when subcomponent was selected.';
        
        RAISE NOTICE '✅ Added step_name_snapshot column to rd_selected_subcomponents';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_subcomponents' 
                   AND column_name = 'step_description_snapshot') THEN
        ALTER TABLE rd_selected_subcomponents 
        ADD COLUMN step_description_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_subcomponents.step_description_snapshot IS 
        'Snapshot of step description when subcomponent was selected.';
        
        RAISE NOTICE '✅ Added step_description_snapshot column to rd_selected_subcomponents';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_subcomponents' 
                   AND column_name = 'activity_name_snapshot') THEN
        ALTER TABLE rd_selected_subcomponents 
        ADD COLUMN activity_name_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_subcomponents.activity_name_snapshot IS 
        'Snapshot of activity name when subcomponent was selected.';
        
        RAISE NOTICE '✅ Added activity_name_snapshot column to rd_selected_subcomponents';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rd_selected_subcomponents' 
                   AND column_name = 'activity_description_snapshot') THEN
        ALTER TABLE rd_selected_subcomponents 
        ADD COLUMN activity_description_snapshot TEXT;
        
        COMMENT ON COLUMN rd_selected_subcomponents.activity_description_snapshot IS 
        'Snapshot of activity description when subcomponent was selected.';
        
        RAISE NOTICE '✅ Added activity_description_snapshot column to rd_selected_subcomponents';
    END IF;
    
    -- 4. Create function to get business-accessible activities
    CREATE OR REPLACE FUNCTION get_business_accessible_activities(p_business_id UUID DEFAULT NULL)
    RETURNS TABLE (
        id UUID,
        title TEXT,
        focus_id UUID,
        is_active BOOLEAN,
        business_id UUID,
        default_roles JSONB,
        default_steps JSONB,
        created_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE,
        focus TEXT,
        category TEXT,
        area TEXT,
        research_activity TEXT,
        subcomponent TEXT,
        phase TEXT,
        step TEXT,
        deactivated_at TIMESTAMP WITH TIME ZONE,
        deactivation_reason TEXT,
        access_type TEXT
    ) LANGUAGE plpgsql AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            ra.id,
            ra.title,
            ra.focus_id,
            ra.is_active,
            ra.business_id,
            ra.default_roles,
            ra.default_steps,
            ra.created_at,
            ra.updated_at,
            ra.focus,
            ra.category,
            ra.area,
            ra.research_activity,
            ra.subcomponent,
            ra.phase,
            ra.step,
            ra.deactivated_at,
            ra.deactivation_reason,
            CASE 
                WHEN ra.business_id IS NULL THEN 'global'::TEXT
                WHEN ra.business_id = p_business_id THEN 'business_specific'::TEXT
                ELSE 'restricted'::TEXT
            END as access_type
        FROM rd_research_activities ra
        WHERE ra.is_active = true
        AND (
            ra.business_id IS NULL OR 
            (p_business_id IS NOT NULL AND ra.business_id = p_business_id)
        )
        ORDER BY ra.title;
    END;
    $$;
    
    COMMENT ON FUNCTION get_business_accessible_activities(UUID) IS 
    'Returns all research activities accessible to a given business: global activities (business_id IS NULL) and business-specific activities (business_id = p_business_id)';
    
    RAISE NOTICE '✅ Created get_business_accessible_activities function';
    
    -- 5. Create function to safely move subcomponent to different step
    CREATE OR REPLACE FUNCTION move_subcomponent_to_step(
        p_subcomponent_id UUID,
        p_new_step_id UUID,
        p_reason TEXT DEFAULT 'Step association change'
    ) RETURNS UUID LANGUAGE plpgsql AS $$
    DECLARE
        v_new_subcomponent_id UUID;
        v_original_record RECORD;
    BEGIN
        -- Get the original subcomponent record
        SELECT * INTO v_original_record 
        FROM rd_research_subcomponents 
        WHERE id = p_subcomponent_id AND is_active = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Active subcomponent with id % not found', p_subcomponent_id;
        END IF;
        
        -- Deactivate the original subcomponent
        UPDATE rd_research_subcomponents 
        SET 
            is_active = false,
            deactivated_at = NOW(),
            deactivation_reason = p_reason,
            updated_at = NOW()
        WHERE id = p_subcomponent_id;
        
        -- Create new subcomponent with new step_id
        INSERT INTO rd_research_subcomponents (
            step_id,
            name,
            description,
            subcomponent_order,
            is_active,
            hint,
            general_description,
            goal,
            hypothesis,
            alternatives,
            uncertainties,
            developmental_process,
            primary_goal,
            expected_outcome_type,
            cpt_codes,
            cdt_codes,
            alternative_paths
        ) VALUES (
            p_new_step_id,
            v_original_record.name,
            v_original_record.description,
            v_original_record.subcomponent_order,
            true,
            v_original_record.hint,
            v_original_record.general_description,
            v_original_record.goal,
            v_original_record.hypothesis,
            v_original_record.alternatives,
            v_original_record.uncertainties,
            v_original_record.developmental_process,
            v_original_record.primary_goal,
            v_original_record.expected_outcome_type,
            v_original_record.cpt_codes,
            v_original_record.cdt_codes,
            v_original_record.alternative_paths
        ) RETURNING id INTO v_new_subcomponent_id;
        
        RETURN v_new_subcomponent_id;
    END;
    $$;
    
    COMMENT ON FUNCTION move_subcomponent_to_step(UUID, UUID, TEXT) IS 
    'Safely moves a subcomponent to a different step by deactivating the original and creating a new version';
    
    RAISE NOTICE '✅ Created move_subcomponent_to_step function';
    
    -- 6. Update existing rd_selected_activities to populate snapshot fields
    UPDATE rd_selected_activities sa
    SET 
        activity_title_snapshot = ra.title,
        activity_category_snapshot = ra.category,
        activity_focus_snapshot = ra.focus,
        activity_area_snapshot = ra.area
    FROM rd_research_activities ra
    WHERE sa.activity_id = ra.id 
    AND sa.activity_title_snapshot IS NULL;
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    RAISE NOTICE '✅ Updated % existing selected activities with snapshot data', v_rows_affected;
    
    -- 7. Update existing rd_selected_subcomponents to populate snapshot fields
    UPDATE rd_selected_subcomponents ssc
    SET 
        subcomponent_name_snapshot = rsc.name,
        subcomponent_description_snapshot = rsc.description,
        step_name_snapshot = rst.name,
        step_description_snapshot = rst.description,
        activity_name_snapshot = ra.title
    FROM rd_research_subcomponents rsc
    JOIN rd_research_steps rst ON rsc.step_id = rst.id
    JOIN rd_research_activities ra ON rst.activity_id = ra.id
    WHERE ssc.subcomponent_id = rsc.id 
    AND ssc.subcomponent_name_snapshot IS NULL;
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    RAISE NOTICE '✅ Updated % existing selected subcomponents with snapshot data', v_rows_affected;
    
    RAISE NOTICE '🎉 Business-specific activities migration completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration failed: %', SQLERRM;
END $$;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify business_id column exists and has proper constraints
SELECT 
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    tc.constraint_type,
    kcu.table_name as referenced_table,
    kcu.column_name as referenced_column
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu 
    ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc 
    ON kcu.constraint_name = tc.constraint_name
WHERE c.table_name = 'rd_research_activities' 
AND c.column_name = 'business_id';

-- Verify snapshot columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('rd_selected_activities', 'rd_selected_subcomponents')
AND column_name LIKE '%_snapshot'
ORDER BY table_name, column_name;

-- Test the business-accessible activities function
SELECT 
    title,
    access_type,
    business_id,
    is_active
FROM get_business_accessible_activities(NULL)
LIMIT 5;

-- Summary of global vs business-specific activities
SELECT 
    CASE 
        WHEN business_id IS NULL THEN 'Global Activities'
        ELSE 'Business-Specific Activities'
    END as activity_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active THEN 1 END) as active_count
FROM rd_research_activities
GROUP BY CASE WHEN business_id IS NULL THEN 'Global Activities' ELSE 'Business-Specific Activities' END;

RAISE NOTICE '✅ Business-specific activities migration verification completed!'; 