import { supabase, handleSupabaseError, isDemoMode } from '../utils/supabaseClient';
import { demoDocuments } from '../data/demoSeed';

export interface Document {
  id: string;
  file_name: string;
  document_type: string;
  file_url: string;
  client_id: string;
  review_status: 'pending' | 'approved' | 'rejected';
  uploaded_at: string;
  updated_at: string;
  file_size: number;
  mime_type: string;
}

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

function toDocument(raw: any): Document {
  return {
    id: String(raw.id),
    file_name: String(raw.file_name),
    document_type: String(raw.document_type),
    file_url: String(raw.file_url),
    client_id: String(raw.client_id),
    review_status: (raw.review_status as 'pending' | 'approved' | 'rejected') ?? 'pending',
    uploaded_at: String(raw.uploaded_at),
    updated_at: String(raw.updated_at),
    file_size: Number(raw.file_size),
    mime_type: String(raw.mime_type),
  };
}

export async function getAllDocuments(filters = {}): Promise<ServiceResponse<Document[]>> {
  if (isDemoMode()) {
    let docs = demoDocuments.map(toDocument);
    if ((filters as any).statusFilter) {
      docs = docs.filter(d => d.review_status === (filters as any).statusFilter);
    }
    if ((filters as any).clientFilter) {
      docs = docs.filter(d => d.client_id === (filters as any).clientFilter);
    }
    if ((filters as any).typeFilter) {
      docs = docs.filter(d => d.document_type === (filters as any).typeFilter);
    }
    return { data: docs, error: null };
  }
  try {
    let query = supabase.from('documents').select('*');
    if ((filters as any).statusFilter) query = query.eq('review_status', (filters as any).statusFilter);
    if ((filters as any).clientFilter) query = query.eq('client_id', (filters as any).clientFilter);
    if ((filters as any).typeFilter) query = query.eq('document_type', (filters as any).typeFilter);
    const { data, error } = await query;
    if (error) return { data: null, error: error.message };
    if (Array.isArray(data)) {
      return { data: data.map(toDocument), error: null };
    }
    return { data: [], error: null };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
}

export async function updateDocumentStatus(documentId: string, status: 'pending' | 'approved' | 'rejected'): Promise<ServiceResponse<Document>> {
  if (isDemoMode()) {
    const idx = demoDocuments.findIndex(d => d.id === documentId);
    if (idx !== -1) {
      demoDocuments[idx].review_status = status;
      demoDocuments[idx].updated_at = new Date().toISOString();
      return { data: toDocument(demoDocuments[idx]), error: null };
    }
    return { data: null, error: 'Document not found' };
  }
  try {
    const { data, error } = await supabase
      .from('documents')
      .update({ review_status: status, updated_at: new Date().toISOString() })
      .eq('id', documentId)
      .single();
    if (error) return { data: null, error: error.message };
    if (data && typeof data === 'object' && data !== null) {
      return { data: toDocument(data), error: null };
    }
    return { data: null, error: 'Invalid document data' };
  } catch (error: any) {
    handleSupabaseError(error);
    return { data: null, error: error.message || 'Unknown error' };
  }
} 