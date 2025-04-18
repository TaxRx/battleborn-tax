import React, { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { useUserStore } from '../store/userStore';
import { useAdminStore } from '../store/adminStore';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { Users, FileText, Bell, Download, RefreshCw, Settings, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

function generateRandomPassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

export default function AdminDashboard() {
  const { user, setUser } = useUserStore();
  const { fees, setFees } = useAdminStore();
  const { subscriptions, setSubscriptionStatus } = useSubscriptionStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionFee, setTransactionFee] = useState(fees.transactionFee);
  const [serviceFee, setServiceFee] = useState(fees.serviceFee);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate fetching users
    setUsers([
      {
        id: '1',
        fullName: 'John Doe',
        email: 'john@example.com',
        password: '********',
        subscription: 'active'
      },
      {
        id: '2',
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        password: '********',
        subscription: 'inactive'
      }
    ]);
  }, []);

  if (!user?.isAdmin) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    const csvContent = [
      ['Full Name', 'Email'],
      ...users.map(user => [user.fullName, user.email])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleLoginAsUser = (userId: string) => {
    const selectedUser = users.find(u => u.id === userId);
    if (selectedUser) {
      setUser({
        ...selectedUser,
        isAdmin: false
      });
    }
  };

  const handleResetPassword = (userId: string) => {
    const newPassword = generateRandomPassword();
    setUsers(users.map(u => 
      u.id === userId ? { ...u, password: newPassword } : u
    ));
    alert(`New password for user: ${newPassword}`);
  };

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
    setUsers(users.map(u => 
      u.id === userId ? { ...u, subscription: status } : u
    ));
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List className="flex space-x-1 border-b mb-8">
            <Tabs.Trigger
              value="dashboard"
              className={`px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === 'dashboard' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'}`}
            >
              Dashboard
            </Tabs.Trigger>
            <Tabs.Trigger
              value="users"
              className={`px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === 'users' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'}`}
            >
              Users
            </Tabs.Trigger>
            <Tabs.Trigger
              value="leads"
              className={`px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === 'leads' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'}`}
            >
              Leads
            </Tabs.Trigger>
            <Tabs.Trigger
              value="management"
              className={`px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === 'management' 
                  ? 'border-b-2 border-blue-600 text-blue-600' 
                  : 'text-gray-600 hover:text-gray-900'}`}
            >
              Management
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="dashboard">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h2 className="text-lg font-semibold">Total Users</h2>
                  </div>
                  <div className="text-3xl font-bold">{users.length}</div>
                  <p className="text-sm text-gray-600 mt-1">Active accounts</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <FileText className="h-6 w-6 text-green-600" />
                    <h2 className="text-lg font-semibold">Calculations</h2>
                  </div>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-sm text-gray-600 mt-1">Total calculations</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Bell className="h-6 w-6 text-purple-600" />
                    <h2 className="text-lg font-semibold">Notifications</h2>
                  </div>
                  <div className="text-3xl font-bold">0</div>
                  <p className="text-sm text-gray-600 mt-1">Pending alerts</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  <button
                    onClick={handleResetAdminPassword}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reset My Password
                  </button>
                </div>
                <p className="text-gray-600">No recent activity to display.</p>
              </div>
            </motion.div>
          </Tabs.Content>

          <Tabs.Content value="users">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">User Management</h2>
                <button
                  onClick={handleExportCSV}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={16} />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Full Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Password
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.fullName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono">
                          {user.password}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.subscription === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.subscription}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => handleLoginAsUser(user.id)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Log In as User
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </Tabs.Content>

          <Tabs.Content value="leads">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">Lead Management</h2>
                <button
                  onClick={() => navigate('/leads')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Inbox size={16} />
                  <span>View All Leads</span>
                </button>
              </div>

              <p className="text-gray-600">
                Access and manage all leads from the charitable donation calculator.
                Click "View All Leads" to see the full list and details.
              </p>
            </motion.div>
          </Tabs.Content>

          <Tabs.Content value="management">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6">Fee Management</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transaction Fee (%)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={transactionFee}
                        onChange={(e) => setTransactionFee(parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service Fee ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={serviceFee}
                        onChange={(e) => setServiceFee(parseFloat(e.target.value))}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={handleSaveFees}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Save Fees
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold mb-6">Subscription Management</h2>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <h3 className="font-medium">{user.fullName}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={user.subscription === 'active'}
                            onChange={() => handleToggleSubscription(
                              user.id,
                              user.subscription === 'active' ? 'inactive' : 'active'
                            )}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}