import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UsersIcon, 
  DocumentTextIcon, 
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  FolderIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Mock data for admin dashboard
  const adminName = "Alex Rodriguez";
  const totalClients = 24;
  const pendingReviews = 8;
  const completedReviews = 16;
  const flaggedItems = 3;
  const totalBusinesses = 12; // Mock data, replace with real count if available
  
  // Mock client list data
  const recentClients = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      businessName: 'Johnson Dental Care',
      practiceType: 'Dentistry',
      status: 'active',
      progress: 70,
      estimatedCredit: 57250
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      businessName: 'Chen Orthodontics',
      practiceType: 'Orthodontics',
      status: 'review',
      progress: 40,
      estimatedCredit: 36800
    },
    {
      id: '3',
      name: 'Dr. Emily Wilson',
      businessName: 'Wilson Pediatric Dentistry',
      practiceType: 'Dentistry',
      status: 'pending',
      progress: 20,
      estimatedCredit: 43500
    },
    {
      id: '4',
      name: 'Dr. Robert Garcia',
      businessName: 'Garcia Medical Center',
      practiceType: 'Family Medicine',
      status: 'active',
      progress: 90,
      estimatedCredit: 82400
    }
  ];
  
  // Mock anomalies that need review
  const anomalies = [
    {
      id: '1',
      clientName: 'Dr. Michael Chen',
      issue: 'Unusually high wage allocation',
      severity: 'high',
      details: 'Staff allocation exceeds 100% for multiple employees'
    },
    {
      id: '2',
      clientName: 'Dr. Sarah Johnson',
      issue: 'Missing gross receipts for 2022',
      severity: 'medium',
      details: 'Required financial information is incomplete'
    },
    {
      id: '3',
      clientName: 'Dr. Emily Wilson',
      issue: 'Document verification needed',
      severity: 'low',
      details: 'Uploaded payroll report format is non-standard'
    }
  ];
  
  const recentChangelog = [
    { id: 1, action: 'link_business', user: 'Admin', business: 'Johnson Dental Care', date: '2024-06-01 10:00' },
    { id: 2, action: 'update_employee', user: 'Admin', business: 'Chen Orthodontics', date: '2024-06-01 09:45' },
    { id: 3, action: 'delete_contractor_expense', user: 'Admin', business: 'Wilson Pediatric Dentistry', date: '2024-05-31 16:20' },
  ];
  
  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: "bg-green-100 text-green-800",
      review: "bg-yellow-100 text-yellow-800",
      pending: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800"
    };
    
    const statusText = {
      active: "Active",
      review: "Needs Review",
      pending: "Pending",
      completed: "Completed"
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {statusText[status as keyof typeof statusText]}
      </span>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 sm:px-8 sm:py-6 bg-blue-600">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
              <p className="mt-1 text-blue-100">
                Welcome back, {adminName}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-blue-100 flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{totalClients}</h3>
              <p className="text-sm text-gray-500">Total Clients</p>
            </div>
          </div>
        </Card>
        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-purple-100 flex items-center justify-center">
              <FolderIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{totalBusinesses}</h3>
              <p className="text-sm text-gray-500">Total Businesses</p>
            </div>
          </div>
        </Card>
        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-yellow-100 flex items-center justify-center">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{pendingReviews}</h3>
              <p className="text-sm text-gray-500">Pending Reviews</p>
            </div>
          </div>
        </Card>
        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-green-100 flex items-center justify-center">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{completedReviews}</h3>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
          </div>
        </Card>
        <Card className="col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-md bg-red-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{flaggedItems}</h3>
              <p className="text-sm text-gray-500">Flagged Items</p>
            </div>
          </div>
        </Card>
      </div>
      
      <div className="flex flex-wrap gap-4 mt-4">
        <Button variant="outline" icon={<DocumentDuplicateIcon className="h-5 w-5" />} onClick={() => navigate('/admin/changelog')}>
          View Changelog
        </Button>
        <Button variant="outline" icon={<FolderIcon className="h-5 w-5" />} onClick={() => navigate('/admin/business-linking')}>
          Business Linking
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          title="Recent Clients" 
          className="col-span-1 lg:col-span-2"
          headerAction={
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => navigate('/admin/clients')}
            >
              View all
            </Button>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Practice Type
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Credit
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentClients.map((client) => (
                  <tr 
                    key={client.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => navigate(`/admin/clients/${client.id}`)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.businessName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.practiceType}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(client.status)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${client.progress}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">{client.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${client.estimatedCredit.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        
        <Card 
          title="Anomalies Requiring Review" 
          className="col-span-1"
        >
          <div className="space-y-4">
            {anomalies.map((anomaly) => (
              <div 
                key={anomaly.id}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={() => navigate(`/admin/clients/${anomaly.id}`)}
              >
                <div className="flex items-start">
                  <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                    anomaly.severity === 'high' ? 'bg-red-100' : 
                    anomaly.severity === 'medium' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    <ExclamationTriangleIcon className={`h-4 w-4 ${
                      anomaly.severity === 'high' ? 'text-red-600' : 
                      anomaly.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{anomaly.issue}</p>
                    <p className="text-xs text-gray-500">{anomaly.clientName}</p>
                    <p className="mt-1 text-xs text-gray-600">{anomaly.details}</p>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/admin/clients')}
              >
                View All Issues
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      <Card 
        title="Credit Summary" 
        subtitle="Total credits by practice type"
      >
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">$427,500</p>
              <p className="text-sm text-gray-500">Dentistry</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">$286,200</p>
              <p className="text-sm text-gray-500">Orthodontics</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100">
                <ChartBarIcon className="h-8 w-8 text-purple-600" />
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">$198,350</p>
              <p className="text-sm text-gray-500">Family Medicine</p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100">
                <ChartBarIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <p className="mt-2 text-lg font-bold text-gray-900">$143,700</p>
              <p className="text-sm text-gray-500">Other</p>
            </div>
          </div>
        </div>
      </Card>
      
      <Card title="Recent Changelog Actions" className="col-span-1">
        <ul>
          {recentChangelog.map(entry => (
            <li key={entry.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <span className="text-sm text-gray-700">{entry.action}</span>
              <span className="text-xs text-gray-500">{entry.business}</span>
              <span className="text-xs text-gray-400">{entry.date}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default AdminDashboard;