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
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});

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
    
    // Include the current year in the list
    for (let year = startFromYear; year <= currentYear; year++) {
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

  // Load latest business and years from Supabase on mount and whenever business changes
  useEffect(() => {
    const fetchBusinessAndYears = async () => {
      console.log('[BusinessSetupStep] Starting to fetch business and years data', { 
        businessId: business?.id, 
        userId 
      });
      setIsLoading(true);
      try {
        let latestBusiness = null;
        if (business?.id) {
          // Always fetch the latest business and years from Supabase by business.id
          console.log('[BusinessSetupStep] Fetching business by ID:', business.id);
          latestBusiness = await RDBusinessService.getBusiness(business.id);
        } else if (userId) {
          // Fallback: fetch by userId
          console.log('[BusinessSetupStep] Fetching business by userId:', userId);
          latestBusiness = await RDBusinessService.getBusinessByUser(userId);
        }
        
        console.log('[BusinessSetupStep] Fetched business data:', latestBusiness);
        
        if (latestBusiness) {
          setFormData(prev => ({
            ...prev,
            businessName: latestBusiness.name || '',
            ein: latestBusiness.ein || '',
            entityType: latestBusiness.entity_type || 'LLC',
            startYear: latestBusiness.start_year?.toString() || '',
            address: latestBusiness.contact_info?.address || '',
            city: latestBusiness.contact_info?.city || '',
            state: latestBusiness.contact_info?.state || '',
            zip: latestBusiness.contact_info?.zip || ''
          }));
          
          if (latestBusiness.rd_business_years && latestBusiness.rd_business_years.length > 0) {
            console.log('[BusinessSetupStep] Found business years data:', latestBusiness.rd_business_years);
            const transformedHistoricalData = latestBusiness.rd_business_years.map((yearData: any) => ({
              year: yearData.year,
              grossReceipts: yearData.gross_receipts || 0,
              qre: yearData.total_qre || 0
            }));
            console.log('[BusinessSetupStep] Transformed historical data:', transformedHistoricalData);
            setHistoricalData(transformedHistoricalData);
          } else {
            console.log('[BusinessSetupStep] No business years data found');
          }
        } else {
          console.log('[BusinessSetupStep] No business data found');
        }
      } catch (error) {
        console.error('[BusinessSetupStep] Error fetching latest business and years:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBusinessAndYears();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, userId]);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, [debounceTimers]);

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
    if (!business?.id || !business?.client_id) {
      console.error('BusinessSetupStep: Missing business.id or business.client_id', { business });
      setErrors(prev => ({
        ...prev,
        general: 'Missing business or client information. Please select a business.'
      }));
      setIsSaving(false);
      return;
    }

    setIsSaving(true);
    try {
      console.log('[BusinessSetupStep] Starting business setup save process', { 
        businessId: business.id, 
        clientId: business.client_id,
        historicalData: historicalData
      });

      // First, ensure the business is enrolled
      const savedBusiness = await RDBusinessService.enrollBusinessFromExisting(business.id, business.client_id);
      console.log('[BusinessSetupStep] Business enrolled successfully', savedBusiness);

      // Save historical data to the database
      for (const historicalItem of historicalData) {
        console.log('[BusinessSetupStep] Saving historical data for year', historicalItem.year, historicalItem);
        await RDBusinessService.saveBusinessYear(savedBusiness.id, {
          year: historicalItem.year,
          grossReceipts: historicalItem.grossReceipts,
          qre: historicalItem.qre
        });
      }

      console.log('[BusinessSetupStep] All historical data saved successfully');
      setIsSaving(false);
      onNext();
    } catch (error) {
      console.error('[BusinessSetupStep] Error saving business data', error);
      setErrors(prev => ({ ...prev, general: 'Failed to save business data. Please try again.' }));
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

    // If start year changed, update rd_business_years entries
    if (field === 'startYear' && value && business?.id) {
      handleStartYearChange(value);
    }
  };

  // Function to handle start year changes and update rd_business_years
  const handleStartYearChange = async (newStartYear: string) => {
    if (!business?.id) return;

    const startYear = parseInt(newStartYear);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(startYear)) return;

    console.log('[BusinessSetupStep] Start year changed, updating rd_business_years', {
      businessId: business.id,
      newStartYear: startYear,
      currentYear: currentYear
    });

    try {
      // Calculate the years we need to create
      const yearsToCreate = [];
      const earliestYear = Math.max(startYear, currentYear - 8);
      
      for (let year = earliestYear; year <= currentYear; year++) {
        yearsToCreate.push(year);
      }

      console.log('[BusinessSetupStep] Years to create/update:', yearsToCreate);

      // Create/update rd_business_years entries
      const result = await RDBusinessService.createOrUpdateBusinessYears(
        business.id,
        yearsToCreate,
        true // Remove unused years when start year changes
      );

      console.log('[BusinessSetupStep] Successfully updated rd_business_years:', result);

      // Update the historical data state to reflect the new years
      const newHistoricalData: HistoricalData[] = yearsToCreate
        .map(year => {
          const existing = historicalData.find(h => h.year === year);
          return existing || { year, grossReceipts: 0, qre: 0 };
        });

      setHistoricalData(newHistoricalData);

    } catch (error) {
      console.error('[BusinessSetupStep] Error updating rd_business_years:', error);
      // Don't show error to user as this is a background operation
    }
  };

  const handleEINChange = (value: string) => {
    const formattedEIN = formatEIN(value);
    handleInputChange('ein', formattedEIN);
  };

  const handleHistoricalDataChange = async (year: number, field: 'grossReceipts' | 'qre', value: string) => {
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

    // Save to database in real-time if business is enrolled (with debounce)
    if (business?.id) {
      const timerKey = `${year}-${field}`;
      
      // Clear existing timer
      if (debounceTimers[timerKey]) {
        clearTimeout(debounceTimers[timerKey]);
      }

      // Set new timer
      const newTimer = setTimeout(async () => {
        try {
          const currentHistoricalData = historicalData.find(h => h.year === year);
          const updatedData = {
            year: year,
            grossReceipts: field === 'grossReceipts' ? numValue : (currentHistoricalData?.grossReceipts || 0),
            qre: field === 'qre' ? numValue : (currentHistoricalData?.qre || 0)
          };
          
          console.log('[BusinessSetupStep] Saving historical data in real-time (debounced):', updatedData);
          await RDBusinessService.saveBusinessYear(business.id, updatedData);
        } catch (error) {
          console.error('[BusinessSetupStep] Error saving historical data in real-time:', error);
          // Don't show error to user as this is a background operation
        }
      }, 1000); // 1 second debounce

      setDebounceTimers(prev => ({
        ...prev,
        [timerKey]: newTimer
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