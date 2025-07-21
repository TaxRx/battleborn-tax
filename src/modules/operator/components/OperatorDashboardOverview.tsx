// Operator Dashboard Overview - Main dashboard overview component
// File: OperatorDashboardOverview.tsx
// Purpose: Dashboard overview with stats and quick actions for operators

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Cog, 
  UserCheck, 
  Building, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import OperatorToolService from '../services/operatorToolService';

const OperatorDashboardOverview: React.FC = () => {
  const { user } = useUser();
  const [toolSummary, setToolSummary] = useState({
    totalTools: 0,
    activeTools: 0,
    expiredTools: 0,
    expiringSoon: 0,
    recentlyUsed: 0
  });
  const [loading, setLoading] = useState(true);

  const operatorToolService = OperatorToolService.getInstance();

  useEffect(() => {
    if (user?.profile?.account_id) {
      loadDashboardData();
    }
  }, [user?.profile?.account_id]);

  const loadDashboardData = async () => {
    if (!user?.profile?.account_id) return;

    try {
      setLoading(true);
      const summary = await operatorToolService.getToolAccessSummary(user.profile.account_id);
      setToolSummary(summary);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="animate-pulse">
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user?.profile?.full_name || 'Operator'}!
        </h2>
        <p className="text-emerald-100">
          {user?.profile?.account?.name && `Managing ${user.profile.account.name} • `}
          Here's your operator dashboard overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-emerald-100 flex items-center justify-center">
              <Cog className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{toolSummary.totalTools}</h3>
              <p className="text-sm text-gray-500">Total Tools</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{toolSummary.activeTools}</h3>
              <p className="text-sm text-gray-500">Active Tools</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-yellow-100 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{toolSummary.expiringSoon}</h3>
              <p className="text-sm text-gray-500">Expires Soon</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{toolSummary.recentlyUsed}</h3>
              <p className="text-sm text-gray-500">Recently Used</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-emerald-100 flex items-center justify-center">
              <Cog className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">My Tools</h3>
              <p className="text-xs text-gray-500">Access your tools</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Affiliates</h3>
              <p className="text-xs text-gray-500">Manage affiliates</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-purple-100 flex items-center justify-center">
              <Building className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Clients</h3>
              <p className="text-xs text-gray-500">View clients</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-100 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Experts</h3>
              <p className="text-xs text-gray-500">Manage experts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {toolSummary.expiredTools > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
            <span className="text-red-800">
              You have {toolSummary.expiredTools} expired tool{toolSummary.expiredTools !== 1 ? 's' : ''}.
              Please contact support for renewal.
            </span>
          </div>
        </div>
      )}

      {toolSummary.expiringSoon > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-yellow-800">
              You have {toolSummary.expiringSoon} tool{toolSummary.expiringSoon !== 1 ? 's' : ''} expiring soon.
              Consider renewing to avoid service interruption.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorDashboardOverview;