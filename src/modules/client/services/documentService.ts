import { supabase } from '../../../lib/supabase';

export interface DocumentFile {
  id: string;
  client_id: string;
  folder_id?: string;
  original_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  storage_path: string;
  storage_bucket: string;
  checksum: string;
  encryption_key_id?: string;
  
  // Document metadata
  document_type: 'general' | 'tax_document' | 'financial_statement' | 'contract' | 'invoice' | 'receipt' | 'bank_statement' | 'w2' | '1099' | 'k1' | 'other';
  tax_year?: number;
  category?: string;
  tags: string[];
  
  // Security and access
  access_level: 'private' | 'shared' | 'public';
  password_protected: boolean;
  
  // Versioning
  version_number: number;
  is_current_version: boolean;
  parent_version_id?: string;
  
  // Audit trail
  uploaded_by: string;
  uploaded_at: string;
  last_accessed_at?: string;
  access_count: number;
  
  // Status tracking
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  virus_scan_status: 'pending' | 'scanning' | 'clean' | 'infected' | 'error';
  virus_scan_result?: any;
  
  created_at: string;
  updated_at: string;
}

export interface DocumentFolder {
  id: string;
  client_id: string;
  parent_folder_id?: string;
  name: string;
  path: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  children?: DocumentFolder[];
  files?: DocumentFile[];
  file_count?: number;
  total_size?: number;
}

export interface DocumentShare {
  id: string;
  document_id: string;
  client_id: string;
  shared_with_user_id?: string;
  shared_with_email?: string;
  share_type: 'view' | 'edit' | 'comment' | 'download';
  
  // Access control
  expires_at?: string;
  password_hash?: string;
  max_downloads?: number;
  download_count: number;
  
  // Link sharing
  share_token: string;
  is_public_link: boolean;
  
  // Permissions
  can_view: boolean;
  can_download: boolean;
  can_comment: boolean;
  can_edit: boolean;
  
  // Audit
  created_by: string;
  created_at: string;
  last_accessed_at?: string;
  revoked_at?: string;
  revoked_by?: string;
}

export interface DocumentAccessLog {
  id: string;
  document_id: string;
  client_id: string;
  user_id?: string;
  share_id?: string;
  
  // Access details
  action: 'view' | 'download' | 'share' | 'edit' | 'delete' | 'upload' | 'preview';
  ip_address?: string;
  user_agent?: string;
  device_info?: any;
  
  // Geographic info
  country?: string;
  region?: string;
  city?: string;
  
  // Session info
  session_id?: string;
  
  created_at: string;
}

export interface DocumentComment {
  id: string;
  document_id: string;
  client_id: string;
  user_id: string;
  
  // Comment content
  comment: string;
  comment_type: 'general' | 'review' | 'approval' | 'question' | 'issue';
  
  // Threading
  parent_comment_id?: string;
  thread_level: number;
  
  // Status
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  
  created_at: string;
  updated_at: string;
}

export interface DocumentStats {
  total_documents: number;
  total_storage_bytes: number;
  documents_by_type: Record<string, number>;
  documents_by_year: Record<string, number>;
  recent_uploads: number;
  shared_documents: number;
}

export interface UploadDocumentParams {
  client_id: string;
  folder_id?: string;
  original_name: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  storage_path: string;
  checksum: string;
  document_type?: string;
  tax_year?: number;
  category?: string;
  tags?: string[];
  uploaded_by: string;
}

export interface CreateFolderParams {
  client_id: string;
  parent_folder_id?: string;
  name: string;
  created_by: string;
}

export interface ShareDocumentParams {
  document_id: string;
  client_id: string;
  shared_with_user_id?: string;
  shared_with_email?: string;
  share_type: 'view' | 'edit' | 'comment' | 'download';
  expires_at?: string;
  password_hash?: string;
  max_downloads?: number;
  is_public_link?: boolean;
  can_view?: boolean;
  can_download?: boolean;
  can_comment?: boolean;
  can_edit?: boolean;
  created_by: string;
}

export class DocumentService {
  private static instance: DocumentService;

