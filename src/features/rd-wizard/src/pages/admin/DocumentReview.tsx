import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createChangelogEntry } from '../../services/changelogService';
import { getAllDocuments, updateDocumentStatus } from '../../services/documentService';
import { getAllUsers } from '../../services/userService';
import { User } from '../../types';
import { useUser } from '../../context/UserContext';
import { proposeChange } from '../../services/pendingChangesService';
import { toast } from 'react-hot-toast';
import { FileText, Search, Filter, Download, CheckCircle, XCircle, User as UserIcon } from 'lucide-react';

interface Document {
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

interface SortConfig {
  key: keyof Document;
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 10;

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const documentTypeOptions = [
  { value: '', label: 'All Types' },
  { value: 'financial', label: 'Financial' },
  { value: 'technical', label: 'Technical' },
  { value: 'payroll', label: 'Payroll' },
];

const DocumentReview: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'uploaded_at',
    direction: 'desc',
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { startImpersonation, adminId, clientId, isImpersonating } = useImpersonation();
  const { user } = useUser();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [documentsResponse, usersResponse] = await Promise.all([
        getAllDocuments(),
        getAllUsers(),
      ]);
      if (documentsResponse?.data) {
        setDocuments(documentsResponse.data);
      }
      if (usersResponse?.data) {
        setClients(usersResponse.data.filter((u: User) => u.role === 'client'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSort = (key: keyof Document) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedDocuments.length / ITEMS_PER_PAGE);
  const paginatedDocuments = sortedDocuments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApprove = async (document: Document) => {
    try {
      await updateDocumentStatus(document.id, 'approved');
      await createChangelogEntry({
        actor_id: adminId || user?.id || '',
        target_user_id: document.client_id,
        action: 'document_approved',
        details: `Document "${document.file_name}" was approved`,
        metadata: { document_id: document.id }
      });
      await fetchData();
    } catch (err: any) {
      console.error('Error approving document:', err);
    }
  };

  const handleReject = async (document: Document) => {
    try {
      await updateDocumentStatus(document.id, 'rejected');
      await createChangelogEntry({
        actor_id: adminId || user?.id || '',
        target_user_id: document.client_id,
        action: 'document_rejected',
        details: `Document "${document.file_name}" was rejected`,
        metadata: { document_id: document.id }
      });
      await fetchData();
    } catch (err: any) {
      console.error('Error rejecting document:', err);
    }
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/admin/clients/${clientId}`);
  };

  const handleViewDocument = (document: Document) => {
    window.open(document.file_url, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (status) {
      case 'pending':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'approved':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
      case 'rejected':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{status}</span>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Document Review</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search documents..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-2">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              options={statusOptions}
              className="w-48"
            />
            <Select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              options={documentTypeOptions}
              className="w-48"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter || typeFilter ? 'Try adjusting your filters' : 'No documents have been uploaded yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedDocuments.map((document) => (
            <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{document.file_name}</h3>
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-500">
                      Type: <span className="font-medium">{document.document_type}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Size: <span className="font-medium">{formatFileSize(document.file_size)}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded: <span className="font-medium">{format(new Date(document.uploaded_at), 'MMM d, yyyy')}</span>
                    </p>
                  </div>
                </div>
                <div className="ml-4">
                  {getStatusBadge(document.review_status)}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewClient(document.client_id)}
                    className="flex items-center"
                  >
                    <UserIcon className="h-4 w-4 mr-2" />
                    View Client
                  </Button>
                  <div className="flex space-x-2">
                    {document.review_status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApprove(document)}
                          className="flex items-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReject(document)}
                          className="flex items-center"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleViewDocument(document)}
                      className="flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default DocumentReview; 