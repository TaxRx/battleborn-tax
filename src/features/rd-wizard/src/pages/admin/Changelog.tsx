import React, { useEffect, useState } from 'react';
import { getAllChangelogEntries } from '../../services/changelogService';
import { getAllBusinesses } from '../../services/businessService';
import { getAllUsers } from '../../services/userService';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useImpersonation } from '../../contexts/ImpersonationContext';
import { User } from '../../types';
import { useUser } from '../../context/UserContext';
import { toast } from 'react-hot-toast';
import { createChangelogEntry } from '../../services/changelogService';

interface ChangelogEntry {
  id: string;
  business_id: string;
  user_id: string;
  action: string;
  details: any;
  created_at: string;
}

interface FilterOption {
  id: string;
  name: string;
}

const PAGE_SIZE = 20;

const Changelog: React.FC = () => {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [filtered, setFiltered] = useState<ChangelogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [businessFilter, setBusinessFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [users, setUsers] = useState<FilterOption[]>([]); // For user filter
  const [page, setPage] = useState(1);
  const { startImpersonation } = useImpersonation();
  const { user } = useUser();

  useEffect(() => {
    getAllChangelogEntries()?.then((res) => {
      const data = res && 'data' in res ? res.data : [];
      const error = res && 'error' in res ? res.error : null;
      if (data) {
        setEntries(data);
        setFiltered(data);
      }
      if (error) toast.error(error || 'Unknown error');
    });
    getAllBusinesses()?.then((res) => {
      const data = res && 'data' in res ? res.data : [];
      const error = res && 'error' in res ? res.error : null;
      if (data) {
        setBusinesses(data);
      }
      if (error) toast.error(error || 'Unknown error');
    });
    getAllUsers()?.then((res) => {
      const data = res && 'data' in res ? res.data : [];
      const error = res && 'error' in res ? res.error : null;
      if (Array.isArray(data)) {
        setUsers([
          { id: '', name: 'All Users' },
          ...data.map((u: User) => ({ id: u.id, name: u.name }))
        ]);
      } else {
        setUsers([{ id: '', name: 'All Users' }]);
      }
      if (error) toast.error(error || 'Unknown error');
    });
  }, []);

  useEffect(() => {
    let result = entries;
    if (actionFilter) result = result.filter(e => e.action === actionFilter);
    if (businessFilter) result = result.filter(e => e.business_id === businessFilter);
    if (userFilter) result = result.filter(e => e.user_id === userFilter);
    if (dateFrom) result = result.filter(e => new Date(e.created_at) >= new Date(dateFrom));
    if (dateTo) result = result.filter(e => new Date(e.created_at) <= new Date(dateTo));
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(e =>
        e.action.toLowerCase().includes(s) ||
        JSON.stringify(e.details).toLowerCase().includes(s)
      );
    }
    setFiltered(result);
    setPage(1);
  }, [search, actionFilter, businessFilter, userFilter, dateFrom, dateTo, entries]);

  const uniqueActions = Array.from(new Set(entries.map(e => e.action)));
  const actionOptions = [{ value: '', label: 'All Actions' }, ...uniqueActions.map(action => ({ value: action, label: action }))];
  const businessOptions = [{ value: '', label: 'All Businesses' }, ...businesses.map(b => ({ value: b.id, label: b.name || b.id }))];
  const userOptions = users.map(u => ({ value: u.id, label: u.name }));

  // Pagination
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <Card className="p-6">
      <h1 className="text-2xl font-bold mb-4">Audit Log</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <Input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search actions or details..."
          className="w-64"
        />
        <Select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          options={actionOptions}
          className="w-48"
        />
        <Select
          value={businessFilter}
          onChange={e => setBusinessFilter(e.target.value)}
          options={businessOptions}
          className="w-48"
        />
        <Select
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
          options={userOptions}
          className="w-48"
        />
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <Input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="w-36"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <Input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="w-36"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase">User</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase">Action</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase">Business</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase">Details</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-500 uppercase">Quick Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginated.map(entry => (
              <tr key={entry.id}>
                <td className="px-4 py-2 whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {users.find(u => u.id === entry.user_id)?.name || entry.user_id}
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={async () => {
                      if (user?.id) {
                        startImpersonation(user.id, entry.user_id);
                        await createChangelogEntry({
                          actor_id: user.id,
                          target_user_id: entry.user_id,
                          action: 'impersonation',
                          details: `Admin impersonated ${users.find(u => u.id === entry.user_id)?.name || entry.user_id}`,
                          metadata: { userName: users.find(u => u.id === entry.user_id)?.name || '', userId: entry.user_id }
                        });
                        toast.success(`Now impersonating ${users.find(u => u.id === entry.user_id)?.name || entry.user_id}`);
                        window.location.href = '/client';
                      }
                    }}
                  >
                    Impersonate
                  </Button>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{entry.action}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {businesses.find(b => b.id === entry.business_id)?.name || entry.business_id}
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-2"
                    onClick={() => window.open(`/admin/businesses/${entry.business_id}`, '_blank')}
                  >
                    View
                  </Button>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-xs max-w-xs truncate" title={JSON.stringify(entry.details)}>
                  <pre className="whitespace-pre-wrap break-all">{JSON.stringify(entry.details, null, 2)}</pre>
                </td>
                <td className="px-4 py-2 whitespace-nowrap space-x-2">
                  {/* Add more quick actions as needed */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/admin/clients/${entry.user_id}`, '_blank')}
                  >
                    View Client
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center text-gray-500 py-8">No changelog entries found.</div>}
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="px-2 py-1 text-gray-700">Page {page} of {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </Card>
  );
};

export default Changelog; 