  static getInstance(): DocumentService {
    if (!DocumentService.instance) {
      DocumentService.instance = new DocumentService();
    }
    return DocumentService.instance;
  }

  // Folder Management
  async createFolder(params: CreateFolderParams): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('create_document_folder', {
          p_client_id: params.client_id,
          p_parent_folder_id: params.parent_folder_id,
          p_name: params.name,
          p_created_by: params.created_by
        });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error creating folder:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getFolders(client_id: string): Promise<{ success: boolean; data?: DocumentFolder[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .eq('client_id', client_id)
        .order('name');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching folders:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getFolderHierarchy(client_id: string): Promise<{ success: boolean; data?: DocumentFolder[]; error?: string }> {
    try {
      const { data: folders, error } = await supabase
        .from('document_folders')
        .select('*')
        .eq('client_id', client_id)
        .order('path');

      if (error) throw error;

      // Build hierarchy
      const folderMap = new Map<string, DocumentFolder>();
      const rootFolders: DocumentFolder[] = [];

      // First pass: create folder objects
      folders?.forEach(folder => {
        folderMap.set(folder.id, { ...folder, children: [] });
      });

      // Second pass: build hierarchy
      folders?.forEach(folder => {
        const folderObj = folderMap.get(folder.id)!;
        if (folder.parent_folder_id) {
          const parent = folderMap.get(folder.parent_folder_id);
          if (parent) {
            parent.children!.push(folderObj);
          }
        } else {
          rootFolders.push(folderObj);
        }
      });

      return { success: true, data: rootFolders };
    } catch (error) {
      console.error('Error fetching folder hierarchy:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Document Management
  async uploadDocument(params: UploadDocumentParams): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('upload_document', {
          p_client_id: params.client_id,
          p_folder_id: params.folder_id,
          p_original_name: params.original_name,
          p_file_name: params.file_name,
          p_file_size: params.file_size,
          p_mime_type: params.mime_type,
          p_file_extension: params.file_extension,
          p_storage_path: params.storage_path,
          p_checksum: params.checksum,
          p_document_type: params.document_type || 'general',
          p_tax_year: params.tax_year,
          p_category: params.category,
          p_tags: params.tags || [],
          p_uploaded_by: params.uploaded_by
        });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error uploading document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getDocuments(client_id: string, folder_id?: string): Promise<{ success: boolean; data?: DocumentFile[]; error?: string }> {
    try {
      let query = supabase
        .from('document_files')
        .select('*')
        .eq('client_id', client_id)
        .eq('is_current_version', true)
        .order('created_at', { ascending: false });

      if (folder_id) {
        query = query.eq('folder_id', folder_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching documents:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getDocument(document_id: string): Promise<{ success: boolean; data?: DocumentFile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_files')
        .select('*')
        .eq('id', document_id)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateDocument(document_id: string, updates: Partial<DocumentFile>): Promise<{ success: boolean; data?: DocumentFile; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_files')
        .update(updates)
        .eq('id', document_id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error updating document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteDocument(document_id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('document_files')
        .delete()
        .eq('id', document_id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Document Sharing
  async shareDocument(params: ShareDocumentParams): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('share_document', {
          p_document_id: params.document_id,
          p_client_id: params.client_id,
          p_shared_with_user_id: params.shared_with_user_id,
          p_shared_with_email: params.shared_with_email,
          p_share_type: params.share_type,
          p_expires_at: params.expires_at,
          p_password_hash: params.password_hash,
          p_max_downloads: params.max_downloads,
          p_is_public_link: params.is_public_link || false,
          p_can_view: params.can_view ?? true,
          p_can_download: params.can_download ?? true,
          p_can_comment: params.can_comment ?? false,
          p_can_edit: params.can_edit ?? false,
          p_created_by: params.created_by
        });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error sharing document:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getDocumentShares(document_id: string): Promise<{ success: boolean; data?: DocumentShare[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', document_id)
        .is('revoked_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching document shares:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async revokeDocumentShare(share_id: string, revoked_by: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('document_shares')
        .update({
          revoked_at: new Date().toISOString(),
          revoked_by: revoked_by
        })
        .eq('id', share_id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error revoking document share:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Document Access Logging
  async logDocumentAccess(params: {
    document_id: string;
    client_id: string;
    user_id?: string;
    share_id?: string;
    action: DocumentAccessLog['action'];
    ip_address?: string;
    user_agent?: string;
    device_info?: any;
    session_id?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('document_access_logs')
        .insert({
          document_id: params.document_id,
          client_id: params.client_id,
          user_id: params.user_id,
          share_id: params.share_id,
          action: params.action,
          ip_address: params.ip_address,
          user_agent: params.user_agent,
          device_info: params.device_info,
          session_id: params.session_id
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error logging document access:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getDocumentAccessLogs(document_id: string): Promise<{ success: boolean; data?: DocumentAccessLog[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_access_logs')
        .select('*')
        .eq('document_id', document_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching document access logs:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Document Comments
  async addDocumentComment(params: {
    document_id: string;
    client_id: string;
    user_id: string;
    comment: string;
    comment_type?: DocumentComment['comment_type'];
    parent_comment_id?: string;
  }): Promise<{ success: boolean; data?: DocumentComment; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .insert({
          document_id: params.document_id,
          client_id: params.client_id,
          user_id: params.user_id,
          comment: params.comment,
          comment_type: params.comment_type || 'general',
          parent_comment_id: params.parent_comment_id,
          thread_level: params.parent_comment_id ? 1 : 0
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error adding document comment:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getDocumentComments(document_id: string): Promise<{ success: boolean; data?: DocumentComment[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('document_comments')
        .select('*')
        .eq('document_id', document_id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching document comments:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Document Statistics
  async getDocumentStats(client_id: string): Promise<{ success: boolean; data?: DocumentStats; error?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('get_client_document_stats', {
          p_client_id: client_id
        })
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching document stats:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Search Documents
  async searchDocuments(params: {
    client_id: string;
    query?: string;
    document_type?: string;
    tax_year?: number;
    folder_id?: string;
    tags?: string[];
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data?: DocumentFile[]; total?: number; error?: string }> {
    try {
      let query = supabase
        .from('document_files')
        .select('*', { count: 'exact' })
        .eq('client_id', params.client_id)
        .eq('is_current_version', true);

      if (params.query) {
        query = query.or(`original_name.ilike.%${params.query}%,category.ilike.%${params.query}%`);
      }

      if (params.document_type) {
        query = query.eq('document_type', params.document_type);
      }

      if (params.tax_year) {
        query = query.eq('tax_year', params.tax_year);
      }

      if (params.folder_id) {
        query = query.eq('folder_id', params.folder_id);
      }

      if (params.tags && params.tags.length > 0) {
        query = query.overlaps('tags', params.tags);
      }

      if (params.date_from) {
        query = query.gte('created_at', params.date_from);
      }

      if (params.date_to) {
        query = query.lte('created_at', params.date_to);
      }

      query = query.order('created_at', { ascending: false });

      if (params.limit) {
        query = query.limit(params.limit);
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { success: true, data: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error searching documents:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Initialize default folder structure for new clients
  async initializeClientFolders(client_id: string, created_by: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .rpc('create_default_folders_for_client', {
          p_client_id: client_id,
          p_created_by: created_by
        });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error initializing client folders:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // File upload helpers
  async generateUploadUrl(params: {
    client_id: string;
    file_name: string;
    file_size: number;
    mime_type: string;
  }): Promise<{ success: boolean; data?: { upload_url: string; storage_path: string }; error?: string }> {
    try {
      const storage_path = `${params.client_id}/${Date.now()}-${params.file_name}`;
      
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUploadUrl(storage_path);

      if (error) throw error;

      return { 
        success: true, 
        data: { 
          upload_url: data.signedUrl,
          storage_path: storage_path
        }
      };
    } catch (error) {
      console.error('Error generating upload URL:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async generateDownloadUrl(storage_path: string): Promise<{ success: boolean; data?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(storage_path, 3600); // 1 hour expiry

      if (error) throw error;

      return { success: true, data: data.signedUrl };
    } catch (error) {
      console.error('Error generating download URL:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const documentService = DocumentService.getInstance();