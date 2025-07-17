import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List,
  Plus,
  FolderOpen,
  Settings,
  BarChart3,
  Share2,
  Download,
  Archive
} from 'lucide-react';
import { documentService, DocumentFile, DocumentStats } from '../../services/documentService';
import DocumentLibrary from './DocumentLibrary';
import DocumentUpload from './DocumentUpload';
import DocumentSearchAndFilter from './DocumentSearchAndFilter';
import DocumentShare from './DocumentShare';

interface DocumentManagerProps {
  clientId: string;
  className?: string;
}

type ViewMode = 'library' | 'upload' | 'search' | 'stats';

const DocumentManager: React.FC<DocumentManagerProps> = ({ clientId, className = '' }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('library');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentFile[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadDocuments();
    loadStats();
    initializeClientFolders();
  }, [clientId]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const result = await documentService.getDocuments(clientId);
      if (result.success && result.data) {
        setDocuments(result.data);
        setFilteredDocuments(result.data);
        setTotalCount(result.data.length);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await documentService.getDocumentStats(clientId);
      if (result.success && result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const initializeClientFolders = async () => {
    try {
      await documentService.initializeClientFolders(clientId, clientId);
    } catch (error) {
      console.error('Error initializing folders:', error);
    }
  };

  const handleUploadComplete = (newDocuments: DocumentFile[]) => {
    setDocuments(prev => [...newDocuments, ...prev]);
    setFilteredDocuments(prev => [...newDocuments, ...prev]);
    setTotalCount(prev => prev + newDocuments.length);
    loadStats();
    setCurrentView('library');
  };

  const handleSearchResults = (results: DocumentFile[], total: number) => {
    setFilteredDocuments(results);
    setTotalCount(total);
  };

  const handleDocumentShare = (document: DocumentFile) => {
    setSelectedDocument(document);
    setShowShareModal(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderStatsView = () => {
    if (!stats) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Document Statistics</h2>
          <button
            onClick={loadStats}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Refresh
          </button>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Documents</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.total_documents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Archive className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Storage</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatFileSize(stats.total_storage_bytes)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Upload className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Uploads</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.recent_uploads}</p>
                <p className="text-xs text-gray-500">Last 30 days</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Share2 className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Shared Documents</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.shared_documents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Document Types Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documents by Type</h3>
          <div className="space-y-3">
            {Object.entries(stats.documents_by_type).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {type.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(count / stats.total_documents) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documents by Year */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documents by Tax Year</h3>
          <div className="space-y-3">
            {Object.entries(stats.documents_by_year)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([year, count]) => (
                <div key={year} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{year}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(count / stats.total_documents) * 100}%`
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'library':
        return (
          <DocumentLibrary
            clientId={clientId}
            className=""
          />
        );
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
              <button
                onClick={() => setCurrentView('library')}
                className="text-gray-500 hover:text-gray-700"
              >
                Back to Library
              </button>
            </div>
            <DocumentUpload
              clientId={clientId}
              onUploadComplete={handleUploadComplete}
              onUploadError={(error) => console.error('Upload error:', error)}
            />
          </div>
        );
      case 'search':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Search Documents</h2>
              <button
                onClick={() => setCurrentView('library')}
                className="text-gray-500 hover:text-gray-700"
              >
                Back to Library
              </button>
            </div>
            <DocumentSearchAndFilter
              clientId={clientId}
              onResultsChange={handleSearchResults}
              onLoadingChange={setIsLoading}
            />
            {/* Search Results */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Search Results ({totalCount})
                </h3>
              </div>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDocuments.map(document => (
                    <div
                      key={document.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-8 h-8 text-blue-500" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {document.original_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(document.file_size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {new Date(document.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleDocumentShare(document)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'stats':
        return renderStatsView();
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Document Manager</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentView('library')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              currentView === 'library'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>Library</span>
          </button>
          <button
            onClick={() => setCurrentView('upload')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              currentView === 'upload'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>
          <button
            onClick={() => setCurrentView('search')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              currentView === 'search'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setCurrentView('stats')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              currentView === 'stats'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Stats</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {currentView !== 'stats' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Documents</p>
                <p className="text-xl font-semibold text-gray-900">{stats.total_documents}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Storage Used</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatFileSize(stats.total_storage_bytes)}
                </p>
              </div>
              <Archive className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Recent Uploads</p>
                <p className="text-xl font-semibold text-gray-900">{stats.recent_uploads}</p>
              </div>
              <Upload className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Shared</p>
                <p className="text-xl font-semibold text-gray-900">{stats.shared_documents}</p>
              </div>
              <Share2 className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          {renderCurrentView()}
        </div>
      </div>

      {/* Document Share Modal */}
      {showShareModal && selectedDocument && (
        <DocumentShare
          document={selectedDocument}
          onClose={() => {
            setShowShareModal(false);
            setSelectedDocument(null);
          }}
          onShareCreated={(share) => {
            console.log('Share created:', share);
            // Refresh stats if needed
            loadStats();
          }}
        />
      )}
    </div>
  );
};

export default DocumentManager;