// Operator Tools Page - Shows only tools assigned to the operator
// File: OperatorToolsPage.tsx
// Purpose: Display tools assigned to current operator account from account_tool_access table

import React, { useState, useEffect } from 'react';
import { 
  Cog, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Shield,
  Settings,
  ExternalLink
} from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import OperatorToolService from '../services/operatorToolService';

interface AssignedTool {
  tool_id: string;
  tool_name: string;
  tool_slug: string;
  tool_description: string;
  access_level: string;
  subscription_level: 'trial' | 'basic' | 'premium' | 'enterprise' | 'custom';
  status: 'active' | 'inactive' | 'expired' | 'suspended';
  expires_at: string | null;
  granted_at: string;
  last_accessed_at: string | null;
  is_expired: boolean;
  expires_soon: boolean;
}

const subscriptionLevelColors = {
  trial: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  basic: 'bg-gray-100 text-gray-700 border-gray-200',
  premium: 'bg-blue-100 text-blue-700 border-blue-200',
  enterprise: 'bg-purple-100 text-purple-700 border-purple-200',
  custom: 'bg-green-100 text-green-700 border-green-200'
};

const accessLevelColors = {
  'full': 'bg-emerald-100 text-emerald-700',
  'limited': 'bg-amber-100 text-amber-700',
  'expert': 'bg-indigo-100 text-indigo-700',
  'client': 'bg-cyan-100 text-cyan-700',
  'reporting': 'bg-slate-100 text-slate-700'
};

const OperatorToolsPage: React.FC = () => {
  const { user } = useUser();
  const [tools, setTools] = useState<AssignedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'expires_soon'>('all');

  const operatorToolService = OperatorToolService.getInstance();

  useEffect(() => {
    if (user?.profile?.account_id) {
      loadAssignedTools();
    }
  }, [user?.profile?.account_id, filter]);

  const loadAssignedTools = async () => {
    if (!user?.profile?.account_id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const assignedTools = await operatorToolService.getAssignedTools(user.profile.account_id, filter);
      setTools(assignedTools);
    } catch (err) {
      console.error('Error loading assigned tools:', err);
      setError('Failed to load tools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (tool: AssignedTool) => {
    if (tool.is_expired) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
        </span>
      );
    }
    
    if (tool.expires_soon) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Expires Soon
        </span>
      );
    }
    
    if (tool.status === 'active') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        {tool.status}
      </span>
    );
  };

  const handleToolAccess = (tool: AssignedTool) => {
    // TODO: Navigate to the specific tool or open it
    console.log('Accessing tool:', tool.tool_slug);
    // This could navigate to a tool-specific route or open the tool in a new window
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading your tools...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
        <button
          onClick={loadAssignedTools}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredTools = tools.filter(tool => {
    if (filter === 'all') return true;
    if (filter === 'active') return tool.status === 'active' && !tool.is_expired && !tool.expires_soon;
    if (filter === 'expired') return tool.is_expired;
    if (filter === 'expires_soon') return tool.expires_soon;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-lg">
              <Cog className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tools</h1>
              <p className="text-sm text-gray-600 mt-1">
                Tools and services assigned to your account
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Filter:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Tools</option>
              <option value="active">Active</option>
              <option value="expires_soon">Expires Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Cog className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tools Found</h3>
          <p className="text-gray-500">
            {filter === 'all' 
              ? 'No tools have been assigned to your account yet.'
              : `No ${filter.replace('_', ' ')} tools found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <div key={tool.tool_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.tool_name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{tool.tool_description}</p>
                </div>
                {getStatusBadge(tool)}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Subscription:</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${subscriptionLevelColors[tool.subscription_level]}`}>
                    {tool.subscription_level.charAt(0).toUpperCase() + tool.subscription_level.slice(1)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Access Level:</span>
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${accessLevelColors[tool.access_level] || accessLevelColors.limited}`}>
                    {tool.access_level.charAt(0).toUpperCase() + tool.access_level.slice(1)}
                  </span>
                </div>

                {tool.expires_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Expires:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(tool.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Granted:</span>
                  <span className="text-sm text-gray-900">
                    {new Date(tool.granted_at).toLocaleDateString()}
                  </span>
                </div>

                {tool.last_accessed_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Last Used:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(tool.last_accessed_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleToolAccess(tool)}
                  disabled={tool.is_expired || tool.status !== 'active'}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 border border-transparent rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                >
                  {tool.is_expired ? (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Expired
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Access Tool
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {tools.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-md bg-emerald-100 flex items-center justify-center">
                <Cog className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">{tools.length}</h3>
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
                <h3 className="text-lg font-medium text-gray-900">
                  {tools.filter(t => t.status === 'active' && !t.is_expired && !t.expires_soon).length}
                </h3>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-md bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {tools.filter(t => t.expires_soon).length}
                </h3>
                <p className="text-sm text-gray-500">Expires Soon</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-md bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {tools.filter(t => t.is_expired).length}
                </h3>
                <p className="text-sm text-gray-500">Expired</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorToolsPage;