-- Epic 4 Sprint 4.1: Document Management & File Systems
-- Story 4.1.1: Secure Document Storage System
-- BMad Framework: Advanced Client Portal Document Infrastructure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Document storage tables
CREATE TABLE IF NOT EXISTS document_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    parent_folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_client_folder_path UNIQUE (client_id, path)
);

CREATE TABLE IF NOT EXISTS document_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL,
    folder_id UUID REFERENCES document_folders(id) ON DELETE CASCADE,
    original_name VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_extension VARCHAR(10) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL DEFAULT 'client-documents',
    checksum VARCHAR(64) NOT NULL,
    encryption_key_id UUID,
    
    -- Document metadata
    document_type VARCHAR(50) DEFAULT 'general',
    tax_year INTEGER,
    category VARCHAR(100),
    tags TEXT[],
    
    -- Security and access
    access_level VARCHAR(20) DEFAULT 'private',
    password_protected BOOLEAN DEFAULT FALSE,
    
    -- Versioning
    version_number INTEGER DEFAULT 1,
    is_current_version BOOLEAN DEFAULT TRUE,
    parent_version_id UUID REFERENCES document_files(id) ON DELETE SET NULL,
    
    -- Audit trail
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    
    -- Status tracking
    processing_status VARCHAR(20) DEFAULT 'pending',
    virus_scan_status VARCHAR(20) DEFAULT 'pending',
    virus_scan_result JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_processing_status CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT valid_virus_scan_status CHECK (virus_scan_status IN ('pending', 'scanning', 'clean', 'infected', 'error')),
    CONSTRAINT valid_access_level CHECK (access_level IN ('private', 'shared', 'public')),
    CONSTRAINT valid_document_type CHECK (document_type IN ('general', 'tax_document', 'financial_statement', 'contract', 'invoice', 'receipt', 'bank_statement', 'w2', '1099', 'k1', 'other'))
);

CREATE TABLE IF NOT EXISTS document_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    shared_with_user_id UUID,
    shared_with_email VARCHAR(255),
    share_type VARCHAR(20) NOT NULL DEFAULT 'view',
    
    -- Access control
    expires_at TIMESTAMP WITH TIME ZONE,
    password_hash VARCHAR(255),
    max_downloads INTEGER,
    download_count INTEGER DEFAULT 0,
    
    -- Link sharing
    share_token VARCHAR(255) UNIQUE,
    is_public_link BOOLEAN DEFAULT FALSE,
    
    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_download BOOLEAN DEFAULT TRUE,
    can_comment BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    
    -- Audit
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    revoked_at TIMESTAMP WITH TIME ZONE,
    revoked_by UUID,
    
    CONSTRAINT valid_share_type CHECK (share_type IN ('view', 'edit', 'comment', 'download')),
    CONSTRAINT share_recipient_required CHECK (shared_with_user_id IS NOT NULL OR shared_with_email IS NOT NULL OR is_public_link = TRUE)
);

CREATE TABLE IF NOT EXISTS document_access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    user_id UUID,
    share_id UUID REFERENCES document_shares(id) ON DELETE SET NULL,
    
    -- Access details
    action VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    
    -- Geographic info
    country VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),
    
    -- Session info
    session_id VARCHAR(255),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_action CHECK (action IN ('view', 'download', 'share', 'edit', 'delete', 'upload', 'preview'))
);

