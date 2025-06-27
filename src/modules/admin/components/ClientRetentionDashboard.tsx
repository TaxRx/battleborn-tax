import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Phone, 
  Mail, 
  User, 
  TrendingDown, 
  CheckCircle, 
  XCircle,
  Calendar,
  MessageSquare,
  Target,
  Users,
  AlertCircle,
  Eye,
  Edit,
  Plus
} from 'lucide-react';
import { 
  ClientProfile, 
  ClientAlert, 
  ClientCommunication, 
  ClientStage, 
  EnhancedProposal 
} from '../../../types/commission';
import { commissionService } from '../../shared/services/commissionService';

const ClientRetentionDashboard: React.FC = () => {
  const [atRiskClients, setAtRiskClients] = useState<ClientProfile[]>([]);
  const [clientAlerts, setClientAlerts] = useState<ClientAlert[]>([]);
  const [enhancedProposals, setEnhancedProposals] = useState<EnhancedProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [showCommunicationModal, setShowCommunicationModal] = useState(false);

  useEffect(() => {
    loadRetentionData();
  }, []);

  const loadRetentionData = async () => {
    setLoading(true);
    try {
      const [clients, alerts, proposals] = await Promise.all([
        commissionService.getClientsAtRisk(),
        commissionService.getClientAlerts(),
        commissionService.getEnhancedProposals()
      ]);

      setAtRiskClients(clients);
      setClientAlerts(alerts);
      setEnhancedProposals(proposals);
    } catch (error) {
      console.error('Error loading retention data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStageColor = (stage: ClientStage) => {
    const colors = {
      'initial_contact': 'bg-blue-100 text-blue-800',
      'tax_analysis_complete': 'bg-green-100 text-green-800',
      'proposal_created': 'bg-purple-100 text-purple-800',
      'proposal_submitted': 'bg-yellow-100 text-yellow-800',
      'admin_review': 'bg-orange-100 text-orange-800',
      'expert_assigned': 'bg-indigo-100 text-indigo-800',
      'expert_contacted': 'bg-teal-100 text-teal-800',
      'implementation_active': 'bg-emerald-100 text-emerald-800',
      'completed': 'bg-green-100 text-green-800',
      'lost_to_follow_up': 'bg-red-100 text-red-800',
      'declined_services': 'bg-gray-100 text-gray-800',
      'competitor_lost': 'bg-red-100 text-red-800'
    };
    return colors[stage] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      'low': 'bg-blue-100 text-blue-800 border-blue-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'urgent': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  const handleLogCommunication = (client: ClientProfile) => {
    setSelectedClient(client);
    setShowCommunicationModal(true);
  };

  const handleUpdateStage = async (clientId: string, newStage: ClientStage) => {
    try {
      await commissionService.updateClientStage(clientId, newStage, `Stage updated to ${newStage}`);
      loadRetentionData();
    } catch (error) {
      console.error('Error updating client stage:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="card-financial animate-pulse p-6">
          <div className="h-6 bg-primary-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-primary-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Client Retention Dashboard</h1>
          <p className="text-sm text-primary-600">Monitor and prevent client loss in the referral process</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add Manual Alert
        </button>
      </div>

      {/* Critical Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card-professional bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Critical Alerts</p>
                <p className="text-3xl font-bold">{clientAlerts.filter(a => a.severity === 'urgent').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </div>
        </div>

        <div className="card-professional bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">At Risk Clients</p>
                <p className="text-3xl font-bold">{atRiskClients.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-200" />
            </div>
          </div>
        </div>

        <div className="card-professional bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Overdue Follow-ups</p>
                <p className="text-3xl font-bold">{clientAlerts.filter(a => a.alert_type.includes('no_contact')).length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-200" />
            </div>
          </div>
        </div>

        <div className="card-professional bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Proposals</p>
                <p className="text-3xl font-bold">{enhancedProposals.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="card-professional">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary-900">Active Client Alerts</h2>
            <span className="text-sm text-primary-600">{clientAlerts.length} active alerts</span>
          </div>

          <div className="space-y-4">
            {clientAlerts.length === 0 ? (
              <div className="text-center py-8 text-primary-500">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-400" />
                <p className="text-lg font-medium">No Active Alerts</p>
                <p className="text-sm">All clients are being properly managed</p>
              </div>
            ) : (
              clientAlerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-5 w-5" />
                        <h3 className="font-semibold">{alert.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{alert.description}</p>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{alert.client?.full_name}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(alert.due_date || '').toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="btn-secondary text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button className="btn-primary text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* At-Risk Clients */}
      <div className="card-professional">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary-900">At-Risk Clients</h2>
            <span className="text-sm text-primary-600">{atRiskClients.length} clients need attention</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {atRiskClients.map((client) => (
              <div key={client.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.full_name}</h3>
                    <p className="text-sm text-gray-600">{client.email}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-red-600 font-medium">
                      Risk Score: {client.engagement_score}/10
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Current Stage:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(client.current_stage)}`}>
                      {client.current_stage.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Contact:</span>
                    <span className="font-medium">{client.days_since_last_contact} days ago</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Assigned Expert:</span>
                    <span className="font-medium">{client.assigned_expert_id || 'Not assigned'}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleLogCommunication(client)}
                    className="btn-primary text-xs flex-1"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Log Contact
                  </button>
                  <button className="btn-secondary text-xs">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </button>
                  <button className="btn-secondary text-xs">
                    <Mail className="h-3 w-3 mr-1" />
                    Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Risk Proposals */}
      <div className="card-professional">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-primary-900">High-Risk Proposals</h2>
            <span className="text-sm text-primary-600">
              {enhancedProposals.filter(p => p.risk_score > 6).length} proposals at risk
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary-200">
                  <th className="text-left py-3 px-4 font-semibold text-primary-900">Client</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-900">Stage</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-900">Days in Stage</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-900">Risk Score</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enhancedProposals
                  .filter(p => p.risk_score > 6)
                  .map((proposal) => (
                    <tr key={proposal.id} className="border-b border-primary-100 hover:bg-primary-25">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-primary-900">
                            {proposal.client_profile?.full_name}
                          </div>
                          <div className="text-sm text-primary-600">
                            {proposal.client_profile?.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(proposal.client_profile?.current_stage || 'initial_contact')}`}>
                          {proposal.client_profile?.current_stage?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-medium">{proposal.days_in_current_stage} days</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                proposal.risk_score > 8 ? 'bg-red-500' : 
                                proposal.risk_score > 6 ? 'bg-orange-500' : 'bg-yellow-500'
                              }`}
                              style={{ width: `${(proposal.risk_score / 10) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{proposal.risk_score}/10</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button className="btn-secondary text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </button>
                          <button className="btn-primary text-xs">
                            <Edit className="h-3 w-3 mr-1" />
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Communication Modal */}
      {showCommunicationModal && selectedClient && (
        <CommunicationModal
          client={selectedClient}
          onClose={() => setShowCommunicationModal(false)}
          onSave={loadRetentionData}
        />
      )}
    </div>
  );
};

interface CommunicationModalProps {
  client: ClientProfile;
  onClose: () => void;
  onSave: () => void;
}

const CommunicationModal: React.FC<CommunicationModalProps> = ({ client, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    communication_type: 'email' as const,
    subject: '',
    summary: '',
    outcome: 'neutral' as const,
    next_action_required: '',
    next_action_due_date: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await commissionService.logClientCommunication({
        client_id: client.id,
        user_id: 'admin-user',
        user_role: 'admin',
        ...formData
      });
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error logging communication:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Log Communication - {client.full_name}</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Communication Type</label>
            <select
              value={formData.communication_type}
              onChange={(e) => setFormData({...formData, communication_type: e.target.value as any})}
              className="form-input"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="meeting">Meeting</option>
              <option value="text">Text</option>
            </select>
          </div>

          <div>
            <label className="form-label">Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="form-input"
              placeholder="Communication subject"
            />
          </div>

          <div>
            <label className="form-label">Summary</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              className="form-input"
              rows={3}
              placeholder="What was discussed?"
              required
            />
          </div>

          <div>
            <label className="form-label">Outcome</label>
            <select
              value={formData.outcome}
              onChange={(e) => setFormData({...formData, outcome: e.target.value as any})}
              className="form-input"
            >
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
              <option value="no_response">No Response</option>
            </select>
          </div>

          <div className="flex space-x-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save Communication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientRetentionDashboard; 