-- W-2 Storage Bucket Setup
-- This migration creates the storage bucket for W-2 documents with appropriate policies

-- Create the w2-documents storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'w2-documents',
    'w2-documents',
    false, -- Private bucket for security
    52428800, -- 50MB file size limit
    ARRAY[
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/tiff',
        'image/bmp'
    ]::text[]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY[
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/tiff',
        'image/bmp'
    ]::text[];

-- Note: Storage policies will be handled by the new RLS strategy implementation

-- Comments not available for storage.buckets table

-- Note: Signed URL generation is handled in edge functions using Supabase SDK