CREATE TABLE IF NOT EXISTS document_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Comment content
    comment TEXT NOT NULL,
    comment_type VARCHAR(20) DEFAULT 'general',
    
    -- Threading
    parent_comment_id UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    thread_level INTEGER DEFAULT 0,
    
    -- Status
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_comment_type CHECK (comment_type IN ('general', 'review', 'approval', 'question', 'issue'))
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    
    -- Version metadata
    change_description TEXT,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    
    -- Version control
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_document_version UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS document_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_files(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    
    -- Job details
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    
    -- Processing metrics
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_job_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    CONSTRAINT valid_job_type CHECK (job_type IN ('virus_scan', 'thumbnail_generation', 'text_extraction', 'pdf_processing', 'image_optimization', 'metadata_extraction'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_folders_client_id ON document_folders(client_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_parent_folder_id ON document_folders(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_document_folders_path ON document_folders USING gin(path gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_document_files_client_id ON document_files(client_id);
CREATE INDEX IF NOT EXISTS idx_document_files_folder_id ON document_files(folder_id);
CREATE INDEX IF NOT EXISTS idx_document_files_uploaded_by ON document_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_files_document_type ON document_files(document_type);
CREATE INDEX IF NOT EXISTS idx_document_files_tax_year ON document_files(tax_year);
CREATE INDEX IF NOT EXISTS idx_document_files_tags ON document_files USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_document_files_created_at ON document_files(created_at);
CREATE INDEX IF NOT EXISTS idx_document_files_processing_status ON document_files(processing_status);
CREATE INDEX IF NOT EXISTS idx_document_files_is_current_version ON document_files(is_current_version);

CREATE INDEX IF NOT EXISTS idx_document_shares_document_id ON document_shares(document_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_client_id ON document_shares(client_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with_user_id ON document_shares(shared_with_user_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_share_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires_at ON document_shares(expires_at);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_document_id ON document_access_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_client_id ON document_access_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_id ON document_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_document_access_logs_created_at ON document_access_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_comments_parent_comment_id ON document_comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_document_id ON document_processing_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_processing_jobs_status ON document_processing_jobs(status);

-- Row Level Security (RLS) policies
ALTER TABLE document_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client access
CREATE POLICY "Client can access own folders" ON document_folders
    FOR ALL USING (client_id = auth.uid());

CREATE POLICY "Client can access own files" ON document_files
    FOR ALL USING (client_id = auth.uid());

CREATE POLICY "Client can access own shares" ON document_shares
    FOR ALL USING (client_id = auth.uid());

CREATE POLICY "Client can access own access logs" ON document_access_logs
    FOR ALL USING (client_id = auth.uid());

CREATE POLICY "Client can access own comments" ON document_comments
    FOR ALL USING (client_id = auth.uid());

CREATE POLICY "Client can access own versions" ON document_versions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_files 
            WHERE document_files.id = document_versions.document_id 
            AND document_files.client_id = auth.uid()
        )
    );

CREATE POLICY "Client can access own processing jobs" ON document_processing_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM document_files 
            WHERE document_files.id = document_processing_jobs.document_id 
            AND document_files.client_id = auth.uid()
        )
    );

-- Create trigger functions
CREATE OR REPLACE FUNCTION update_document_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_document_access()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.last_accessed_at IS NOT NULL AND OLD.last_accessed_at IS DISTINCT FROM NEW.last_accessed_at THEN
        INSERT INTO document_access_logs (document_id, client_id, user_id, action, created_at)
        VALUES (NEW.id, NEW.client_id, NEW.uploaded_by, 'view', NOW());
        
        UPDATE document_files 
        SET access_count = access_count + 1
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_document_share()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if share has expired
    IF NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        RAISE EXCEPTION 'Share has expired';
    END IF;
    
    -- Check download limits
    IF NEW.max_downloads IS NOT NULL AND NEW.download_count >= NEW.max_downloads THEN
        RAISE EXCEPTION 'Download limit exceeded';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_document_folders_updated_at
    BEFORE UPDATE ON document_folders
    FOR EACH ROW
    EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER update_document_files_updated_at
    BEFORE UPDATE ON document_files
    FOR EACH ROW
    EXECUTE FUNCTION update_document_updated_at();

CREATE TRIGGER log_document_file_access
    AFTER UPDATE ON document_files
    FOR EACH ROW
    EXECUTE FUNCTION log_document_access();

CREATE TRIGGER validate_document_share_access
    BEFORE INSERT OR UPDATE ON document_shares
    FOR EACH ROW
    EXECUTE FUNCTION validate_document_share();

-- Storage and security functions
CREATE OR REPLACE FUNCTION create_document_folder(
    p_client_id UUID,
    p_parent_folder_id UUID,
    p_name VARCHAR(255),
    p_created_by UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_folder_id UUID;
    v_parent_path TEXT := '';
    v_new_path TEXT;
BEGIN
    -- Get parent folder path
    IF p_parent_folder_id IS NOT NULL THEN
        SELECT path INTO v_parent_path 
        FROM document_folders 
        WHERE id = p_parent_folder_id AND client_id = p_client_id;
        
        IF v_parent_path IS NULL THEN
            RAISE EXCEPTION 'Parent folder not found';
        END IF;
    END IF;
    
    -- Create new path
    v_new_path := CASE 
        WHEN v_parent_path = '' THEN p_name
        ELSE v_parent_path || '/' || p_name
    END;
    
    -- Insert folder
    INSERT INTO document_folders (client_id, parent_folder_id, name, path, created_by)
    VALUES (p_client_id, p_parent_folder_id, p_name, v_new_path, p_created_by)
    RETURNING id INTO v_folder_id;
    
    RETURN v_folder_id;
END;
$$;

CREATE OR REPLACE FUNCTION upload_document(
    p_client_id UUID,
    p_folder_id UUID,
    p_original_name VARCHAR(255),
    p_file_name VARCHAR(255),
    p_file_size BIGINT,
    p_mime_type VARCHAR(100),
    p_file_extension VARCHAR(10),
    p_storage_path TEXT,
    p_checksum VARCHAR(64),
    p_document_type VARCHAR(50),
    p_tax_year INTEGER,
    p_category VARCHAR(100),
    p_tags TEXT[],
    p_uploaded_by UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_document_id UUID;
    v_job_id UUID;
BEGIN
    -- Insert document
    INSERT INTO document_files (
        client_id, folder_id, original_name, file_name, file_size, mime_type, 
        file_extension, storage_path, checksum, document_type, tax_year, 
        category, tags, uploaded_by
    ) VALUES (
        p_client_id, p_folder_id, p_original_name, p_file_name, p_file_size, 
        p_mime_type, p_file_extension, p_storage_path, p_checksum, p_document_type, 
        p_tax_year, p_category, p_tags, p_uploaded_by
    ) RETURNING id INTO v_document_id;
    
    -- Create virus scan job
    INSERT INTO document_processing_jobs (document_id, job_type, input_data)
    VALUES (v_document_id, 'virus_scan', '{}')
    RETURNING id INTO v_job_id;
    
    -- Create thumbnail generation job for images/PDFs
    IF p_mime_type LIKE 'image/%' OR p_mime_type = 'application/pdf' THEN
        INSERT INTO document_processing_jobs (document_id, job_type, input_data)
        VALUES (v_document_id, 'thumbnail_generation', '{}');
    END IF;
    
    -- Create text extraction job for PDFs
    IF p_mime_type = 'application/pdf' THEN
        INSERT INTO document_processing_jobs (document_id, job_type, input_data)
        VALUES (v_document_id, 'text_extraction', '{}');
    END IF;
    
    RETURN v_document_id;
END;
$$;

CREATE OR REPLACE FUNCTION share_document(
    p_document_id UUID,
    p_client_id UUID,
    p_shared_with_user_id UUID,
    p_shared_with_email VARCHAR(255),
    p_share_type VARCHAR(20),
    p_expires_at TIMESTAMP WITH TIME ZONE,
    p_password_hash VARCHAR(255),
    p_max_downloads INTEGER,
    p_is_public_link BOOLEAN,
    p_can_view BOOLEAN,
    p_can_download BOOLEAN,
    p_can_comment BOOLEAN,
    p_can_edit BOOLEAN,
    p_created_by UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_share_id UUID;
    v_share_token VARCHAR(255);
BEGIN
    -- Generate share token
    v_share_token := encode(gen_random_bytes(32), 'hex');
    
    -- Insert share
    INSERT INTO document_shares (
        document_id, client_id, shared_with_user_id, shared_with_email, share_type,
        expires_at, password_hash, max_downloads, share_token, is_public_link,
        can_view, can_download, can_comment, can_edit, created_by
    ) VALUES (
        p_document_id, p_client_id, p_shared_with_user_id, p_shared_with_email, p_share_type,
        p_expires_at, p_password_hash, p_max_downloads, v_share_token, p_is_public_link,
        p_can_view, p_can_download, p_can_comment, p_can_edit, p_created_by
    ) RETURNING id INTO v_share_id;
    
    RETURN v_share_id;
END;
$$;

CREATE OR REPLACE FUNCTION get_client_document_stats(p_client_id UUID)
RETURNS TABLE(
    total_documents INTEGER,
    total_storage_bytes BIGINT,
    documents_by_type JSONB,
    documents_by_year JSONB,
    recent_uploads INTEGER,
    shared_documents INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_documents,
        SUM(file_size)::BIGINT as total_storage_bytes,
        jsonb_object_agg(document_type, type_count) as documents_by_type,
        jsonb_object_agg(tax_year, year_count) as documents_by_year,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END)::INTEGER as recent_uploads,
        COUNT(CASE WHEN id IN (SELECT document_id FROM document_shares WHERE client_id = p_client_id) THEN 1 END)::INTEGER as shared_documents
    FROM (
        SELECT 
            df.*,
            COUNT(*) OVER (PARTITION BY document_type) as type_count,
            COUNT(*) OVER (PARTITION BY tax_year) as year_count
        FROM document_files df
        WHERE df.client_id = p_client_id
        AND df.is_current_version = true
    ) stats;
END;
$$;

-- Create default folder structure for new clients
CREATE OR REPLACE FUNCTION create_default_folders_for_client(p_client_id UUID, p_created_by UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tax_docs_folder UUID;
    v_financial_folder UUID;
    v_current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
    -- Create Tax Documents folder
    SELECT create_document_folder(p_client_id, NULL, 'Tax Documents', p_created_by) INTO v_tax_docs_folder;
    
    -- Create subfolders for current and previous years
    PERFORM create_document_folder(p_client_id, v_tax_docs_folder, v_current_year::TEXT, p_created_by);
    PERFORM create_document_folder(p_client_id, v_tax_docs_folder, (v_current_year - 1)::TEXT, p_created_by);
    
    -- Create Financial Statements folder
    SELECT create_document_folder(p_client_id, NULL, 'Financial Statements', p_created_by) INTO v_financial_folder;
    
    -- Create other default folders
    PERFORM create_document_folder(p_client_id, NULL, 'Contracts & Agreements', p_created_by);
    PERFORM create_document_folder(p_client_id, NULL, 'Receipts & Invoices', p_created_by);
    PERFORM create_document_folder(p_client_id, NULL, 'General Documents', p_created_by);
END;
$$;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE document_folders IS 'Hierarchical folder structure for organizing client documents';
COMMENT ON TABLE document_files IS 'Main document storage table with metadata, versioning, and security';
COMMENT ON TABLE document_shares IS 'Document sharing and access control system';
COMMENT ON TABLE document_access_logs IS 'Comprehensive audit trail for document access';
COMMENT ON TABLE document_comments IS 'Threaded commenting system for document collaboration';
COMMENT ON TABLE document_versions IS 'Version history for document files';
COMMENT ON TABLE document_processing_jobs IS 'Asynchronous processing jobs for documents';

COMMENT ON FUNCTION create_document_folder IS 'Creates a new folder with proper path management';
COMMENT ON FUNCTION upload_document IS 'Handles secure document upload with automatic processing jobs';
COMMENT ON FUNCTION share_document IS 'Creates secure document sharing with access control';
COMMENT ON FUNCTION get_client_document_stats IS 'Returns comprehensive document statistics for clients';
COMMENT ON FUNCTION create_default_folders_for_client IS 'Creates default folder structure for new clients';