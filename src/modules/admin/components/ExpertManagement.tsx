import React, { useState, useEffect } from 'react';
import { Plus, Edit, User, Mail, Phone, Building, Star, AlertCircle, ArrowLeft } from 'lucide-react';
import { Expert, CreateExpertForm } from '../../../types/commission';
import { commissionService } from '../../shared/services/commissionService';
import { useNavigate } from 'react-router-dom';

const ExpertManagement: React.FC = () => {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingExpert, setEditingExpert] = useState<Expert | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExperts();
  }, []);

  const loadExperts = async () => {
    setLoading(true);
    try {
      const data = await commissionService.getExperts(true); // Include inactive
      setExperts(data);
      setIsDemoMode(false);
    } catch (error) {
      console.error('Error loading experts:', error);
      // Provide mock data when database tables don't exist yet
      const mockExperts: Expert[] = [
        {
          id: '1',
          name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@taxexperts.com',
          phone: '(555) 123-4567',
          company: 'Johnson Tax Consulting',
          specialties: ['R&D Credits', 'Cost Segregation', 'Section 179'],
          max_capacity: 5,
          current_workload: 3,
          hourly_rate: 150,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Prof. Michael Chen',
          email: 'mchen@university.edu',
          phone: '(555) 234-5678',
          company: 'University Tax Research',
          specialties: ['R&D Credits', 'Academic Research'],
          max_capacity: 4,
          current_workload: 4,
          hourly_rate: 200,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Dr. Emily Rodriguez',
          email: 'emily.rodriguez@strategictax.com',
          phone: '(555) 345-6789',
          company: 'Strategic Tax Solutions',
          specialties: ['Cost Segregation', 'Section 179', 'Bonus Depreciation'],
          max_capacity: 6,
          current_workload: 2,
          hourly_rate: 175,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '4',
          name: 'James Wilson',
          email: 'jwilson@taxpartners.com',
          phone: '(555) 456-7890',
          company: 'Tax Partners Group',
          specialties: ['R&D Credits', 'Manufacturing'],
          max_capacity: 3,
          current_workload: 0,
          hourly_rate: 125,
          is_active: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      setExperts(mockExperts);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpert = async (expertData: CreateExpertForm) => {
    try {
      await commissionService.createExpert(expertData);
      setShowCreateModal(false);
      loadExperts();
    } catch (error) {
      console.error('Error creating expert:', error);
      // Show user-friendly error message
      if (error instanceof Error && error.message.includes('Database table does not exist')) {
        alert('Database tables need to be created first. Please run the migration to enable expert creation.');
      } else {
        alert('Error creating expert. Please try again.');
      }
      // Don't close the modal if there was an error, let user try again
    }
  };

  const getUtilizationColor = (rate: number) => {
    if (rate >= 90) return 'text-red-600 bg-red-100';
    if (rate >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getSpecialtyBadge = (specialty: string) => (
    <span key={specialty} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1 mb-1">
      {specialty}
    </span>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Database Status Notification */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              {isDemoMode ? 'Demo Mode Active' : 'Database Connected'}
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              {isDemoMode 
                ? 'Showing demo data. Expert management tables need to be created. Run the database migration to enable full functionality.'
                : 'Database is connected and working properly.'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin')}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expert Management</h1>
            <p className="text-sm text-gray-600">Manage tax experts and their assignments</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={isDemoMode}
          className={`flex items-center space-x-2 ${
            isDemoMode 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'btn-primary'
          }`}
          title={isDemoMode ? 'Database migration required to add experts' : 'Add new expert'}
        >
          <Plus className="h-5 w-5" />
          <span>{isDemoMode ? 'Add Expert (Demo)' : 'Add Expert'}</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card-professional p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Experts</p>
              <p className="text-2xl font-bold text-gray-900">{experts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="card-professional p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Star className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Experts</p>
              <p className="text-2xl font-bold text-gray-900">
                {experts.filter(e => e.is_active).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-professional p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">High Utilization</p>
              <p className="text-2xl font-bold text-gray-900">
                {experts.filter(e => (e.current_workload / e.max_capacity) >= 0.8).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-professional p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Building className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(experts.reduce((sum, e) => sum + e.max_capacity, 0) / experts.length || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Experts List */}
      <div className="card-professional">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expert
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workload
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {experts.map((expert) => {
                const utilizationRate = expert.max_capacity > 0 ? (expert.current_workload / expert.max_capacity) * 100 : 0;
                
                return (
                  <tr key={expert.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{expert.name}</div>
                          {expert.company && (
                            <div className="text-sm text-gray-500">{expert.company}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center mb-1">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          {expert.email}
                        </div>
                        {expert.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 text-gray-400 mr-2" />
                            {expert.phone}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-wrap">
                        {expert.specialties.map(specialty => getSpecialtyBadge(specialty))}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {expert.current_workload} / {expert.max_capacity}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${getUtilizationColor(utilizationRate).split(' ')[1]}`}
                          style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                        ></div>
                      </div>
                      <div className={`text-xs mt-1 px-2 py-1 rounded-full ${getUtilizationColor(utilizationRate)}`}>
                        {utilizationRate.toFixed(1)}%
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        expert.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {expert.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingExpert(expert)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Expert Modal */}
      {showCreateModal && (
        <CreateExpertModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateExpert}
        />
      )}

      {/* Edit Expert Modal */}
      {editingExpert && (
        <EditExpertModal
          expert={editingExpert}
          onClose={() => setEditingExpert(null)}
          onUpdate={loadExperts}
        />
      )}
    </div>
  );
};

// Create Expert Modal Component
const CreateExpertModal: React.FC<{
  onClose: () => void;
  onCreate: (data: CreateExpertForm) => void;
}> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState<CreateExpertForm>({
    name: '',
    email: '',
    phone: '',
    company: '',
    specialties: [],
    max_capacity: 10,
    commission_rate: 0.1,
    notes: '',
  });

  const [specialtyInput, setSpecialtyInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  const addSpecialty = () => {
    if (specialtyInput.trim() && !formData.specialties.includes(specialtyInput.trim())) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialtyInput.trim()]
      });
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (specialty: string) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(s => s !== specialty)
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Add New Expert</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialties
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={specialtyInput}
                onChange={(e) => setSpecialtyInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                placeholder="Add specialty..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addSpecialty}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.specialties.map(specialty => (
                <span
                  key={specialty}
                  className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {specialty}
                  <button
                    type="button"
                    onClick={() => removeSpecialty(specialty)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Capacity
              </label>
              <input
                type="number"
                min="1"
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.commission_rate}
                onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Expert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Expert Modal (simplified - would be similar to create)
const EditExpertModal: React.FC<{
  expert: Expert;
  onClose: () => void;
  onUpdate: () => void;
}> = ({ expert, onClose, onUpdate }) => {
  // Implementation would be similar to CreateExpertModal but with update logic
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Edit Expert</h2>
        <p className="text-gray-600 mb-4">Editing {expert.name}</p>
        <p className="text-sm text-gray-500 mb-6">Full edit functionality would be implemented here.</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpertManagement; 