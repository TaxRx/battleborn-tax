import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import useBusinessStore from '../../store/businessStore';
import { toast } from 'react-toastify';
import { BusinessInfoFormData } from '../../types';
import { 
  BuildingOfficeIcon, 
  DocumentTextIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../utils/styles';

type EntityType = 'sole_proprietorship' | 'partnership' | 'llc' | 'pllc' | 'c_corp' | 's_corp' | 'other';
type NaicsCode = '621210' | '621111' | 'other';

// Entity type options
const entityTypes = [
  { value: 'sole_proprietorship' as EntityType, label: 'Sole Proprietorship' },
  { value: 'partnership' as EntityType, label: 'Partnership' },
  { value: 'llc' as EntityType, label: 'Limited Liability Company (LLC)' },
  { value: 'pllc' as EntityType, label: 'Professional Limited Liability Company (PLLC)' },
  { value: 'c_corp' as EntityType, label: 'C Corporation' },
  { value: 's_corp' as EntityType, label: 'S Corporation' },
];

// NAICS code options
const naicsCodes = [
  { value: '621210' as NaicsCode, label: 'Dental Office (621210)' },
  { value: '621111' as NaicsCode, label: 'Medical Office (621111)' },
];

// US States
const states = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// Sample categories, areas, and focuses from API
// In a real implementation, these would be fetched from the API
interface FormOption {
  value: string;
  label: string;
}

const categories: FormOption[] = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'software', label: 'Software Development' },
];

interface AreaMapping {
  [key: string]: FormOption[];
}

const areas: AreaMapping = {
  healthcare: [
    { value: 'medical_innovations', label: 'Medical Innovations' },
    { value: 'dentistry_innovations', label: 'Dentistry Innovations' },
  ],
  software: [
    { value: 'web_development', label: 'Web Development' },
    { value: 'mobile_development', label: 'Mobile Development' },
  ],
};

interface FocusMapping {
  [key: string]: FormOption[];
}

const focuses: FocusMapping = {
  medical_innovations: [
    { value: 'aesthetic_treatments', label: 'Aesthetic Treatments' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'health_wellness', label: 'Health & Wellness' },
  ],
  dentistry_innovations: [
    { value: 'orthodontics', label: 'Orthodontics' },
    { value: 'endodontics', label: 'Endodontics' },
  ],
};

interface FormData {
  businessName: string;
  businessDBA: string;
  ein: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  yearStarted: number;
  entityType: EntityType;
  category: string;
  area: string;
  focus: string;
  naicsCode: NaicsCode;
  practiceType: string;
  specialty: string;
  website: string;
}

type BusinessInfoTab = 'general' | 'historical';

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="font-['DM_Serif_Display'] text-2xl text-gray-900 mb-6">{children}</h2>
);

