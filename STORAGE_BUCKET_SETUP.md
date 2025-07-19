# Logo Storage Bucket Setup Guide

## Issue
Logo uploads are failing with a 403 "Unauthorized" error due to missing storage bucket configuration.

## Quick Fix Applied
✅ Updated `BusinessSetupStep.tsx` to handle storage errors gracefully
✅ Logo upload is now optional - business setup can continue without a logo
✅ Better error messages guide users on what to do

## Manual Storage Bucket Setup (Supabase Dashboard)

### Step 1: Create the Logos Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Set bucket name: `logos`
5. Make bucket **Public** (so logos can be displayed)
6. Click **"Create bucket"**

### Step 2: Set Up Storage Policies
1. In the Storage section, click on the `logos` bucket
2. Go to **"Policies"** tab
3. Click **"New policy"**

#### Policy 1: Allow Authenticated Upload
- **Template**: Custom
- **Policy Name**: `Authenticated users can upload logos`
- **Allowed Operations**: `INSERT`
- **Target Roles**: `authenticated`
- **Policy Definition**: 
  ```sql
  bucket_id = 'logos' AND auth.role() = 'authenticated'
  ```

#### Policy 2: Allow Authenticated Update
- **Template**: Custom  
- **Policy Name**: `Authenticated users can update logos`
- **Allowed Operations**: `UPDATE`
- **Target Roles**: `authenticated`
- **Policy Definition**:
  ```sql
  bucket_id = 'logos' AND auth.role() = 'authenticated'
  ```

#### Policy 3: Allow Authenticated Delete
- **Template**: Custom
- **Policy Name**: `Authenticated users can delete logos`  
- **Allowed Operations**: `DELETE`
- **Target Roles**: `authenticated`
- **Policy Definition**:
  ```sql
  bucket_id = 'logos' AND auth.role() = 'authenticated'
  ```

#### Policy 4: Allow Public Read
- **Template**: Custom
- **Policy Name**: `Public read access for logos`
- **Allowed Operations**: `SELECT`
- **Target Roles**: `public`
- **Policy Definition**:
  ```sql
  bucket_id = 'logos'
  ```

### Alternative: SQL Commands (Fixed)
You can also run these SQL commands in your Supabase SQL Editor:

```sql
-- Create storage policies on storage.objects table for the logos bucket
-- Note: Create the logos bucket first via dashboard

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
```

## Test the Fix
1. **Create the bucket first** via Supabase Dashboard (Storage > New bucket > "logos")
2. Run the corrected SQL commands above
3. Try uploading a logo in the Business Setup step
4. You should now see successful uploads
5. The logo should display in reports and other areas

## Current Status
- ✅ Business Setup form works with or without logo upload
- ✅ Users get clear error messages if storage isn't configured
- ✅ Form submission continues even if logo upload fails
- ✅ Corrected SQL migration provided (run after creating bucket)
- ⏳ Storage bucket needs manual configuration (see steps above)

## File Upload Path
When working correctly, logos are stored at:
```
Storage URL: https://[project-id].supabase.co/storage/v1/object/public/logos/[business-id]_[timestamp].[ext]
Database: rd_businesses.image_path
``` 