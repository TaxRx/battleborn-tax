import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { createChangelogEntry } from '../../services/changelogService';
import { getAllActivities, updateActivityStatus } from '../../services/activityService';
import { getAllUsers } from '../../services/userService';
import { User } from '../../types';
import { useUser } from '../../context/UserContext';
import { proposeChange } from '../../services/pendingChangesService';
import { toast } from 'react-hot-toast';
import { FileText, Search, User as UserIcon, CheckCircle, XCircle } from 'lucide-react';

interface Activity {
  id: string;
  name: string;
  description: string;
  client_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

interface SortConfig {
  key: keyof Activity;
  direction: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 10;

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const ActivityReview: React.FC = () => {
  const navigate = useNavigate();
  const { startImpersonation, adminId, clientId, isImpersonating } = useImpersonation();
  const { user } = useUser();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
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
      const [activitiesResponse, usersResponse] = await Promise.all([
        getAllActivities(),
        getAllUsers(),
      ]);
      if (activitiesResponse?.data) {
        setActivities(activitiesResponse.data);
      }
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
  }, [statusFilter, clientFilter]);

  const clientOptions = [
    { value: '', label: 'All Clients' },
    ...clients.map(c => ({ value: c.id, label: c.name }))
  ];

  const handleSort = (key: keyof Activity) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedActivities = [...activities].sort((a, b) => {
    if (sortConfig.direction === 'asc') {
      return a[sortConfig.key] > b[sortConfig.key] ? 1 : -1;
    }
    return a[sortConfig.key] < b[sortConfig.key] ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = sortedActivities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleApprove = async (activity: Activity) => {
    try {
      await updateActivityStatus(activity.id, 'approved');
      await createChangelogEntry({
        actor_id: adminId || user?.id || '',
        target_user_id: activity.client_id,
        action: 'activity_approved',
        details: `Activity "${activity.name}" was approved`,
        metadata: { activity_id: activity.id }
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReject = async (activity: Activity) => {
    try {
      await updateActivityStatus(activity.id, 'rejected');
      await createChangelogEntry({
        actor_id: adminId || user?.id || '',
        target_user_id: activity.client_id,
        action: 'activity_rejected',
        details: `Activity "${activity.name}" was rejected`,
        metadata: { activity_id: activity.id }
      });
      await fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewClient = (clientId: string) => {
    navigate(`/admin/clients/${clientId}`);
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activity Review</h1>
        <div className="flex space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search activities..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              // TODO: implement search logic
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
      ) : paginatedActivities.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No activities found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {statusFilter || clientFilter ? 'Try adjusting your filters' : 'No activities have been created yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedActivities.map(act => {
            const client = clients.find(c => c.id === act.client_id);
            return (
              <div key={act.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{act.name}</h3>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-500">
                        Client: <span className="font-medium">{client?.name || 'Unknown'}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        Last Updated: <span className="font-medium">{format(new Date(act.updated_at), 'MMM d, yyyy')}</span>
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">{getStatusBadge(act.status)}</div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewClient(act.client_id)}
                      className="flex items-center"
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      View Client
                    </Button>
                    <div className="flex space-x-2">
                      {act.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove(act)}
                            className="flex items-center"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleReject(act)}
                            className="flex items-center"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => { 
                          if (user?.id) { 
                            startImpersonation(user.id, act.client_id);
                            await createChangelogEntry({
                              actor_id: user.id,
                              target_user_id: act.client_id,
                              action: 'impersonation',
                              details: `Admin impersonated ${client?.name || client?.email || act.client_id}`,
                              metadata: { clientName: client?.name ?? '', clientEmail: client?.email ?? '' }
                            });
                            toast.success(`Now impersonating ${client?.name || client?.email || act.client_id}`);
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

export default ActivityReview; 