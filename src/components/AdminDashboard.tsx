import React, { useState, useEffect, useMemo } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useUserStore } from '../store/userStore';
import { useAdminStore } from '../store/adminStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { Users, FileText, Bell, Download, RefreshCw, Settings, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, Outlet, Routes, Route } from 'react-router-dom';
import { AdminQRAUpload } from "./AdminQRAUpload";
import { Advisor, Group, Client, AuditLog, Notification, CharitableDonation } from '../types/user';
import { advisorService, transferAdvisor, transferGroup, transferClient, getNotifications, sendNotification, getDocuments, uploadDocument, deleteDocument, deleteAdvisor, deleteGroup, deleteClient, getAllCharitableDonationsByYear, updateCharitableDonationStatus } from '../services/advisorService';
import type { Document } from '../types/document';
import toast from 'react-hot-toast';
import debounce from 'lodash.debounce';
import Sidebar from '../features/rd-wizard/src/components/layout/Sidebar';
import AdminClientsPage from './AdminClientsPage';
import { UserProvider } from '../features/rd-wizard/src/context/UserContext';
import useAuthStore from '../store/authStore';

function generateRandomPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// Placeholder for strategies; replace with real type if available
interface ClientStrategy {
  id: string;
  name: string;
  status: string;
}

interface EntityListProps<T> {
  title: string;
  entities: T[];
  onView: (entity: T) => void;
  onEdit: (entity: T) => void;
  onTransfer?: (entity: T) => void;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  renderExtra?: (entity: T) => React.ReactNode;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onBulkDelete?: () => void;
  onBulkTransfer?: () => void;
}

