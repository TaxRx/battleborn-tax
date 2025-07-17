import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  File, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Share2, 
  Eye, 
  Edit, 
  Trash2,
  Plus,
  Grid,
  List,
  Calendar,
  Tag,
  FileText,
  Image,
  FileSpreadsheet,
  Archive
} from 'lucide-react';
import { documentService, DocumentFile, DocumentFolder } from '../../services/documentService';
import DocumentUpload from './DocumentUpload';

interface DocumentLibraryProps {
  clientId: string;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'name' | 'date' | 'size' | 'type';

const DocumentLibrary: React.FC<DocumentLibraryProps> = ({ clientId, className = '' }) => {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFolders();
    loadDocuments();
  }, [clientId, currentFolderId]);

  const loadFolders = async () => {
    try {
      const result = await documentService.getFolders(clientId);
      if (result.success && result.data) {
        const folderList = currentFolderId 
          ? result.data.filter(f => f.parent_folder_id === currentFolderId)
          : result.data.filter(f => !f.parent_folder_id);
        setFolders(folderList);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
    }
  };

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const result = await documentService.getDocuments(clientId, currentFolderId);
      if (result.success && result.data) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadComplete = (newDocuments: DocumentFile[]) => {
    setDocuments(prev => [...newDocuments, ...prev]);
    setShowUpload(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    try {
      setIsLoading(true);
      const result = await documentService.searchDocuments({
        client_id: clientId,
        query: searchQuery,
        document_type: filterType !== 'all' ? filterType : undefined,
        folder_id: currentFolderId
      });
      
      if (result.success && result.data) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Error searching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortDocuments = (docs: DocumentFile[]) => {
    return [...docs].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.original_name.localeCompare(b.original_name);
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'size':
          return b.file_size - a.file_size;
        case 'type':
          return a.document_type.localeCompare(b.document_type);
        default:
          return 0;
      }
    });
  };

  const filterDocuments = (docs: DocumentFile[]) => {
    if (filterType === 'all') return docs;
    return docs.filter(doc => doc.document_type === filterType);
  };

  const getFileIcon = (mimeType: string, documentType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-5 h-5" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5" />;
    } else if (mimeType.includes('pdf') || documentType === 'tax_document') {
      return <FileText className="w-5 h-5" />;
    } else if (mimeType.includes('zip') || mimeType.includes('archive')) {
      return <Archive className="w-5 h-5" />;
    } else {
      return <File className="w-5 h-5" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleItemSelect = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const displayedDocuments = sortDocuments(filterDocuments(documents));

  const breadcrumbs = [
    { id: '', name: 'Documents', path: '' }
    // TODO: Add breadcrumb navigation for folder hierarchy
  ];

  if (showUpload) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
          <button
            onClick={() => setShowUpload(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
        <DocumentUpload
          clientId={clientId}
          folderId={currentFolderId}
          onUploadComplete={handleUploadComplete}
          onUploadError={(error) => console.error('Upload error:', error)}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Document Library</h2>
          <nav className="flex mt-2" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.id}>
                  <div className="flex items-center">
                    {index > 0 && <span className="mx-2 text-gray-500">/</span>}
                    <button
                      onClick={() => setCurrentFolderId(crumb.id || undefined)}
                      className={`text-sm ${
                        index === breadcrumbs.length - 1
                          ? 'text-gray-500 cursor-default'
                          : 'text-blue-600 hover:text-blue-700'
                      }`}
                    >
                      {crumb.name}
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="tax_document">Tax Documents</option>
            <option value="financial_statement">Financial Statements</option>
            <option value="contract">Contracts</option>
            <option value="invoice">Invoices</option>
            <option value="receipt">Receipts</option>
            <option value="other">Other</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="name">Sort by Name</option>
            <option value="size">Sort by Size</option>
            <option value="type">Sort by Type</option>
          </select>

          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Folders */}
          {folders.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Folders</h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => setCurrentFolderId(folder.id)}
                    className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                      viewMode === 'list' ? 'flex items-center justify-between' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <FolderOpen className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="font-medium text-gray-900">{folder.name}</p>
                        <p className="text-sm text-gray-500">
                          {folder.file_count || 0} files
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          {displayedDocuments.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Documents</h3>
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
                {displayedDocuments.map(document => (
                  <div
                    key={document.id}
                    className={`p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
                      viewMode === 'list' ? 'flex items-center justify-between' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(document.mime_type, document.document_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {document.original_name}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatFileSize(document.file_size)}</span>
                          <span>•</span>
                          <span>{formatDate(document.created_at)}</span>
                        </div>
                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {document.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {document.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{document.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-3">
                      <button
                        onClick={() => {/* TODO: Implement view */}}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* TODO: Implement download */}}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* TODO: Implement share */}}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Share"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {/* TODO: Implement more options */}}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchQuery ? 'No documents found matching your search.' : 'No documents in this folder.'}
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload your first document
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentLibrary;