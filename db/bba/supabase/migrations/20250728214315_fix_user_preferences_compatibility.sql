-- Fix user_preferences table compatibility for production sync
-- Addresses column name mismatch: local uses 'user_id', production expects 'profile_id'

BEGIN;

-- Check if user_preferences table exists and has user_id column (local structure)
DO $$
BEGIN
    -- If the table has user_id column, fix all references from profile_id to user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_preferences' 
        AND column_name = 'user_id'
        AND table_schema = 'public'
    ) THEN
        -- Drop the problematic policy if it exists (from failed migration)
        DROP POLICY IF EXISTS "Users can manage their preferences" ON "public"."user_preferences";
        
        -- Create a policy that works with the existing user_id column
        CREATE POLICY "Users can manage their preferences" ON "public"."user_preferences"
            USING ("user_id" = "auth"."uid"());
            
        -- Drop the problematic index if it exists (from failed migration)
        DROP INDEX IF EXISTS "idx_user_preferences_profile_key";
        
        -- Create an index that works with the existing user_id column
        -- Note: local structure doesn't have preference_key, so just index user_id
        CREATE INDEX IF NOT EXISTS "idx_user_preferences_user_id" ON "public"."user_preferences"("user_id");
        
        RAISE NOTICE 'Fixed user_preferences policy and index to use user_id column';
    END IF;
END
$$;

COMMIT;