const BusinessInfo = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  
  // Get business info from store
  const businessStore = useBusinessStore();
  const { 
    businessName,
    businessDBA,
    ein,
    address,
    city,
    state,
    zipCode,
    yearStarted,
    entityType,
    category,
    area,
    focus,
    naicsCode,
    practiceType,
    specialty,
    website,
    setBusinessInfo,
    generateAvailableYears,
    setQreTotal,
    addOwner: storeAddOwner,
    removeOwner: storeRemoveOwner,
    updateOwner,
    updateName,
    updateEIN,
    updateYearStarted,
    updateState,
    updateAddress,
    updateContactName,
    updateContactEmail,
    updatePhone,
    historicalData,
    updateHistoricalData
  } = businessStore;

  // Local state for form data
  const [formData, setFormData] = useState<BusinessInfoFormData>({
    businessName: '',
    businessDBA: '',
    ein: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    yearStarted: new Date().getFullYear(),
    entityType: 'llc',
    category: '',
    area: '',
    focus: '',
    naicsCode: '621210',
    practiceType: '',
    specialty: '',
    website: '',
    contactName: '',
    contactEmail: ''
  });

  // Update local state when store changes
  useEffect(() => {
    setFormData({
      businessName,
      businessDBA,
      ein,
      address,
      city,
      state,
      zipCode,
      phone: businessStore.phone || '',
      yearStarted,
      entityType,
      category,
      area,
      focus,
      naicsCode,
      practiceType,
      specialty,
      website,
      contactName: businessStore.contactName || '',
      contactEmail: businessStore.contactEmail || ''
    });
  }, [businessName, businessDBA, ein, address, city, state, zipCode, yearStarted, 
      entityType, category, area, focus, naicsCode, practiceType, specialty, website,
      businessStore.phone, businessStore.contactName, businessStore.contactEmail]);

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number = value;

    if (type === 'number') {
      parsedValue = value === '' ? 0 : parseInt(value, 10);
    }

    setFormData((prev: BusinessInfoFormData) => ({
      ...prev,
      [name]: parsedValue
    }));

    // Update store
    setBusinessInfo({
      ...formData,
      [name]: parsedValue
    });
    
    // Show notification
    toast.success('Business information updated');
    
    // Regenerate available years if year started changes
    if (name === 'yearStarted') {
      generateAvailableYears();
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData((prev: BusinessInfoFormData) => ({
      ...prev,
      [name]: value
    }));

    // Update store
    setBusinessInfo({
      ...formData,
      [name]: value
    });
    
    // Show notification
    toast.success('Business information updated');
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusinessInfo(formData);
    generateAvailableYears();
    toast.success('Business information saved');
    navigate('/client/document-upload');
  };

  const [selectedTab, setSelectedTab] = useState<BusinessInfoTab>('general');

  // Get the earliest possible year (8 years ago or business start year)
  const earliestPossibleYear = Math.max(currentYear - 8, yearStarted);
  const historicalYears = Array.from(
    { length: currentYear - earliestPossibleYear },
    (_, i) => currentYear - i - 1
  );

  // Add state for historical data
  const [historicalDataState, setHistoricalDataState] = useState<{
    [year: number]: {
      qre: number;
      grossReceipts: number;
    };
  }>(historicalData || {});

  // Format currency input
  const formatCurrency = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Parse the numeric value
    const parsedValue = parseFloat(numericValue);
    
    // Return empty string if not a valid number
    if (isNaN(parsedValue)) return '';
    
    // Round to nearest dollar and format with commas
    return `$${Math.round(parsedValue).toLocaleString()}`;
  };

  // Parse currency string to number
  const parseCurrency = (value: string): number => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/[^0-9.]/g, '');
    
    // Parse the numeric value
    const parsedValue = parseFloat(numericValue);
    
    // Return 0 if not a valid number
    if (isNaN(parsedValue)) return 0;
    
    // Round to nearest dollar
    return Math.round(parsedValue);
  };

  // Update historical data input handling
  const handleHistoricalDataChange = (year: number, field: keyof YearData, value: string) => {
    const numericValue = parseCurrency(value);
    
    setHistoricalDataState((prev) => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: numericValue
      }
    }));
    
    // Update store
    const updatedData = {
      ...historicalDataState,
      [year]: {
        ...historicalDataState[year],
        [field]: numericValue
      }
    };
    updateHistoricalData(updatedData);
  };

  const tabs = [
    { id: 'general', name: 'General Information', icon: BuildingOfficeIcon },
    { id: 'historical', name: 'Historical Data', icon: ChartBarIcon }
  ] as const;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-['DM_Serif_Display'] text-4xl text-gray-900">Business Information</h1>
            <p className="mt-2 text-lg text-gray-500">
              Enter your business details and historical R&D data
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/client/staff-review')}
            icon={<ArrowRightIcon className="h-5 w-5" />}
            iconPosition="right"
          >
            Continue
          </Button>
        </div>
      </div>
      
      <Card className="p-0">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={cn(
                    'group relative min-w-0 flex-1 overflow-hidden py-6 px-6 text-center text-lg font-medium hover:bg-gray-50 focus:z-10 focus:outline-none',
                    selectedTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
                  )}
                  aria-current={selectedTab === tab.id ? 'page' : undefined}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8">
          {selectedTab === 'general' && (
            <div className="space-y-8">
              <div>
                <SectionTitle>Company Details</SectionTitle>
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Business Name"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter business name"
                  />
                  <Input
                    label="EIN"
                    name="ein"
                    value={formData.ein}
                    onChange={handleInputChange}
                    placeholder="XX-XXXXXXX"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                    <select
                      name="entityType"
                      value={formData.entityType}
                      onChange={handleSelectChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      {entityTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleSelectChange}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    >
                      <option value="">Select a state</option>
                      {states.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input
                    type="number"
                    label="Year Started"
                    name="yearStarted"
                    value={formData.yearStarted}
                    onChange={handleInputChange}
                    placeholder="Enter year"
                    min={1900}
                    max={new Date().getFullYear()}
                  />
                  <Input
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                  />
                </div>
              </div>

              <div>
                <SectionTitle>Contact Information</SectionTitle>
                <div className="grid grid-cols-2 gap-6">
                  <Input
                    label="Contact Name"
                    name="contactName"
                    value={formData.contactName}
                    onChange={(e) => updateContactName(e.target.value)}
                    placeholder="Enter contact name"
                  />
                  <Input
                    label="Contact Email"
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={(e) => updateContactEmail(e.target.value)}
                    placeholder="Enter email"
                  />
                  <Input
                    label="Phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => updatePhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                  <Input
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter business address"
                  />
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'historical' && (
            <div className="space-y-8">
              <SectionTitle>Historical R&D Data</SectionTitle>
              <p className="text-gray-500 mb-6">
                Enter your historical Qualified Research Expenses (QRE) and gross receipts for previous years.
                This information will be used to calculate your credit using both the Regular and Alternative Simplified Credit (ASC) methods.
              </p>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4 text-gray-400" />
                          <span>Year</span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                          <span>Qualified Research Expenses</span>
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                          <span>Gross Receipts (Optional)</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historicalYears.map(year => (
                      <tr key={year} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{year}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="text"
                            value={formatCurrency(historicalDataState[year]?.qre?.toString() || '')}
                            onChange={(e) => handleHistoricalDataChange(year, 'qre', e.target.value)}
                            placeholder="Enter QRE amount"
                            className="w-48"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Input
                            type="text"
                            value={formatCurrency(historicalDataState[year]?.grossReceipts?.toString() || '')}
                            onChange={(e) => handleHistoricalDataChange(year, 'grossReceipts', e.target.value)}
                            placeholder="Enter gross receipts"
                            className="w-48"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default BusinessInfo;