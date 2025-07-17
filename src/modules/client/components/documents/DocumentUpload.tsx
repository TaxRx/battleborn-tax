import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle, Loader2, FolderOpen, Tag, Calendar } from 'lucide-react';
import { documentService, DocumentFile } from '../../services/documentService';

interface DocumentUploadProps {
  clientId: string;
  folderId?: string;
  onUploadComplete?: (documents: DocumentFile[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  documentId?: string;
  preview?: string;
}

const DOCUMENT_TYPES = [
  { value: 'general', label: 'General Document' },
  { value: 'tax_document', label: 'Tax Document' },
  { value: 'financial_statement', label: 'Financial Statement' },
  { value: 'contract', label: 'Contract' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'w2', label: 'W-2' },
  { value: '1099', label: '1099' },
  { value: 'k1', label: 'K-1' },
  { value: 'other', label: 'Other' }
];

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  clientId,
  folderId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxFileSize = 50, // 50MB default
  acceptedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.png', '.jpg', '.jpeg', '.gif'],
  className = ''
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMetadata, setUploadMetadata] = useState({
    documentType: 'general',
    taxYear: new Date().getFullYear(),
    category: '',
    tags: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `File type not supported. Accepted types: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  const generatePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const processFiles = async (fileList: FileList) => {
    const newFiles: UploadFile[] = [];

    for (let i = 0; i < fileList.length && files.length + newFiles.length < maxFiles; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
      if (error) {
        onUploadError?.(error);
        continue;
      }

      const preview = await generatePreview(file);
      
      newFiles.push({
        file,
        id: generateId(),
        progress: 0,
        status: 'pending',
        preview
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      processFiles(fileList);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const fileList = e.dataTransfer.files;
    if (fileList) {
      processFiles(fileList);
    }
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const calculateChecksum = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const uploadFile = async (uploadFile: UploadFile): Promise<void> => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));

      // Generate upload URL
      const uploadUrlResult = await documentService.generateUploadUrl({
        client_id: clientId,
        file_name: uploadFile.file.name,
        file_size: uploadFile.file.size,
        mime_type: uploadFile.file.type
      });

      if (!uploadUrlResult.success || !uploadUrlResult.data) {
        throw new Error('Failed to generate upload URL');
      }

      const { upload_url, storage_path } = uploadUrlResult.data;

      // Upload file to storage
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        body: uploadFile.file,
        headers: {
          'Content-Type': uploadFile.file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Calculate checksum
      const checksum = await calculateChecksum(uploadFile.file);

      // Create document record
      const fileExtension = uploadFile.file.name.split('.').pop()?.toLowerCase() || '';
      const documentResult = await documentService.uploadDocument({
        client_id: clientId,
        folder_id: folderId,
        original_name: uploadFile.file.name,
        file_name: uploadFile.file.name,
        file_size: uploadFile.file.size,
        mime_type: uploadFile.file.type,
        file_extension: fileExtension,
        storage_path: storage_path,
        checksum: checksum,
        document_type: uploadMetadata.documentType,
        tax_year: uploadMetadata.taxYear,
        category: uploadMetadata.category,
        tags: uploadMetadata.tags,
        uploaded_by: clientId // TODO: Get actual user ID
      });

      if (!documentResult.success) {
        throw new Error('Failed to create document record');
      }

      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'processing',
          documentId: documentResult.data,
          progress: 100
        } : f
      ));

      // Wait for processing to complete
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: 'completed' } : f
        ));
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { 
          ...f, 
          status: 'error', 
          error: errorMessage
        } : f
      ));

      onUploadError?.(errorMessage);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    try {
      await Promise.all(pendingFiles.map(file => uploadFile(file)));
      
      const completedFiles = files.filter(f => f.status === 'completed');
      if (completedFiles.length > 0) {
        // Fetch complete document data
        const documents = await Promise.all(
          completedFiles.map(async (f) => {
            if (f.documentId) {
              const result = await documentService.getDocument(f.documentId);
              return result.data;
            }
            return null;
          })
        );
        
        const validDocuments = documents.filter(Boolean) as DocumentFile[];
        onUploadComplete?.(validDocuments);
      }
    } catch (error) {
      console.error('Batch upload error:', error);
      onUploadError?.('Some files failed to upload');
    } finally {
      setIsUploading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !uploadMetadata.tags.includes(newTag.trim())) {
      setUploadMetadata(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setUploadMetadata(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="w-4 h-4 text-gray-400" />;
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending':
        return 'Ready to upload';
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Upload complete';
      case 'error':
        return 'Upload failed';
      default:
        return '';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop files here or click to browse
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Supported formats: {acceptedTypes.join(', ')} • Max size: {maxFileSize}MB
        </p>
        <button
          type="button"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Files
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Metadata */}
      {files.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Upload Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document Type
              </label>
              <select
                value={uploadMetadata.documentType}
                onChange={(e) => setUploadMetadata(prev => ({ ...prev, documentType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Year
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  value={uploadMetadata.taxYear}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, taxYear: parseInt(e.target.value) }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="2000"
                  max="2030"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={uploadMetadata.category}
                  onChange={(e) => setUploadMetadata(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Q1 2024, Business Expenses"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Add tag"
                  />
                </div>
                <button
                  type="button"
                  onClick={addTag}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Add
                </button>
              </div>
              {uploadMetadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {uploadMetadata.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Files to Upload</h4>
          <div className="space-y-2">
            {files.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    getStatusIcon(file.status)
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.file.size / 1024 / 1024).toFixed(2)} MB • {getStatusText(file.status)}
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {file.status === 'uploading' && (
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    disabled={file.status === 'uploading'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading || files.every(f => f.status !== 'pending')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isUploading ? 'Uploading...' : 'Upload Files'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;