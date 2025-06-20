import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createChangelogEntry } from '../../services/changelogService';
import { getAllActivities, updateActivityStatus } from '../../services/activityService';
import { getAllExpenses, updateExpenseStatus } from '../../services/expenseService';
import { getAllDocuments, updateDocumentStatus } from '../../services/documentService';
import { getAllUsers } from '../../services/userService';
import { User } from '../../types';
import { useUser } from '../../context/UserContext';
import { proposeChange } from '../../services/pendingChangesService';
import { toast } from 'react-hot-toast';
import { FileText, Search, User as UserIcon, CheckCircle, XCircle, Layers, DollarSign, FileText as DocIcon } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  description: string;
  client_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface Expense {
  id: string;
  type: 'wage' | 'contractor' | 'supply';
  description: string;
  client_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  year: number;
  created_at: string;
  updated_at: string;
  metadata?: {
    employee_id?: string;
    contractor_id?: string;
    supplier_id?: string;
    start_date?: string;
    end_date?: string;
  };
}

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

interface PendingItem {
  id: string;
  type: 'activity' | 'expense' | 'document';
  name: string;
  client_id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'approved' | 'rejected';
  amount?: number;
  description?: string;
  metadata?: {
    start_date?: string;
    end_date?: string;
    employee_id?: string;
    contractor_id?: string;
    supplier_id?: string;
    [key: string]: any;
  };
}

interface SortConfig {
  key: keyof PendingItem;
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 10;

const typeOptions = [
  { value: '', label: 'All Types' },
  { value: 'activity', label: 'Activity' },
  { value: 'expense', label: 'Expense' },
  { value: 'document', label: 'Document' },
];

const PendingApproval: React.FC = () => {
  const navigate = useNavigate();
  const { startImpersonation, adminId, clientId, isImpersonating } = useImpersonation();
  const { user } = useUser();
  const [items, setItems] = useState<PendingItem[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [typeFilter, setTypeFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'created_at',
    direction: 'desc',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activitiesResponse, expensesResponse, documentsResponse, usersResponse] = await Promise.all([
        getAllActivities(),
        getAllExpenses(),
        getAllDocuments(),
        getAllUsers(),
      ]);

      const pendingItems: PendingItem[] = [];

      if (activitiesResponse?.data) {
        pendingItems.push(...activitiesResponse.data
          .filter((a: Activity) => a.status === 'pending')
          .map((a: Activity) => ({
            id: a.id,
            type: 'activity' as const,
            name: a.name,
            client_id: a.client_id,
            created_at: a.created_at,
            updated_at: a.updated_at,
            status: a.status,
            description: a.description,
          })));
      }

      if (expensesResponse?.data) {
        pendingItems.push(...expensesResponse.data
          .filter((e: Expense) => e.status === 'pending')
          .map((e: Expense) => ({
            id: e.id,
            type: 'expense' as const,
            name: e.description,
            client_id: e.client_id,
            created_at: e.created_at,
            updated_at: e.updated_at,
            status: e.status,
            amount: e.amount,
            metadata: e.metadata,
          })));
      }

      if (documentsResponse?.data) {
        pendingItems.push(...documentsResponse.data
          .filter((d: Document) => d.review_status === 'pending')
          .map((d: Document) => ({
            id: d.id,
            type: 'document' as const,
            name: d.file_name,
            client_id: d.client_id,
            created_at: d.uploaded_at,
            updated_at: d.updated_at,
            status: d.review_status,
          })));
      }

      setItems(pendingItems);

      if (usersResponse?.data) {
        setClients(usersResponse.data.filter((u: User) => u.role === 'client'));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, clientFilter]);

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map(c => ({ value: c.id, label: c.name }))
  ];

