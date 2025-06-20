import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  BeakerIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { cn } from '../../utils/styles';
import type { YearData } from '../../types/calculations';

interface CategorySummary {
  name: string;
  amount: number;
  status: 'completed' | 'in_progress' | 'not_started';
  items: number;
  icon: React.ReactNode;
}

const TaxYearDetails: React.FC = () => {
  const { year } = useParams<{ year: string }>();
  const navigate = useNavigate();
  
  // Mock data - replace with real data from your state management
  const yearData: YearData = {
    year: parseInt(year || new Date().getFullYear().toString()),
    grossReceipts: 5000000,
    qreAmount: 750000
  };
  
  const categories: CategorySummary[] = [
    {
      name: 'Qualified Research Activities',
      amount: 0,
      status: 'in_progress',
      items: 3,
      icon: <BeakerIcon className="h-6 w-6" />
    },
    {
      name: 'Employee Wages',
      amount: 450000,
      status: 'completed',
      items: 12,
      icon: <UserGroupIcon className="h-6 w-6" />
    },
    {
      name: 'Contractor Payments',
      amount: 195000,
      status: 'in_progress',
      items: 5,
      icon: <ClipboardDocumentListIcon className="h-6 w-6" />
    },
    {
      name: 'Supplies & Materials',
      amount: 105000,
      status: 'not_started',
      items: 0,
      icon: <DocumentTextIcon className="h-6 w-6" />
    }
  ];
  
  const getStatusColor = (status: CategorySummary['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-50';
      case 'in_progress':
        return 'text-blue-500 bg-blue-50';
      case 'not_started':
        return 'text-gray-500 bg-gray-50';
    }
  };
  
  const getStatusText = (status: CategorySummary['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'not_started':
        return 'Not Started';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/client/dashboard')}
            icon={<ArrowLeftIcon className="h-4 w-4" />}
          >
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-semibold text-gray-900">
            Tax Year {year} Details
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            Save Progress
          </Button>
          <Button variant="primary" size="sm">
            Submit for Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Credit Estimation"
          className="col-span-2"
          accentColor="blue"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Federal Credit (ASC)</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(yearData.qreAmount * 0.14 * 0.79).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">State Credit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(yearData.qreAmount * 0.14 * 0.21).toLocaleString()}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Total QRE Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ${yearData.qreAmount.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        {categories.map((category) => (
          <Card
            key={category.name}
            className="relative overflow-hidden"
            accentColor="blue"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  getStatusColor(category.status)
                )}>
                  {category.icon}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {category.items} items • {getStatusText(category.status)}
                  </p>
                </div>
              </div>
              <p className="text-xl font-bold text-gray-900">
                ${category.amount.toLocaleString()}
              </p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/client/tax-year/${year}/${category.name.toLowerCase().replace(/\s+/g, '-')}`)}
              >
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TaxYearDetails; 