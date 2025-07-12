-- Add has_completed_tax_profile column to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_completed_tax_profile BOOLEAN DEFAULT FALSE;

-- Update existing records to mark them as completed if they have tax data
UPDATE profiles 
SET has_completed_tax_profile = TRUE 
WHERE id IN (SELECT DISTINCT user_id FROM tax_profiles); 