  const handleSort = (key: keyof PendingItem) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedItems = [...items].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApprove = async (item: PendingItem) => {
    try {
      switch (item.type) {
        case 'activity':
          await updateActivityStatus(item.id, 'approved');
          if (item.client_id) {
            await createChangelogEntry({
              actor_id: adminId || user?.id,
              target_user_id: item.client_id,
              action: 'activity_approved',
              details: `Activity "${item.name}" was approved`,
              metadata: { activity_id: item.id }
            });
          }
          break;
        case 'expense':
          await updateExpenseStatus(item.id, 'approved');
          if (item.client_id) {
            await createChangelogEntry({
              actor_id: adminId || user?.id,
              target_user_id: item.client_id,
              action: 'expense_approved',
              details: `Expense "${item.name}" was approved`,
              metadata: { expense_id: item.id }
            });
          }
          break;
        case 'document':
          await updateDocumentStatus(item.id, 'approved');
          if (item.client_id) {
            await createChangelogEntry({
              actor_id: adminId || user?.id,
              target_user_id: item.client_id,
              action: 'document_approved',
              details: `Document "${item.name}" was approved`,
              metadata: { document_id: item.id }
            });
          }
          break;
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (item: PendingItem) => {
    try {
      switch (item.type) {
        case 'activity':
          await updateActivityStatus(item.id, 'rejected');
          if (item.client_id) {
            await createChangelogEntry({
              actor_id: adminId || user?.id,
              target_user_id: item.client_id,
              action: 'activity_rejected',
              details: `Activity "${item.name}" was rejected`,
              metadata: { activity_id: item.id }
            });
          }
          break;
        case 'expense':
          await updateExpenseStatus(item.id, 'rejected');
          if (item.client_id) {
            await createChangelogEntry({
              actor_id: adminId || user?.id,
              target_user_id: item.client_id,
              action: 'expense_rejected',
              details: `Expense "${item.name}" was rejected`,
              metadata: { expense_id: item.id }
            });
          }
          break;
        case 'document':
          await updateDocumentStatus(item.id, 'rejected');
          if (item.client_id) {
            await createChangelogEntry({
              actor_id: adminId || user?.id,
              target_user_id: item.client_id,
              action: 'document_rejected',
              details: `Document "${item.name}" was rejected`,
              metadata: { document_id: item.id }
            });
          }
          break;
      }
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/admin/clients/${clientId}`);
  };

  const getTypeBadge = (type: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium';
    switch (type) {
      case 'activity':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Activity</span>;
      case 'expense':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Expense</span>;
      case 'document':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Document</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>{type}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search pending items..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              // TODO: implement search logic
            />
          </div>
          <div className="flex space-x-2">
            <Select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              options={typeOptions}
              className="w-48"
            />
            <Select
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              options={clientOptions}
              className="w-48"
            />
          </div>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-8">{error}</div>
      ) : paginatedItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending items found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {typeFilter || clientFilter ? 'Try adjusting your filters' : 'No items are pending approval'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedItems.map(item => {
            const client = clients.find(c => c.id === item.client_id);
            let icon = <Layers className="h-5 w-5 text-blue-400" />;
            if (item.type === 'expense') icon = <DollarSign className="h-5 w-5 text-green-400" />;
            if (item.type === 'document') icon = <DocIcon className="h-5 w-5 text-purple-400" />;
            return (
              <div key={`${item.type}-${item.id}`} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {icon}
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-500">
                        Type: <span className="font-medium">{getTypeBadge(item.type)}</span>
                      </p>
                      {item.amount && (
                        <p className="text-sm text-gray-500">
                          Amount: <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </p>
                      )}
                      {item.description && (
                        <p className="text-sm text-gray-500">
                          Description: <span className="font-medium">{item.description}</span>
                        </p>
                      )}
                      {item.metadata && (item.metadata.start_date || item.metadata.end_date) && (
                        <p className="text-sm text-gray-500">
                          Period: <span className="font-medium">{item.metadata.start_date ? format(new Date(item.metadata.start_date), 'MMM d, yyyy') : ''} - {item.metadata.end_date ? format(new Date(item.metadata.end_date), 'MMM d, yyyy') : ''}</span>
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Client: <span className="font-medium">{client?.name || ''}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: <span className="font-medium">{item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy') : ''}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewClient(item.client_id)}
                      className="flex items-center"
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      View Client
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApprove(item)}
                        className="flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReject(item)}
                        className="flex items-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (user?.id) {
                            startImpersonation(user.id, item.client_id);
                            await createChangelogEntry({
                              actor_id: user.id,
                              target_user_id: String(item.client_id),
                              action: 'impersonation',
                              details: `Admin impersonated ${(client?.name || client?.email || String(item.client_id))}`,
                              metadata: { clientName: client?.name || '', clientEmail: client?.email || '' }
                            });
                            toast.success(`Now impersonating ${(client?.name || client?.email || String(item.client_id))}`);
                            navigate('/client');
                          }
                        }}
                        className="flex items-center"
                      >
                        <UserIcon className="h-4 w-4 mr-2" />
                        Impersonate
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
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

export default PendingApproval; 