function EntityList<T extends { id: string; name?: string }>({
  title,
  entities,
  onView,
  onEdit,
  onTransfer,
  searchTerm,
  setSearchTerm,
  renderExtra,
  selectedIds,
  onToggleSelect,
  onBulkDelete,
  onBulkTransfer
}: EntityListProps<T>) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{title}</h3>
        <input
          type="text"
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="px-4 py-2 border rounded"
        />
      </div>
      <div className="flex space-x-2 mb-2">
        {onBulkDelete && (
          <button onClick={onBulkDelete} className="px-3 py-1 bg-red-600 text-white rounded" disabled={selectedIds.length === 0}>Delete Selected</button>
        )}
        {onBulkTransfer && (
          <button onClick={onBulkTransfer} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={selectedIds.length === 0}>Transfer Selected</button>
        )}
      </div>
      <div className="bg-white rounded-lg shadow divide-y">
        {entities.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No {title.toLowerCase()} found.</div>
        ) : (
          entities.map((entity) => (
            <div key={entity.id} className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(entity.id)}
                  onChange={() => onToggleSelect(entity.id)}
                />
                <div>
                  <div className="font-medium text-gray-900">{entity.name}</div>
                  <div className="text-xs text-gray-500">ID: {entity.id}</div>
                  {renderExtra && renderExtra(entity)}
                </div>
              </div>
              <div className="space-x-2">
                <button onClick={() => onView(entity)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">View</button>
                <button onClick={() => onEdit(entity)} className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700">Edit</button>
                {onTransfer && (
                  <button onClick={() => onTransfer(entity)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Transfer</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { profile } = useUserStore();
  const { demoMode, userType } = useAuthStore();
  const { fees, setFees } = useAdminStore();
  const { subscriptions, setSubscriptionStatus } = useSubscriptionStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [transactionFee, setTransactionFee] = useState(fees.transactionFee);
  const [serviceFee, setServiceFee] = useState(fees.serviceFee);
  const navigate = useNavigate();
  const [tab, setTab] = useState<'advisors' | 'groups' | 'clients'>('advisors');
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchAdvisor, setSearchAdvisor] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [searchClient, setSearchClient] = useState('');
  const [selectedAdvisor, setSelectedAdvisor] = useState<Advisor | null>(null);
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [showAdvisorTransferModal, setShowAdvisorTransferModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showGroupTransferModal, setShowGroupTransferModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showClientTransferModal, setShowClientTransferModal] = useState(false);
  const [transferGroupId, setTransferGroupId] = useState('');
  const [transferAdvisorId, setTransferAdvisorId] = useState('');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditLogLoading, setAuditLogLoading] = useState(false);
  const [auditLogError, setAuditLogError] = useState<string | null>(null);
  const [auditLogAction, setAuditLogAction] = useState('');
  const [auditLogUser, setAuditLogUser] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);
  const [notificationRecipient, setNotificationRecipient] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationFilter, setNotificationFilter] = useState('');
  const [docEntityType, setDocEntityType] = useState<'client' | 'group'>('client');
  const [docEntityId, setDocEntityId] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docLoading, setDocLoading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [auditLogFilters, setAuditLogFilters] = useState<{
    action?: string;
    targetType?: 'advisor' | 'client' | 'group' | 'document';
    startDate?: string;
    endDate?: string;
  }>({});

  // Filter state
  const [advisorGroupFilter, setAdvisorGroupFilter] = useState('');
  const [groupAdvisorFilter, setGroupAdvisorFilter] = useState('');
  const [clientAdvisorFilter, setClientAdvisorFilter] = useState('');
  const [clientGroupFilter, setClientGroupFilter] = useState('');
  const [auditLogUserFilter, setAuditLogUserFilter] = useState('');

  // Debounced search state
  const [debouncedSearchAdvisor, setDebouncedSearchAdvisor] = useState(searchAdvisor);
  const [debouncedSearchGroup, setDebouncedSearchGroup] = useState(searchGroup);
  const [debouncedSearchClient, setDebouncedSearchClient] = useState(searchClient);

  useEffect(() => {
    const handler = debounce(() => setDebouncedSearchAdvisor(searchAdvisor), 300);
    handler();
    return () => handler.cancel();
  }, [searchAdvisor]);
  useEffect(() => {
    const handler = debounce(() => setDebouncedSearchGroup(searchGroup), 300);
    handler();
    return () => handler.cancel();
  }, [searchGroup]);
  useEffect(() => {
    const handler = debounce(() => setDebouncedSearchClient(searchClient), 300);
    handler();
    return () => handler.cancel();
  }, [searchClient]);

  // Filtered lists
  const filteredAdvisors = useMemo(() =>
    advisors.filter(a =>
      (debouncedSearchAdvisor === '' ||
        a.name.toLowerCase().includes(debouncedSearchAdvisor.toLowerCase()) ||
        a.email?.toLowerCase().includes(debouncedSearchAdvisor.toLowerCase())) &&
      (advisorGroupFilter === '' || groups.find(g => g.id === advisorGroupFilter)?.advisorId === a.id)
    ), [advisors, debouncedSearchAdvisor, advisorGroupFilter, groups]
  );

  const filteredGroups = useMemo(() =>
    groups.filter(g =>
      (debouncedSearchGroup === '' ||
        g.name.toLowerCase().includes(debouncedSearchGroup.toLowerCase())) &&
      (groupAdvisorFilter === '' || g.advisorId === groupAdvisorFilter)
    ), [groups, debouncedSearchGroup, groupAdvisorFilter]
  );

  const filteredClients = useMemo(() =>
    clients.filter(c => {
      const matchesSearch =
        debouncedSearchClient === '' ||
        c.name.toLowerCase().includes(debouncedSearchClient.toLowerCase()) ||
        c.email?.toLowerCase().includes(debouncedSearchClient.toLowerCase()) ||
        (Array.isArray(c.groupIds) && c.groupIds.some(gid => groups.find(g => g.id === gid)?.name.toLowerCase().includes(debouncedSearchClient.toLowerCase())));
      const matchesAdvisor = clientAdvisorFilter === '' || c.advisorId === clientAdvisorFilter;
      const matchesGroup = clientGroupFilter === '' || (Array.isArray(c.groupIds) && c.groupIds.includes(clientGroupFilter));
      return matchesSearch && matchesAdvisor && matchesGroup;
    }), [clients, debouncedSearchClient, clientAdvisorFilter, clientGroupFilter, groups]
  );

  const filteredAuditLogs = useMemo(() =>
    auditLogs.filter(log =>
      (auditLogAction ? log.action === auditLogAction : true) &&
      (auditLogUser ? log.userId === auditLogUser : true) &&
      (auditLogUserFilter ? log.userId === auditLogUserFilter : true)
    ), [auditLogs, auditLogAction, auditLogUser, auditLogUserFilter]
  );

  // Add filteredNotifications definition
  const filteredNotifications = useMemo(() =>
    notifications.filter((n: Notification) =>
      notificationFilter ? n.userId === notificationFilter : true
    ), [notifications, notificationFilter]
  );

  // Helper for toggling selection
  const toggleSelection = (id: string, selected: string[], setSelected: (ids: string[]) => void) => {
    setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [advisors, groups, clients] = await Promise.all([
        advisorService.getAdvisors(),
        advisorService.getGroups(''),
        advisorService.getClients('')
      ]);
      setAdvisors(advisors);
      setGroups(groups);
      setClients(clients);
    } catch (error) {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setAuditLogLoading(true);
      setAuditLogError(null);
      const logs = await advisorService.getAuditLogs('', auditLogFilters);
      setAuditLogs(logs);
    } catch (err) {
      setAuditLogError('Failed to load audit logs.');
    } finally {
      setAuditLogLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);
      setNotificationError(null);
      let all: Notification[] = [];
      for (const advisor of advisors) {
        all = all.concat(await getNotifications(advisor.id));
      }
      for (const client of clients) {
        all = all.concat(await getNotifications(client.id));
      }
      setNotifications(all);
    } catch (err) {
      setNotificationError('Failed to load notifications.');
    } finally {
      setNotificationLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!docEntityId) return setDocuments([]);
    try {
      setDocLoading(true);
      setDocError(null);
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      setDocError('Failed to load documents.');
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    loadAuditLogs();
    loadNotifications();
    loadDocuments();
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [auditLogFilters]);

  useEffect(() => {
    loadDocuments();
  }, [docEntityId, docEntityType]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !docEntityId) return;
    setDocUploadLoading(true);
    setDocUploadError(null);
    try {
      const file = e.target.files[0];
      await uploadDocument(file, docEntityId);
      await loadDocuments();
    } catch (err) {
      setDocUploadError('Failed to upload document.');
    } finally {
      setDocUploadLoading(false);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      setDocLoading(true);
      await deleteDocument(id);
      await loadDocuments();
    } catch (err) {
      setDocError('Failed to delete document.');
    } finally {
      setDocLoading(false);
    }
  };

  // Create effective profile for demo mode
  const effectiveProfile = demoMode ? { 
    email: 'admin@taxrxgroup.com', 
    role: 'admin',
    id: 'demo-admin'
  } : profile;

  if (!effectiveProfile) {
    return <div className="p-8 text-center">Loading profile...</div>;
  }
  if (effectiveProfile.role !== 'admin') {
    return <div className="p-8 text-center text-red-600">Access denied. Admins only.</div>;
  }

  const handleResetAdminPassword = () => {
    const newPassword = generateRandomPassword();
    alert(`Your new admin password: ${newPassword}`);
  };

  const handleSaveFees = () => {
    setFees({
      transactionFee: parseFloat(transactionFee.toString()),
      serviceFee: parseFloat(serviceFee.toString())
    });
    alert('Fees updated successfully!');
  };

  const handleToggleSubscription = (userId: string, status: 'active' | 'inactive') => {
    setSubscriptionStatus(userId, status);
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationRecipient || !notificationMessage) return;
    try {
      setNotificationLoading(true);
      setNotificationError(null);
      await sendNotification({
        userId: notificationRecipient,
        message: notificationMessage,
        type: 'info',
        read: false,
        createdAt: new Date().toISOString(),
      });
      setNotificationMessage('');
      await loadNotifications();
    } catch (err) {
      setNotificationError('Failed to send notification.');
    } finally {
      setNotificationLoading(false);
    }
  };

  // Bulk transfer/delete logic
  const handleBulkAdvisorDelete = async () => {
    if (!window.confirm('Delete selected advisors?')) return;
    setBulkActionLoading(true);
    setBulkActionError(null);
    let failed: string[] = [];
    for (const id of selectedAdvisorIds) {
      try {
        await deleteAdvisor(id);
        await advisorService.createAuditLog({
          action: 'delete_advisor',
          userId: effectiveProfile.id,
          createdAt: new Date().toISOString(),
          details: 'Bulk delete',
          metadata: {}
        });
      } catch (err) {
        failed.push(id);
      }
    }
    setBulkActionLoading(false);
    setSelectedAdvisorIds([]);
    await loadAll();
    if (failed.length === 0) {
      toast.success('All selected advisors deleted.');
    } else {
      toast.error(`Failed to delete: ${failed.join(', ')}`);
      setBulkActionError('Some advisors could not be deleted.');
    }
  };

  const handleBulkGroupDelete = async () => {
    if (!window.confirm('Delete selected groups?')) return;
    setBulkActionLoading(true);
    setBulkActionError(null);
    let failed: string[] = [];
    for (const id of selectedGroupIds) {
      try {
        await deleteGroup(id);
        await advisorService.createAuditLog({
          action: 'delete_group',
          userId: effectiveProfile.id,
          createdAt: new Date().toISOString(),
          details: 'Bulk delete',
          metadata: {}
        });
      } catch (err) {
        failed.push(id);
      }
    }
    setBulkActionLoading(false);
    setSelectedGroupIds([]);
    await loadAll();
    if (failed.length === 0) {
      toast.success('All selected groups deleted.');
    } else {
      toast.error(`Failed to delete: ${failed.join(', ')}`);
      setBulkActionError('Some groups could not be deleted.');
    }
  };

  const handleBulkClientDelete = async () => {
    if (!window.confirm('Delete selected clients?')) return;
    setBulkActionLoading(true);
    setBulkActionError(null);
    let failed: string[] = [];
    for (const id of selectedClientIds) {
      try {
        await deleteClient(id);
        await advisorService.createAuditLog({
          action: 'delete_client',
          userId: effectiveProfile.id,
          createdAt: new Date().toISOString(),
          details: 'Bulk delete',
          metadata: {}
        });
      } catch (err) {
        failed.push(id);
      }
    }
    setBulkActionLoading(false);
    setSelectedClientIds([]);
    await loadAll();
    if (failed.length === 0) {
      toast.success('All selected clients deleted.');
    } else {
      toast.error(`Failed to delete: ${failed.join(', ')}`);
      setBulkActionError('Some clients could not be deleted.');
    }
  };

  const [cdLoading, setCdLoading] = useState(false);
  const [cdError, setCdError] = useState<string | null>(null);
  const [charitableDonations, setCharitableDonations] = useState<CharitableDonation[]>([]);
  const currentYear = new Date().getFullYear();

  // Load Charitable Donations for current year
  const loadCharitableDonations = async () => {
    setCdLoading(true);
    setCdError(null);
    try {
      const cds = await getAllCharitableDonationsByYear(currentYear);
      setCharitableDonations(cds);
    } catch (err) {
      setCdError('Failed to load Charitable Donations.');
    } finally {
      setCdLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'charitableDonations') {
      loadCharitableDonations();
    }
  }, [activeTab]);

  // Handle status/final amount update
  const handleCDUpdate = async (id: string, status: CharitableDonation['status'], finalAmount?: number) => {
    setCdLoading(true);
    setCdError(null);
    try {
      const updated = await updateCharitableDonationStatus(id, status, finalAmount);
      if (updated) {
        setCharitableDonations(prev => prev.map(cd => cd.id === id ? updated : cd));
        await sendNotification({
          userId: updated.advisorId,
          message: `Charitable Donation for ${updated.year} (${updated.clientId}) status updated to ${updated.status}${finalAmount ? `, Final Amount: $${finalAmount.toLocaleString()}` : ''}`,
          type: 'info',
          read: false,
          createdAt: new Date().toISOString(),
        });
        toast.success('Charitable Donation updated.');
      }
    } catch (err) {
      setCdError('Failed to update Charitable Donation.');
    } finally {
      setCdLoading(false);
    }
  };

  // All state and hooks must be inside this function!
  const [selectedAdvisorIds, setSelectedAdvisorIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [bulkActionError, setBulkActionError] = useState<string | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  // Move all helper functions that use these state variables here, after the state declarations
  // ...
  // Example:
  // const handleBulkAdvisorDelete = async () => { ... }
  // const handleBulkGroupDelete = async () => { ... }
  // const handleBulkClientDelete = async () => { ... }
  // const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { ... }
  // ...

  // New layout: sidebar + main content
  return (
    <UserProvider>
      <div className="flex min-h-screen">
        <Sidebar onCollapse={() => {}} />
        <main className="flex-1 p-8 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </UserProvider>
  );
}