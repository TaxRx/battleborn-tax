import React, { useState, useEffect } from 'react';
import { RDBusinessService } from '../../../services/rdBusinessService';
import { BusinessSetupData, HistoricalData } from '../../../types/rdTypes';

interface BusinessSetupStepProps {
  business: any;
  selectedYear: any;
  onUpdate: (updates: any) => void;
  onNext: () => void;
  userId?: string;
}

const BusinessSetupStep: React.FC<BusinessSetupStepProps> = ({
  business,
  selectedYear,
  onUpdate,
  onNext,
  userId
}) => {
  const [formData, setFormData] = useState({
    businessName: business?.name || '',
    ein: business?.ein || '',
    entityType: business?.entityType || 'LLC',
    startYear: business?.startYear || '',
    taxYear: selectedYear?.year || new Date().getFullYear(),
    address: business?.address || '',
    city: business?.city || '',
    state: business?.state || '',
    zip: business?.zip || ''
  });

  const [historicalData, setHistoricalData] = useState<HistoricalData[]>(
    business?.historicalData || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [historicalErrors, setHistoricalErrors] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const entityTypes = [
    { value: 'LLC', label: 'Limited Liability Company (LLC)' },
    { value: 'SCORP', label: 'S Corporation' },
    { value: 'CCORP', label: 'C Corporation' },
    { value: 'PARTNERSHIP', label: 'Partnership' },
    { value: 'SOLEPROP', label: 'Sole Proprietorship' },
    { value: 'OTHER', label: 'Other' }
  ];

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Formatting functions
  const formatEIN = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as XX-XXXXXXX
    if (digits.length <= 2) {
      return digits;
    } else {
      return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
    }
  };

  const formatCurrency = (value: string): string => {
    // Remove all non-digits and decimal points
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Parse as number
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return '';
    
    // Round to nearest dollar
    const roundedValue = Math.round(numValue);
    
    // Format with commas
    return roundedValue.toLocaleString('en-US');
  };

  const formatPercentage = (value: string): string => {
    // Remove all non-digits and decimal points
    const cleanValue = value.replace(/[^\d.]/g, '');
    
    // Parse as number
    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) return '';
    
    // Limit to 2 decimal places
    const limitedValue = Math.round(numValue * 100) / 100;
    
    return limitedValue.toString();
  };

  const parseCurrencyToNumber = (value: string): number => {
    // Remove all non-digits
    const cleanValue = value.replace(/[^\d]/g, '');
    return parseInt(cleanValue) || 0;
  };

  const parsePercentageToNumber = (value: string): number => {
    // Parse as number
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  };

  // Generate years for historical data
  const generateHistoricalYears = () => {
    const currentYear = parseInt(formData.taxYear);
    const startYear = parseInt(formData.startYear);
    
    if (!currentYear || !startYear) return [];
    
    const years: number[] = [];
    
    // Start from 8 years ago or business start year, whichever is later
    const startFromYear = Math.max(startYear, currentYear - 8);
    
    for (let year = startFromYear; year < currentYear; year++) {
      years.push(year);
    }
    
    return years;
  };

  // Initialize historical data when start year or tax year changes
  useEffect(() => {
    if (formData.startYear && formData.taxYear) {
      const years = generateHistoricalYears();
      const newHistoricalData: HistoricalData[] = years.map(year => {
        const existing = historicalData.find(h => h.year === year);
        return existing || { year, grossReceipts: 0, qre: 0 };
      });
      setHistoricalData(newHistoricalData);
    }
  }, [formData.startYear, formData.taxYear]);

  // Load existing business data on component mount
  useEffect(() => {
    const loadExistingBusiness = async () => {
      // Always try to load from database first if we have a userId
      if (userId) {
        setIsLoading(true);
        try {
          const existingBusiness = await RDBusinessService.getBusinessByUser(userId);
          if (existingBusiness) {
            console.log('BusinessSetupStep: Loaded business from database:', existingBusiness);
            setFormData(prev => ({
              ...prev,
              businessName: existingBusiness.name || '',
              ein: existingBusiness.ein || '',
              entityType: existingBusiness.entity_type || 'LLC',
              startYear: existingBusiness.start_year?.toString() || '',
              address: existingBusiness.contact_info?.address || '',
              city: existingBusiness.contact_info?.city || '',
              state: existingBusiness.contact_info?.state || '',
              zip: existingBusiness.contact_info?.zip || ''
            }));

            // Load historical data from business_years table
            if (existingBusiness.id && existingBusiness.start_year) {
              // Use historical data from the loaded business object
              if (existingBusiness.rd_business_years && existingBusiness.rd_business_years.length > 0) {
                console.log('BusinessSetupStep: Loading historical data from business object:', existingBusiness.rd_business_years);
                const transformedHistoricalData = existingBusiness.rd_business_years.map((yearData: any) => ({
                  year: yearData.year,
                  grossReceipts: yearData.gross_receipts || 0,
                  qre: yearData.total_qre || 0
                }));
                setHistoricalData(transformedHistoricalData);
              } else {
                // If no historical data exists, generate empty data for the required years
                const currentTaxYear = parseInt(formData.taxYear) || new Date().getFullYear();
                const historicalYears = generateHistoricalYearsForYear(existingBusiness.start_year, currentTaxYear);
                const emptyHistoricalData = historicalYears.map(year => ({
                  year,
                  grossReceipts: 0,
                  qre: 0
                }));
                console.log('BusinessSetupStep: Generated empty historical data:', emptyHistoricalData);
                setHistoricalData(emptyHistoricalData);
              }
            }
          }
        } catch (error) {
          console.error('Error loading existing business:', error);
        } finally {
          setIsLoading(false);
        }
      }

      // If we have business data passed in and no data was loaded from database, use the prop data
      if (business && !userId) {
        console.log('BusinessSetupStep: Using business prop data (no userId):', business);
        setFormData(prev => ({
          ...prev,
          businessName: business.name || '',
          ein: business.ein || '',
          entityType: business.entity_type || 'LLC',
          startYear: business.start_year?.toString() || '',
          address: business.contact_info?.address || '',
          city: business.contact_info?.city || '',
          state: business.contact_info?.state || '',
          zip: business.contact_info?.zip || ''
        }));

        // Load historical data from business_years table if available
        if (business.rd_business_years && business.rd_business_years.length > 0) {
          console.log('BusinessSetupStep: Loading historical data from business prop:', business.rd_business_years);
          const transformedHistoricalData = business.rd_business_years.map((yearData: any) => ({
            year: yearData.year,
            grossReceipts: yearData.gross_receipts || 0,
            qre: yearData.total_qre || 0
          }));
          setHistoricalData(transformedHistoricalData);
        }
      }
    };

    loadExistingBusiness();
  }, [business, userId]);

  // Helper function to generate historical years without depending on formData
  const generateHistoricalYearsForYear = (startYear: number, taxYear: number) => {
    if (!startYear || !taxYear) return [];
    
    const years: number[] = [];
    
    // Start from 8 years ago or business start year, whichever is later
    const startFromYear = Math.max(startYear, taxYear - 8);
    
    for (let year = startFromYear; year < taxYear; year++) {
      years.push(year);
    }
    
    return years;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }

    if (!formData.ein.trim()) {
      newErrors.ein = 'EIN is required';
    } else if (!/^\d{2}-\d{7}$/.test(formData.ein)) {
      newErrors.ein = 'EIN must be in format XX-XXXXXXX';
    }

    if (!formData.startYear) {
      newErrors.startYear = 'Business start year is required';
    } else if (parseInt(formData.startYear) > parseInt(formData.taxYear)) {
      newErrors.startYear = 'Start year cannot be after tax year';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateHistoricalData = () => {
    const newHistoricalErrors: Record<string, Record<string, string>> = {};
    let isValid = true;

    historicalData.forEach((data, index) => {
      const yearErrors: Record<string, string> = {};
      
      if (data.grossReceipts < 0) {
        yearErrors.grossReceipts = 'Gross receipts cannot be negative';
        isValid = false;
      }
      
      if (data.qre < 0) {
        yearErrors.qre = 'QRE cannot be negative';
        isValid = false;
      }

      if (Object.keys(yearErrors).length > 0) {
        newHistoricalErrors[data.year.toString()] = yearErrors;
      }
    });

    setHistoricalErrors(newHistoricalErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !validateHistoricalData()) return;
    if (!userId) {
      setErrors(prev => ({ ...prev, general: 'User ID is required to save data' }));
      return;
    }

    setIsSaving(true);
    try {
      const businessData: BusinessSetupData = {
        business: {
          name: formData.businessName,
          ein: formData.ein,
          entityType: formData.entityType,
          startYear: parseInt(formData.startYear),
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          historicalData: historicalData
        },
        selectedYear: {
          year: parseInt(formData.taxYear),
          grossReceipts: 0, // Will be entered in a later step
          qre: 0 // Will be calculated in a later step
        }
      };

      // Save to database
      const savedBusiness = await RDBusinessService.saveBusiness(businessData, userId);

      console.log('BusinessSetupStep: Saved business data:', savedBusiness);

      // Get the business year ID for the selected tax year
      const businessYear = await RDBusinessService.getBusinessYear(savedBusiness.id, parseInt(formData.taxYear));
      
      if (!businessYear) {
        throw new Error('Failed to retrieve business year data after saving');
      }

      // Update local state with properly formatted data
      const updatedBusinessData = {
        business: {
          id: savedBusiness.id,
          name: savedBusiness.name,
          ein: savedBusiness.ein,
          entityType: savedBusiness.entity_type,
          startYear: savedBusiness.start_year,
          address: savedBusiness.contact_info?.address || '',
          city: savedBusiness.contact_info?.city || '',
          state: savedBusiness.contact_info?.state || '',
          zip: savedBusiness.contact_info?.zip || '',
          // Include the historical data that was just saved
          historicalData: historicalData
        },
        selectedYear: {
          id: businessYear.id,
          year: businessYear.year,
          grossReceipts: businessYear.gross_receipts || 0,
          qre: businessYear.total_qre || 0
        }
      };

      console.log('BusinessSetupStep: Calling onUpdate with:', updatedBusinessData);
      onUpdate(updatedBusinessData);

      onNext();
    } catch (error) {
      console.error('Error saving business data:', error);
      setErrors(prev => ({ 
        ...prev, 
        general: 'Failed to save business data. Please try again.' 
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const handleEINChange = (value: string) => {
    const formattedEIN = formatEIN(value);
    handleInputChange('ein', formattedEIN);
  };

  const handleHistoricalDataChange = (year: number, field: 'grossReceipts' | 'qre', value: string) => {
    const numValue = parseCurrencyToNumber(value);
    setHistoricalData(prev => 
      prev.map(data => 
        data.year === year ? { ...data, [field]: numValue } : data
      )
    );

    // Clear error when user starts typing
    if (historicalErrors[year.toString()]?.[field]) {
      setHistoricalErrors(prev => ({
        ...prev,
        [year.toString()]: {
          ...prev[year.toString()],
          [field]: ''
        }
      }));
    }
  };

  const currentYear = parseInt(formData.taxYear);
  const startYear = parseInt(formData.startYear);
  const historicalYears = generateHistoricalYears();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading business data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Business Setup</h3>
        <p className="text-gray-600">
          Enter your business information and historical data for R&D credit calculation.
        </p>
      </div>

      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter business name"
              />
              {errors.businessName && (
                <p className="text-red-600 text-sm mt-1">{errors.businessName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                EIN (XX-XXXXXXX) *
              </label>
              <input
                type="text"
                value={formData.ein}
                onChange={(e) => handleEINChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12-3456789"
                maxLength={10}
              />
              {errors.ein && (
                <p className="text-red-600 text-sm mt-1">{errors.ein}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type
              </label>
              <select
                value={formData.entityType}
                onChange={(e) => handleInputChange('entityType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {entityTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Start Year *
              </label>
              <select
                value={formData.startYear}
                onChange={(e) => handleInputChange('startYear', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Start Year</option>
                {Array.from({ length: 50 }, (_, i) => currentYear - i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              {errors.startYear && (
                <p className="text-red-600 text-sm mt-1">{errors.startYear}</p>
              )}
            </div>
          </div>

          {/* Tax Year Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Tax Year Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Year for R&D Credit
              </label>
              <select
                value={formData.taxYear}
                onChange={(e) => handleInputChange('taxYear', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {formData.startYear && formData.taxYear && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h5 className="text-sm font-medium text-blue-900 mb-2">Historical Data Period</h5>
                <p className="text-sm text-blue-700">
                  We'll collect data for years {Math.max(startYear, currentYear - 8)} through {currentYear - 1}
                  {startYear > currentYear - 8 && ` (since your business started in ${startYear})`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="mt-6 space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Address</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter street address"
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="text-red-600 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                {states.map(state => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-red-600 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code *
              </label>
              <input
                type="text"
                value={formData.zip}
                onChange={(e) => handleInputChange('zip', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter ZIP code"
              />
              {errors.zip && (
                <p className="text-red-600 text-sm mt-1">{errors.zip}</p>
              )}
            </div>
          </div>
        </div>

        {/* Historical Data Section */}
        {historicalYears.length > 0 && (
          <div className="mt-8 space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 border-b pb-2">
              Historical Data ({historicalYears.length} years)
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Enter gross receipts and QRE data for the base period. This data is required for calculating the base amount and incremental QRE.
            </p>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gross Receipts
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QRE (if claimed)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {historicalData.map((data) => (
                    <tr key={data.year}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="text"
                            value={data.grossReceipts ? formatCurrency(data.grossReceipts.toString()) : ''}
                            onChange={(e) => handleHistoricalDataChange(data.year, 'grossReceipts', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                        {historicalErrors[data.year.toString()]?.grossReceipts && (
                          <p className="text-red-600 text-xs mt-1">{historicalErrors[data.year.toString()].grossReceipts}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input
                            type="text"
                            value={data.qre ? formatCurrency(data.qre.toString()) : ''}
                            onChange={(e) => handleHistoricalDataChange(data.year, 'qre', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                        {historicalErrors[data.year.toString()]?.qre && (
                          <p className="text-red-600 text-xs mt-1">{historicalErrors[data.year.toString()].qre}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Information Boxes */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  About Historical Data
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    The R&D tax credit is calculated on incremental QRE over a base amount. We need:
                  </p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><strong>Gross Receipts:</strong> All income from all sources for each year</li>
                    <li><strong>QRE:</strong> Qualified Research Expenses if you claimed the credit before</li>
                    <li><strong>Base Period:</strong> Previous 8 years or since business start, whichever is shorter</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Data Requirements & Formatting
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>If you've never claimed the R&D credit, leave QRE as $0</li>
                    <li>Gross receipts should include all business income</li>
                    <li>Historical data helps establish your base amount for credit calculation</li>
                    <li><strong>Currency:</strong> Always rounded to the nearest dollar</li>
                    <li><strong>Percentages:</strong> Always carried to 2 decimal places, no more</li>
                    <li><strong>EIN:</strong> Automatically formatted as XX-XXXXXXX</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessSetupStep; 