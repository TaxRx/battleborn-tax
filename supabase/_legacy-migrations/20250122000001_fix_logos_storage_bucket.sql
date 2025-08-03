-- Fix logos storage bucket configuration and RLS policies
-- Migration: 20250122000001_fix_logos_storage_bucket.sql

-- Note: The logos bucket must be created manually via Supabase Dashboard first
-- Go to Storage > Create new bucket > name: "logos" > make it public

-- Create storage policies on storage.objects table for the logos bucket
-- These policies control access to files in the logos bucket

-- Policy 1: Allow authenticated users to upload to logos bucket
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated'
  );

-- Policy 2: Allow authenticated users to update files in logos bucket  
CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated'
  );

-- Policy 3: Allow authenticated users to delete files in logos bucket
CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated'
  );

-- Policy 4: Allow public read access to logos (so they can be displayed)
CREATE POLICY "Public read access for logos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'logos'
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;

-- Update rd_businesses table image_path column comment
COMMENT ON COLUMN rd_businesses.image_path IS 'Path to company logo image in storage - publicly accessible URL'; 