import React, { useState, useEffect } from 'react';
import { RDBusinessService } from '../../../services/rdBusinessService';
import { BusinessSetupData, HistoricalData } from '../../../types/rdTypes';
import { supabase } from '../../../../../lib/supabase';
import { Building2, MapPin, Calendar, Info, Image, Upload, BarChart3, ChevronRight, AlertTriangle } from 'lucide-react';

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
    zip: business?.zip || '',
    website: business?.website || '',
    naicsCode: business?.naics || '',
    imagePath: business?.image_path || '',
    historicalDataInputs: {} as Record<string, { grossReceipts?: string; qre?: string }>
  });

  const [historicalData, setHistoricalData] = useState<HistoricalData[]>(
    business?.historicalData || []
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [debounceTimers, setDebounceTimers] = useState<Record<string, NodeJS.Timeout>>({});
  
  // Logo upload state
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);

  const entityTypes = [
    { value: 'LLC', label: 'Limited Liability Company (LLC)' },
    { value: 'SCORP', label: 'S Corporation' },
    { value: 'CCORP', label: 'C Corporation' },
    { value: 'PARTNERSHIP', label: 'Partnership' },
    { value: 'SOLEPROP', label: 'Sole Proprietorship' },
    { value: 'OTHER', label: 'Other' }
  ];

  // NAICS codes for dental and medical offices
  const naicsCodes = [
    { value: '621210', label: 'Dental Office (621210)' },
    { value: '621111', label: 'Medical Office (621111)' },
    { value: '621310', label: 'Offices of Chiropractors (621310)' },
    { value: '621320', label: 'Offices of Optometrists (621320)' },
    { value: '621330', label: 'Offices of Mental Health Practitioners (621330)' },
    { value: '621340', label: 'Offices of Physical, Occupational and Speech Therapists (621340)' },
    { value: '621391', label: 'Offices of Podiatrists (621391)' },
    { value: '621399', label: 'Offices of All Other Miscellaneous Health Practitioners (621399)' }
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
    
    // Force $12,1234 format - Format with commas
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

  // Logo upload functions
  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    console.log('[BusinessSetupStep] Starting logo upload:', file.name);
    setIsUploadingLogo(true);
    
    try {
      // Basic file validation
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }
      
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be an image (JPEG, PNG, GIF, or WebP)');
      }

      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${business?.id || 'temp'}_${timestamp}.${file.name.split('.').pop()}`;
      const filePath = `logos/${fileName}`;

      // Direct upload attempt
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('[BusinessSetupStep] Upload error:', uploadError);
        throw uploadError;
      }

      console.log('[BusinessSetupStep] Upload successful:', uploadData.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;
      console.log('[BusinessSetupStep] Public URL generated:', publicUrl);

      // Update database with image path
      if (business?.id && publicUrl) {
        await RDBusinessService.updateBusiness(business.id, {
          image_path: publicUrl
        });
        console.log('[BusinessSetupStep] Database update successful');

        // Update form data
        setFormData(prev => ({
          ...prev,
          imagePath: publicUrl
        }));
      }

      setLogoUploadError(null);
    } catch (error: any) {
      console.error('[BusinessSetupStep] Error uploading logo:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to upload logo. ';
      
      if (error.message?.includes('row-level security policy')) {
        errorMessage += 'Storage permissions need to be configured. Please contact support.';
      } else if (error.message?.includes('not found')) {
        errorMessage += 'Storage bucket not found. Please contact support.';
      } else if (error.message?.includes('size')) {
        errorMessage += error.message;
      } else if (error.message?.includes('image')) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again or contact support if the problem persists.';
      }
      
      setLogoUploadError(errorMessage);
      // Keep the preview even if upload fails
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          logo: 'Please select an image file.'
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: 'Logo file size must be less than 5MB.'
        }));
        return;
      }

      handleLogoUpload(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({
      ...prev,
      imagePath: ''
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.logo;
      return newErrors;
    });
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
            zip: latestBusiness.contact_info?.zip || '',
            website: latestBusiness.website || '',
            naicsCode: latestBusiness.naics || '',
            imagePath: latestBusiness.image_path || '',
            historicalDataInputs: latestBusiness.historical_data?.reduce((acc, yearData) => {
              acc[yearData.year.toString()] = {
                grossReceipts: (yearData.gross_receipts || yearData.grossReceipts)?.toString() || '',
                qre: yearData.qre?.toString() || ''
              };
              return acc;
            }, {} as Record<string, { grossReceipts?: string; qre?: string }>) || {}
          }));
          
          // Set logo preview if image path exists
          if (latestBusiness.image_path) {
            console.log('[BusinessSetupStep] Setting logo preview from stored path:', latestBusiness.image_path);
            setLogoPreview(latestBusiness.image_path);
          } else {
            console.log('[BusinessSetupStep] No stored logo path found');
            setLogoPreview('');
          }
          
          // Load historical data from rd_businesses.historical_data JSONB column
          if (latestBusiness.historical_data && Array.isArray(latestBusiness.historical_data) && latestBusiness.historical_data.length > 0) {
            console.log('[BusinessSetupStep] Found historical data:', latestBusiness.historical_data);
            const transformedHistoricalData = latestBusiness.historical_data.map((yearData: any) => ({
              year: yearData.year,
              grossReceipts: yearData.gross_receipts || yearData.grossReceipts || 0,
              qre: yearData.qre || 0
            }));
            console.log('[BusinessSetupStep] Transformed historical data:', transformedHistoricalData);
            setHistoricalData(transformedHistoricalData);
          } else {
            console.log('[BusinessSetupStep] No historical data found, initializing empty array');
            setHistoricalData([]);
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

    // Cleanup function to clear any pending timers
    return () => {
      Object.values(debounceTimers).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
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

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.zip.trim()) {
      newErrors.zip = 'ZIP code is required';
    }

    // Website validation (optional but if provided, must be valid URL)
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Website must be a valid URL starting with http:// or https://';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateHistoricalData = () => {
    let hasErrors = false;

    // Clear all existing historical data errors
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('historical-')) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });

    historicalData.forEach(data => {
      const yearErrors: Record<string, string> = {};

      // Validate gross receipts
      const grossReceiptsValidation = validateFinancialAmount(data.grossReceipts, 'Gross Receipts');
      if (!grossReceiptsValidation.isValid) {
        yearErrors.grossReceipts = grossReceiptsValidation.error!;
        hasErrors = true;
      }

      // Validate QRE
      const qreValidation = validateFinancialAmount(data.qre, 'QRE');
      if (!qreValidation.isValid) {
        yearErrors.qre = qreValidation.error!;
        hasErrors = true;
      }

      if (Object.keys(yearErrors).length > 0) {
        setErrors(prev => ({
          ...prev,
          [`historical-${data.year}-grossReceipts`]: yearErrors.grossReceipts,
          [`historical-${data.year}-qre`]: yearErrors.qre
        }));
      }
    });

    return !hasErrors;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !validateHistoricalData()) {
      setErrors(prev => ({
        ...prev,
        general: 'Please fix the errors above before continuing.'
      }));
      return;
    }

    setIsSaving(true);
    try {
      const businessUpdates = {
        name: formData.businessName,
        ein: formData.ein,
        entity_type: formData.entityType,
        start_year: parseInt(formData.startYear),
        domicile_state: formData.state,
        contact_info: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zip: formData.zip
        },
        website: formData.website,
        naics: formData.naicsCode,
        image_path: formData.imagePath
      };

      console.log('[BusinessSetupStep] Saving business updates:', businessUpdates);

      if (business?.id) {
        await RDBusinessService.updateBusiness(business.id, businessUpdates);
      } else {
        console.error('[BusinessSetupStep] No business ID available for saving');
        throw new Error('No business ID available');
      }

      // Save historical data
      for (const data of historicalData) {
        await RDBusinessService.saveBusinessYear(business.id, {
          year: data.year,
          grossReceipts: data.grossReceipts,
          qre: data.qre
        });
      }

      onUpdate({
        business: {
          ...business,
          ...businessUpdates
        },
        historicalData
      });

      onNext();
    } catch (error) {
      console.error('[BusinessSetupStep] Error saving business setup:', error);
      setErrors(prev => ({
        ...prev,
        general: 'Failed to save business information. Please try again.'
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Clear general error when user makes changes
    if (errors.general) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.general;
        return newErrors;
      });
    }

    // Auto-save for specific fields with debouncing
    if (['website', 'naicsCode', 'entityType', 'ein', 'businessName', 'startYear'].includes(field) && business?.id) {
      // Clear existing timer for this field
      if (debounceTimers[field]) {
        clearTimeout(debounceTimers[field]);
      }

      // Set new timer
      const timer = setTimeout(async () => {
        try {
          const updateData: any = {};
          
          if (field === 'website') {
            updateData.website = value;
            console.log('[BusinessSetupStep] Auto-saving website:', value);
          } else if (field === 'naicsCode') {
            updateData.naics = value;
            console.log('[BusinessSetupStep] Auto-saving NAICS code:', value);
          } else if (field === 'entityType') {
            updateData.entity_type = value;
            console.log('[BusinessSetupStep] Auto-saving entity type:', value);
          } else if (field === 'ein') {
            updateData.ein = value;
            console.log('[BusinessSetupStep] Auto-saving EIN:', value);
          } else if (field === 'businessName') {
            updateData.name = value;
            console.log('[BusinessSetupStep] Auto-saving business name:', value);
          } else if (field === 'startYear') {
            updateData.start_year = parseInt(value);
            console.log('[BusinessSetupStep] Auto-saving start year:', value);
          }

          await RDBusinessService.updateBusiness(business.id, updateData);
          console.log('[BusinessSetupStep] Auto-save successful for', field);
        } catch (error) {
          console.error('[BusinessSetupStep] Error auto-saving', field + ':', error);
        }
      }, 1000);

      debounceTimers[field] = timer;
    }
  };

  const handleStartYearChange = async (newStartYear: string) => {
    handleInputChange('startYear', newStartYear);

    if (business?.id && newStartYear) {
      try {
        await RDBusinessService.updateBusiness(business.id, {
          start_year: parseInt(newStartYear)
        });
      } catch (error) {
        console.error('[BusinessSetupStep] Error updating start year:', error);
      }
    }
  };

  const handleEINChange = (value: string) => {
    const formattedEIN = formatEIN(value);
    handleInputChange('ein', formattedEIN);
  };

  // Validation for numeric fields
  const MAX_DECIMAL_VALUE = 9999999999999.99; // Maximum for DECIMAL(15,2)
  
  const validateFinancialAmount = (value: number, fieldName: string): { isValid: boolean; error?: string } => {
    if (isNaN(value)) {
      return { isValid: false, error: `${fieldName} must be a valid number` };
    }
    
    if (value < 0) {
      return { isValid: false, error: `${fieldName} cannot be negative` };
    }
    
    if (value > MAX_DECIMAL_VALUE) {
      return { isValid: false, error: `${fieldName} cannot exceed $9.99 trillion` };
    }
    
    return { isValid: true };
  };

  const handleHistoricalDataChange = (year: number, field: 'grossReceipts' | 'qre', value: string) => {
    const numValue = parseCurrencyToNumber(value);
    
    // Validate the numeric value
    const fieldDisplayName = field === 'grossReceipts' ? 'Gross Receipts' : 'QRE';
    const validation = validateFinancialAmount(numValue, fieldDisplayName);
    
    // Update the form state immediately for responsive UI
    setFormData(prev => ({
      ...prev,
      historicalDataInputs: {
        ...prev.historicalDataInputs,
        [year.toString()]: {
          ...prev.historicalDataInputs?.[year.toString()],
          [field]: value
        }
      }
    }));

    // Clear existing validation errors for this field
    const errorKey = `historical-${year}-${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }

    // If validation fails, set error and don't save to database
    if (!validation.isValid) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: validation.error
      }));
      return;
    }

    // Update historical data
    setHistoricalData(prev => {
      const existingData = prev.find(h => h.year === year);
      if (existingData) {
        return prev.map(h => 
          h.year === year 
            ? { ...h, [field]: numValue }
            : h
        );
      } else {
        return [...prev, {
          year,
          grossReceipts: field === 'grossReceipts' ? numValue : 0,
          qre: field === 'qre' ? numValue : 0
        }];
      }
    });

    // Clear the form input for empty values  
    if (value === '' || numValue === 0) {
      setFormData(prev => ({
        ...prev,
        historicalDataInputs: {
          ...prev.historicalDataInputs,
          [year.toString()]: {
            ...prev.historicalDataInputs?.[year.toString()],
            [field]: ''
          }
        }
      }));
    }

    // Debounced save to database (only if validation passed)
    const timerKey = `${year}-${field}`;
    if (debounceTimers[timerKey]) {
      clearTimeout(debounceTimers[timerKey]);
    }

    const newTimer = setTimeout(async () => {
      try {
        // Get the current historical data state and update it
        const updatedHistoricalData = historicalData.map(h => 
          h.year === year 
            ? { ...h, [field]: numValue }
            : h
        );

        // If year doesn't exist in historical data, add it
        if (!updatedHistoricalData.find(h => h.year === year)) {
          updatedHistoricalData.push({
            year,
            grossReceipts: field === 'grossReceipts' ? numValue : 0,
            qre: field === 'qre' ? numValue : 0
          });
        }

        console.log('[BusinessSetupStep] Saving historical data to rd_business_years table for year:', year);
        console.log('[BusinessSetupStep] Business ID:', business?.id);
        console.log('[BusinessSetupStep] Field:', field, 'Value:', numValue);
        
        // Get current data for this year to preserve the other field
        const currentYearData = updatedHistoricalData.find(h => h.year === year);
        console.log('[BusinessSetupStep] Current year data:', currentYearData);
        
        if (!business?.id) {
          console.error('[BusinessSetupStep] No business ID available for saving historical data');
          setErrors(prev => ({
            ...prev,
            [`historical-${year}-${field}-save`]: 'Business not found. Please save business information first.'
          }));
          return;
        }
        
        await RDBusinessService.saveBusinessYear(business.id, {
          year: year,
          grossReceipts: field === 'grossReceipts' ? numValue : (currentYearData?.grossReceipts || 0),
          qre: field === 'qre' ? numValue : (currentYearData?.qre || 0)
        });
        console.log('[BusinessSetupStep] Successfully saved historical data for year:', year);
      } catch (error) {
        console.error('[BusinessSetupStep] Error saving historical data in real-time:', error);
        
        // Show user-friendly error message
        const errorKey = `historical-${year}-${field}-save`;
        if (error.code === '22003') {
          setErrors(prev => ({
            ...prev,
            [errorKey]: `${fieldDisplayName} value is too large for database. Maximum allowed is $9.99 trillion.`
          }));
        } else {
          setErrors(prev => ({
            ...prev,
            [errorKey]: `Failed to save ${fieldDisplayName}. Please try again.`
          }));
        }
      }
    }, 1000); // 1 second debounce

    setDebounceTimers(prev => ({
      ...prev,
      [timerKey]: newTimer
    }));
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
    <div className="space-y-8">
      {/* Professional Header with Gradient - matching Calculations Page */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="w-8 h-8 mr-3" />
            <div>
              <h2 className="text-3xl font-bold">Business Setup</h2>
              <p className="text-blue-100 text-sm opacity-90">
                Configure your business information and historical data for R&D credit calculation
              </p>
            </div>
          </div>
          {business?.name && (
            <div className="text-right">
              <div className="text-lg font-semibold">{business.name}</div>
              <div className="text-blue-200 text-sm">Tax Year {formData.taxYear}</div>
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errors.general && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          
          {/* Company Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Building2 className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">Basic business details and identification</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NAICS Code
                  </label>
                  <select
                    value={formData.naicsCode}
                    onChange={(e) => handleInputChange('naicsCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select NAICS Code</option>
                    {naicsCodes.map(code => (
                      <option key={code.value} value={code.value}>
                        {code.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://www.example.com"
                  />
                  {errors.website && (
                    <p className="text-red-600 text-sm mt-1">{errors.website}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Business Address Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Business Address</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">Physical location and contact information</p>
            </div>
            <div className="p-6 space-y-4">
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
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">

          {/* Tax Year & Calculation Setup Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Tax Year & Calculation Setup</h3>
              </div>
              <p className="text-sm text-gray-600 mt-1">Configure the tax year for R&D credit calculation</p>
            </div>
            <div className="p-6 space-y-4">
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
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h5 className="text-sm font-medium text-blue-900 mb-1">Historical Data Period</h5>
                      <p className="text-sm text-blue-700">
                        We'll collect data for years {Math.max(startYear, currentYear - 8)} through {currentYear - 1}
                        {startYear > currentYear - 8 && ` (since your business started in ${startYear})`}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Company Logo Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <Image className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Company Logo</h3>
                <span className="ml-2 text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">Optional</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Upload your company logo for reports and documentation</p>
            </div>
            <div className="p-6">
              {logoPreview ? (
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <img 
                      src={logoPreview} 
                      alt="Company logo" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-2">
                      {formData.imagePath ? 'Logo uploaded successfully' : 'Logo preview (upload pending)'}
                    </p>
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Remove logo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <div className="space-y-2">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <label htmlFor="logo-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Upload a logo</span>
                        <input 
                          id="logo-upload" 
                          name="logo-upload" 
                          type="file" 
                          className="sr-only" 
                          accept="image/*"
                          onChange={handleLogoChange}
                          disabled={isUploadingLogo}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              )}
              
              {isUploadingLogo && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 mt-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Uploading logo...</span>
                </div>
              )}
              
              {logoUploadError && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Info className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-yellow-800">{logoUploadError}</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        This won't prevent you from continuing with the setup.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {!errors.logo && !logoPreview && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Logo upload is optional. You can complete the business setup without a logo and add one later.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Historical Data Section - Full Width */}
      {historicalYears.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Historical Financial Data</h3>
                  <p className="text-sm text-gray-600 mt-1">Enter gross receipts and QRE data for the base period ({historicalYears.length} years)</p>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Base Period: {Math.max(startYear, currentYear - 8)} - {currentYear - 1}
              </div>
            </div>
          </div>
          <div className="p-6">
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
                    <tr key={data.year} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {data.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">$</span>
                          </div>
                          <input
                            type="text"
                            value={formData.historicalDataInputs?.[data.year.toString()]?.grossReceipts || 
                                  (data.grossReceipts ? formatCurrency(data.grossReceipts.toString()) : '')}
                            onChange={(e) => handleHistoricalDataChange(data.year, 'grossReceipts', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                        {errors[`historical-${data.year}-grossReceipts`] && (
                          <p className="text-red-600 text-xs mt-1">{errors[`historical-${data.year}-grossReceipts`]}</p>
                        )}
                        {errors[`historical-${data.year}-grossReceipts-save`] && (
                          <p className="text-red-600 text-xs mt-1">{errors[`historical-${data.year}-grossReceipts-save`]}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">$</span>
                          </div>
                          <input
                            type="text"
                            value={formData.historicalDataInputs?.[data.year.toString()]?.qre || 
                                  (data.qre ? formatCurrency(data.qre.toString()) : '')}
                            onChange={(e) => handleHistoricalDataChange(data.year, 'qre', e.target.value)}
                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0"
                          />
                        </div>
                        {errors[`historical-${data.year}-qre`] && (
                          <p className="text-red-600 text-xs mt-1">{errors[`historical-${data.year}-qre`]}</p>
                        )}
                        {errors[`historical-${data.year}-qre-save`] && (
                          <p className="text-red-600 text-xs mt-1">{errors[`historical-${data.year}-qre-save`]}</p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              About Historical Data for R&D Credit Calculation
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p className="mb-2">
                The R&D tax credit is calculated on incremental QRE over a base amount. We need:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Gross Receipts:</strong> All income from all sources for each year</li>
                <li><strong>QRE:</strong> Qualified Research Expenses if you claimed the credit before</li>
                <li><strong>Base Period:</strong> Previous 8 years or since business start, whichever is shorter</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end pt-6">
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-lg"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              Continue
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BusinessSetupStep; 