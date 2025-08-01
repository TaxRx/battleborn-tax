import React, { useState, useEffect } from 'react';
import { TaxInfo, BusinessInfo, BusinessYear, PersonalYear } from '../lib/core/types/tax';
import { CentralizedClientService } from '../services/centralizedClientService';
import { formatCurrency, parseCurrency, formatEIN, generateDefaultYears, generateDefaultBusinessYears, calculateHouseholdIncome, calculateOrdinaryIncome } from '../utils/formatting';
import { NumericFormat } from 'react-number-format';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Card } from './common/Card';
import { Button } from './common/Button';
import { FormInput } from './forms/FormInput';
import { PercentageSlider } from './forms/PercentageSlider';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (clientData: TaxInfo) => void;
  loading?: boolean;
  toolSlug?: string;
  initialData?: TaxInfo;
}

interface BusinessFormData {
  businessName: string;
  entityType: 'LLC' | 'S-Corp' | 'C-Corp' | 'Partnership' | 'Sole-Proprietor' | 'Other';
  ein: string;
  startYear: number;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  businessPhone?: string;
  businessEmail?: string;
  industry?: string;
  annualRevenue?: number;
  employeeCount?: number;
  ordinaryK1Income?: number;
  guaranteedK1Income?: number;
  isActive: boolean;
  years: BusinessYear[];
}

const formatPhoneNumber = (value: string) => {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, '');
  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
  if (match) {
    const parts = [match[1], match[2], match[3]].filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) return `(${parts[0]}`;
    if (parts.length === 2) return `(${parts[0]}) ${parts[1]}`;
    return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
  }
  return value;
};

const formatZipCode = (value: string) => {
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, '');
  // Limit to 5 digits
  return cleaned.slice(0, 5);
};



const NewClientModal: React.FC<NewClientModalProps> = ({
  isOpen,
  onClose,
  onClientCreated,
  loading = false,
  toolSlug,
  initialData
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'business'>('personal');
  const [editingBusinessIndex, setEditingBusinessIndex] = useState<number | null>(null);
  const [useSameEmail, setUseSameEmail] = useState(false);
  const [useSameAddress, setUseSameAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<TaxInfo>({
    id: '',
    fullName: '',
    email: '',
    phone: '',
    homeAddress: '',
    city: '',
    state: '',
    zipCode: '',
    filingStatus: 'single',
    dependents: 0,
    standardDeduction: true,
    businessOwner: false,
    wagesIncome: 0,
    passiveIncome: 0,
    unearnedIncome: 0,
    capitalGains: 0,
    customDeduction: 0,
    years: generateDefaultYears(),
    businesses: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [businesses, setBusinesses] = useState<BusinessFormData[]>([]);

  // Helper function to clean up duplicate businesses for a client
  const cleanupDuplicateBusinesses = async (clientId: string) => {
    try {
      console.log(`[cleanupDuplicateBusinesses] Checking for duplicate businesses for client: ${clientId}`);
      
      // Get all businesses for this client
      const { data: allBusinesses, error: fetchError } = await supabase
        .from('rd_businesses')
        .select('id, business_name, ein, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false }); // Newest first

      if (fetchError) {
        console.error(`[cleanupDuplicateBusinesses] Error fetching businesses:`, fetchError);
        return;
      }

      if (!allBusinesses || allBusinesses.length <= 1) {
        console.log(`[cleanupDuplicateBusinesses] No duplicates found`);
        return;
      }

      // Group by business name and EIN to find duplicates
      const businessGroups = allBusinesses.reduce((groups, business) => {
        const key = `${business.business_name}-${business.ein || 'no-ein'}`;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(business);
        return groups;
      }, {} as Record<string, typeof allBusinesses>);

      // Find groups with duplicates and keep only the newest one
      for (const [key, group] of Object.entries(businessGroups)) {
        if (group.length > 1) {
          console.log(`[cleanupDuplicateBusinesses] Found ${group.length} duplicates for business: ${key}`);
          
          // Keep the newest one, delete the rest
          const [keepBusiness, ...deleteBusiness] = group;
          const idsToDelete = deleteBusiness.map(b => b.id);
          
          console.log(`[cleanupDuplicateBusinesses] Keeping business ID: ${keepBusiness.id}, deleting IDs: ${idsToDelete.join(', ')}`);
          
          const { error: deleteError } = await supabase
            .from('rd_businesses')
            .delete()
            .in('id', idsToDelete);
            
          if (deleteError) {
            console.error(`[cleanupDuplicateBusinesses] Error deleting duplicate businesses:`, deleteError);
          } else {
            console.log(`[cleanupDuplicateBusinesses] Successfully deleted ${idsToDelete.length} duplicate businesses`);
          }
        }
      }
    } catch (error) {
      console.error(`[cleanupDuplicateBusinesses] Unexpected error:`, error);
    }
  };

  useEffect(() => {
    console.log(`[NewClientModal] useEffect triggered with initialData:`, initialData);
    if (initialData) {
      // Clean up any existing duplicate businesses when opening an existing client
      if (initialData.id) {
        cleanupDuplicateBusinesses(initialData.id);
      }
      console.log(`[NewClientModal] Processing initialData for client: ${initialData.id}`);
      console.log(`[NewClientModal] initialData.businesses:`, initialData.businesses);
      console.log(`[NewClientModal] initialData.years:`, initialData.years);
      console.log(`[NewClientModal] initialData.personal_years:`, initialData.personal_years);
      
      // Create default years data if none exists
      let yearsData = initialData.years || [];
      if (yearsData.length === 0) {
        console.log('[NewClientModal] No years data found, creating default years');
        const currentYear = new Date().getFullYear();
        yearsData = [{
          year: currentYear,
          wagesIncome: initialData.wagesIncome || 0,
          passiveIncome: initialData.passiveIncome || 0,
          unearnedIncome: initialData.unearnedIncome || 0,
          capitalGains: initialData.capitalGains || 0,
          longTermCapitalGains: 0,
          householdIncome: 0,
          ordinaryIncome: 0,
          isActive: true
        }];
      }
      
      const newFormData = {
        id: initialData.id || '',
        fullName: initialData.fullName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        homeAddress: initialData.homeAddress || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',
        filingStatus: initialData.filingStatus || 'single',
        dependents: initialData.dependents || 0,
        standardDeduction: initialData.standardDeduction ?? true,
        businessOwner: initialData.businessOwner ?? (initialData.businesses && initialData.businesses.length > 0) ?? false,
        wagesIncome: initialData.wagesIncome || 0,
        passiveIncome: initialData.passiveIncome || 0,
        unearnedIncome: initialData.unearnedIncome || 0,
        capitalGains: initialData.capitalGains || 0,
        customDeduction: initialData.customDeduction || 0,
        years: yearsData,
        businesses: initialData.businesses || [],
        createdAt: initialData.createdAt || new Date().toISOString(),
        updatedAt: initialData.updatedAt || new Date().toISOString()
      };
      
      console.log(`[NewClientModal] Setting formData:`, newFormData);
      console.log(`[NewClientModal] Zip code mapping - initialData.zipCode:`, initialData.zipCode, 'initialData.zip_code:', initialData.zip_code);
      console.log(`[NewClientModal] Income mapping - wagesIncome:`, initialData.wagesIncome || initialData.wages_income, 'passiveIncome: will be calculated from businesses');
      setFormData(newFormData);
      
      if (initialData.businesses && initialData.businesses.length > 0) {
        console.log(`[NewClientModal] Setting businesses from initialData:`, initialData.businesses);
        const mappedBusinesses = initialData.businesses.map(business => {
          console.log(`[NewClientModal] Mapping business:`, business);
          console.log(`[NewClientModal] Business years:`, business.years);
          
          // Create default business years if none exist
          let businessYears = business.years || [];
          if (businessYears.length === 0) {
            console.log('[NewClientModal] No business years found, creating default');
            const currentYear = new Date().getFullYear();
            businessYears = [{
              year: currentYear,
              ordinaryK1Income: business.ordinaryK1Income || business.ordinary_k1_income || 0,
              guaranteedK1Income: business.guaranteedK1Income || business.guaranteed_k1_income || 0,
              annualRevenue: business.annualRevenue || business.annual_revenue || 0,
              employeeCount: business.employeeCount || business.employee_count || 0,
              isActive: true
            }];
          }
          
          return {
            businessName: business.businessName || business.business_name || '',
            entityType: business.entityType || business.entity_type || 'LLC',
            ein: business.ein || '',
            startYear: business.startYear || business.year_established || new Date().getFullYear(),
            businessAddress: business.businessAddress || business.business_address || '',
            businessCity: business.businessCity || business.business_city || '',
            businessState: business.businessState || business.business_state || '',
            businessZip: business.businessZip || business.business_zip || '',
            businessPhone: business.businessPhone || business.business_phone || '',
            businessEmail: business.businessEmail || business.business_email || '',
            industry: business.industry || '',
            annualRevenue: business.annualRevenue || business.annual_revenue || 0,
            employeeCount: business.employeeCount || business.employee_count || 0,
            ordinaryK1Income: business.ordinaryK1Income || business.ordinary_k1_income || 0,
            guaranteedK1Income: business.guaranteedK1Income || business.guaranteed_k1_income || 0,
            isActive: business.isActive ?? business.is_active ?? true,
            years: businessYears
          };
        });
        console.log(`[NewClientModal] Mapped businesses:`, mappedBusinesses);
        setBusinesses(mappedBusinesses);
      } else {
        console.log('[NewClientModal] No businesses in initialData, setting empty array');
        setBusinesses([]);
      }
    } else {
      console.log(`[NewClientModal] No initialData provided, using defaults`);
    }
  }, [initialData]);

  // Auto-update personal income when businesses change
  // useEffect(() => {
  //   if (businesses.length > 0) {
  //     updatePersonalIncomeFromBusinesses();
  //   }
  // }, [businesses]);

  const handlePersonalInfoChange = (field: keyof TaxInfo, value: any) => {
    console.log(`[handlePersonalInfoChange] field: ${field}, value: ${value}`);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log(`[handlePersonalInfoChange] Updated formData:`, newData);
      return newData;
    });
  };

  const handlePersonalYearChange = (year: number, field: keyof PersonalYear, value: any) => {
    console.log(`[handlePersonalYearChange] Called with: year=${year}, field=${field}, value=${value}`);
    
    setFormData(prev => ({
      ...prev,
      years: prev.years.map(py => 
        py.year === year ? { ...py, [field]: value } : py
      )
    }));

    // Remove automatic update to prevent circular loop
    // if (field === 'passiveIncome' && businesses.length > 0) {
    //   console.log(`[handlePersonalYearChange] Passive income changed, triggering updateBusinessK1FromPersonalIncome`);
    //   updateBusinessK1FromPersonalIncome(year, value);
    // }
  };

  const handleBusinessInfoChange = (index: number, field: keyof BusinessFormData, value: any) => {
    setBusinesses(prev => prev.map((business, i) => 
      i === index ? { ...business, [field]: value } : business
    ));
  };

  const addBusiness = () => {
    const newBusiness: BusinessFormData = {
      businessName: '',
      entityType: 'LLC',
      ein: '',
      startYear: new Date().getFullYear(),
      businessAddress: '',
      businessCity: '',
      businessState: '',
      businessZip: '',
      businessPhone: '',
      businessEmail: '',
      industry: '',
      annualRevenue: 0,
      employeeCount: 0,
      ordinaryK1Income: 0,
      guaranteedK1Income: 0,
      isActive: true,
      years: [{
        year: new Date().getFullYear(),
        ordinaryK1Income: 0,
        guaranteedK1Income: 0,
        annualRevenue: 0,
        isActive: true,
      }],
    };
    setBusinesses(prev => [...prev, newBusiness]);
    setEditingBusinessIndex(businesses.length);
    // Remove automatic update to prevent circular loop
    // setTimeout(() => updatePersonalIncomeFromBusinesses(), 0);
  };

  const saveBusiness = (index: number) => {
    setEditingBusinessIndex(null);
  };

  const removeBusiness = (index: number) => {
    setBusinesses(prev => prev.filter((_, i) => i !== index));
    // Remove automatic update to prevent circular loop
    // setTimeout(() => updatePersonalIncomeFromBusinesses(), 0);
  };

  const addBusinessYear = (businessIndex: number) => {
    const newYear = new Date().getFullYear();
    setBusinesses(prev => prev.map((business, i) => 
      i === businessIndex 
        ? { 
            ...business, 
            years: [...business.years, {
              year: newYear,
              ordinaryK1Income: 0,
              guaranteedK1Income: 0,
              annualRevenue: 0,
              isActive: true,
            }]
          }
        : business
    ));
    // Remove automatic update to prevent circular loop
    // setTimeout(() => updatePersonalIncomeFromBusinesses(), 0);
  };

  const handleYearChange = (businessIndex: number, yearIndex: number, field: keyof BusinessYear, value: any) => {
    console.log(`[handleYearChange] Called with: businessIndex=${businessIndex}, yearIndex=${yearIndex}, field=${field}, value=${value}`);
    console.log(`[handleYearChange] Previous businesses state:`, businesses);
    
    setBusinesses(prev => prev.map((business, i) => 
      i === businessIndex 
        ? {
            ...business,
            years: business.years.map((year, j) => 
              j === yearIndex ? { ...year, [field]: value } : year
            )
          }
        : business
    ));
    
    console.log(`[handleYearChange] Updated businesses state:`, businesses);
    
    // Remove automatic update to prevent circular loop
    // if (field === 'ordinaryK1Income' || field === 'guaranteedK1Income') {
    //   setTimeout(() => updatePersonalIncomeFromBusinesses(), 0);
    // }
  };

  // Function to automatically update personal income based on business K-1 data
  const updatePersonalIncomeFromBusinesses = () => {
    console.log(`[updatePersonalIncomeFromBusinesses] Called`);
    console.log(`[updatePersonalIncomeFromBusinesses] Current businesses:`, businesses);
    console.log(`[updatePersonalIncomeFromBusinesses] Current formData.years:`, formData.years);
    
    setFormData(prev => {
      const updatedYears = prev.years.map(personalYear => {
        // Calculate total K-1 income for this year from all businesses
        let totalOrdinaryK1 = 0;
        let totalGuaranteedK1 = 0;
        
        businesses.forEach(business => {
          if (business.years && Array.isArray(business.years)) {
            const businessYear = business.years.find(by => by.year === personalYear.year);
            if (businessYear && businessYear.isActive) {
              totalOrdinaryK1 += businessYear.ordinaryK1Income || 0;
              totalGuaranteedK1 += businessYear.guaranteedK1Income || 0;
            }
          }
        });
        
        // Update passive income (which includes K-1 income)
        const newPassiveIncome = totalOrdinaryK1 + totalGuaranteedK1;
        
        console.log(`[updatePersonalIncomeFromBusinesses] Year ${personalYear.year}: totalOrdinaryK1=${totalOrdinaryK1}, totalGuaranteedK1=${totalGuaranteedK1}, newPassiveIncome=${newPassiveIncome}`);
        
        return {
          ...personalYear,
          passiveIncome: newPassiveIncome
        };
      });
      
      console.log(`[updatePersonalIncomeFromBusinesses] Updated years:`, updatedYears);
      
      return {
        ...prev,
        years: updatedYears
      };
    });
  };

  // Function to update business K-1 data when personal passive income is manually changed
  const updateBusinessK1FromPersonalIncome = (year: number, newPassiveIncome: number) => {
    console.log(`[updateBusinessK1FromPersonalIncome] Called with: year=${year}, newPassiveIncome=${newPassiveIncome}`);
    console.log(`[updateBusinessK1FromPersonalIncome] Current businesses:`, businesses);
    
    // Find all active businesses for this year
    const activeBusinesses = businesses.filter(business => {
      if (business.years && Array.isArray(business.years)) {
        const businessYear = business.years.find(by => by.year === year);
        return businessYear && businessYear.isActive;
      }
      return false;
    });

    console.log(`[updateBusinessK1FromPersonalIncome] Active businesses for year ${year}:`, activeBusinesses);

    if (activeBusinesses.length === 0) {
      console.log(`[updateBusinessK1FromPersonalIncome] No active businesses found for year ${year}`);
      return;
    }

    // If only one business, assign all K-1 income to it
    if (activeBusinesses.length === 1) {
      console.log(`[updateBusinessK1FromPersonalIncome] Single business, assigning all K-1 income`);
      setBusinesses(prev => prev.map((business, i) => {
        const businessYear = business.years.find(by => by.year === year);
        if (businessYear && businessYear.isActive) {
          console.log(`[updateBusinessK1FromPersonalIncome] Updating business ${i} year ${year} with ordinaryK1Income=${newPassiveIncome}`);
          return {
            ...business,
            years: business.years.map(by => 
              by.year === year 
                ? { 
                    ...by, 
                    ordinaryK1Income: newPassiveIncome,
                    guaranteedK1Income: 0 // Reset guaranteed to 0 when manually setting
                  } 
                : by
            )
          };
        }
        return business;
      }));
    } else {
      console.log(`[updateBusinessK1FromPersonalIncome] Multiple businesses, distributing K-1 income`);
      // If multiple businesses, distribute K-1 income proportionally based on current values
      const totalCurrentK1 = activeBusinesses.reduce((total, business) => {
        const businessYear = business.years.find(by => by.year === year);
        return total + (businessYear?.ordinaryK1Income || 0) + (businessYear?.guaranteedK1Income || 0);
      }, 0);

      console.log(`[updateBusinessK1FromPersonalIncome] Total current K-1: ${totalCurrentK1}`);

      if (totalCurrentK1 === 0) {
        // If no current K-1 income, distribute equally
        const equalShare = newPassiveIncome / activeBusinesses.length;
        console.log(`[updateBusinessK1FromPersonalIncome] No current K-1, distributing equally: ${equalShare} each`);
        setBusinesses(prev => prev.map(business => {
          const businessYear = business.years.find(by => by.year === year);
          if (businessYear && businessYear.isActive) {
            return {
              ...business,
              years: business.years.map(by => 
                by.year === year 
                  ? { 
                      ...by, 
                      ordinaryK1Income: equalShare,
                      guaranteedK1Income: 0
                    } 
                  : by
              )
            };
          }
          return business;
        }));
      } else {
        // Distribute proportionally based on current values
        console.log(`[updateBusinessK1FromPersonalIncome] Distributing proportionally based on current values`);
        setBusinesses(prev => prev.map(business => {
          const businessYear = business.years.find(by => by.year === year);
          if (businessYear && businessYear.isActive) {
            const currentK1 = (businessYear.ordinaryK1Income || 0) + (businessYear.guaranteedK1Income || 0);
            const proportion = currentK1 / totalCurrentK1;
            const newK1Income = newPassiveIncome * proportion;
            
            console.log(`[updateBusinessK1FromPersonalIncome] Business ${business.businessName}: currentK1=${currentK1}, proportion=${proportion}, newK1Income=${newK1Income}`);
            
            return {
              ...business,
              years: business.years.map(by => 
                by.year === year 
                  ? { 
                      ...by, 
                      ordinaryK1Income: newK1Income,
                      guaranteedK1Income: 0
                    } 
                  : by
              )
            };
          }
          return business;
        }));
      }
    }
  };

  const copyBusinessYearData = (businessIndex: number, fromYear: number, toYear: number) => {
    setBusinesses(prev => prev.map((business, i) => 
      i === businessIndex 
        ? {
            ...business,
            years: business.years && Array.isArray(business.years) ? business.years.map(year => 
              year.year === toYear 
                ? business.years.find(y => y.year === fromYear) || year
                : year
            ) : business.years || []
          }
        : business
    ));
  };

  const addNewYear = () => {
    const newYear = new Date().getFullYear();
    setFormData(prev => ({
      ...prev,
      years: [...prev.years, {
        year: newYear,
        wagesIncome: 0,
        passiveIncome: 0,
        capitalGains: 0,
        unearnedIncome: 0,
        longTermCapitalGains: 0,
        householdIncome: 0,
        ordinaryIncome: 0,
        isActive: true,
      }]
    }));
  };

  const copyPersonalYearData = (fromYear: number, toYear: number) => {
    setFormData(prev => ({
      ...prev,
      years: prev.years.map(year => 
        year.year === toYear 
          ? prev.years.find(y => y.year === fromYear) || year
          : year
      )
    }));
  };

  const removePersonalYear = (yearToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      years: prev.years.filter(py => py.year !== yearToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`[handleSubmit] Form submitted`);
    console.log(`[handleSubmit] Current formData:`, formData);
    console.log(`[handleSubmit] formData.fullName:`, formData.fullName);
    console.log(`[handleSubmit] formData.email:`, formData.email);
    
    setIsSubmitting(true);
    setError(null);

    console.log(`[handleSubmit] Starting form submission`);
    console.log(`[handleSubmit] Current businesses state:`, businesses);
    console.log(`[handleSubmit] Current formData state:`, formData);

    // Validate required fields
    if (!formData.fullName || formData.fullName.trim() === '') {
      setError('Full name is required');
      toast.error('Please enter a full name');
      return;
    }
    if (!formData.email || formData.email.trim() === '') {
      setError('Email is required');
      toast.error('Please enter an email address');
      return;
    }

    try {
      // Transform businesses to match TaxInfo structure
      const transformedBusinesses: BusinessInfo[] = businesses.map(business => ({
        businessName: business.businessName,
        entityType: business.entityType === 'LLC' ? 'LLC' :
                   business.entityType === 'S-Corp' ? 'S-Corp' :
                   business.entityType === 'C-Corp' ? 'C-Corp' :
                   business.entityType === 'Partnership' ? 'Partnership' :
                   business.entityType === 'Sole-Proprietor' ? 'Sole Proprietorship' :
                   'Other', // default to Other for 'Other'
        ein: business.ein,
        startYear: business.startYear,
        businessAddress: business.businessAddress,
        businessCity: business.businessCity,
        businessState: business.businessState,
        businessZip: business.businessZip,
        businessPhone: business.businessPhone,
        businessEmail: business.businessEmail,
        industry: business.industry,
        annualRevenue: business.annualRevenue,
        employeeCount: business.employeeCount,
        ordinaryK1Income: business.ordinaryK1Income,
        guaranteedK1Income: business.guaranteedK1Income,
        isActive: business.isActive,
        years: business.years
      }));

      console.log(`[handleSubmit] Transformed businesses:`, transformedBusinesses);

      // Create complete TaxInfo object
      const completeTaxInfo: TaxInfo = {
        ...formData,
        businesses: transformedBusinesses,
        businessOwner: businesses.length > 0
      };

      console.log(`[handleSubmit] Complete TaxInfo object:`, completeTaxInfo);
      console.log(`[handleSubmit] formData.fullName:`, formData.fullName);
      console.log(`[handleSubmit] completeTaxInfo.fullName:`, completeTaxInfo.fullName);

      if (initialData?.id) {
        console.log(`[handleSubmit] Updating existing client with ID: ${initialData.id}`);
        // Update existing client
        const updateData = {
          full_name: completeTaxInfo.fullName,
          email: completeTaxInfo.email,
          phone: completeTaxInfo.phone,
          home_address: completeTaxInfo.homeAddress,
          city: completeTaxInfo.city,
          state: completeTaxInfo.state,
          zip_code: completeTaxInfo.zipCode,
          filing_status: completeTaxInfo.filingStatus,
          dependents: completeTaxInfo.dependents,
          standard_deduction: completeTaxInfo.standardDeduction,
          custom_deduction: completeTaxInfo.customDeduction
        };

        console.log(`[handleSubmit] Client update data:`, updateData);

        const success = await CentralizedClientService.updateClient(initialData.id, updateData);
        
        if (success) {
          console.log(`[handleSubmit] Client update successful, now updating personal years and business data`);
          // Update personal years data
          try {
            // First, delete existing personal years for this client
            console.log(`[handleSubmit] Deleting existing personal years for client ${initialData.id}`);
            await supabase
              .from('personal_years')
              .delete()
              .eq('client_id', initialData.id);

            // Then insert the new personal years data
            if (completeTaxInfo.years && completeTaxInfo.years.length > 0) {
              const personalYearsData = completeTaxInfo.years.map(year => ({
                client_id: initialData.id,
                year: year.year,
                wages_income: year.wagesIncome || 0,
                passive_income: year.passiveIncome || 0,
                unearned_income: year.unearnedIncome || 0,
                capital_gains: year.capitalGains || 0,
                long_term_capital_gains: year.longTermCapitalGains || 0,
                household_income: year.householdIncome || 0,
                ordinary_income: year.ordinaryIncome || 0,
                is_active: year.isActive ?? true
              }));

              console.log(`[handleSubmit] Inserting personal years data:`, personalYearsData);

              const { error: personalYearsError } = await supabase
                .from('personal_years')
                .insert(personalYearsData);

              if (personalYearsError) {
                console.error(`[handleSubmit] Error saving personal years:`, personalYearsError);
                // Don't fail the whole operation, just log the error
              } else {
                console.log(`[handleSubmit] Personal years saved successfully`);
              }
            }

            // Update business data - Use upsert logic to prevent duplicates
            if (completeTaxInfo.businesses && completeTaxInfo.businesses.length > 0) {
              console.log(`[handleSubmit] Processing ${completeTaxInfo.businesses.length} businesses`);
              
              for (const business of completeTaxInfo.businesses) {
                console.log(`[handleSubmit] Processing business: ${business.businessName}`);
                console.log(`[handleSubmit] Business years:`, business.years);
                
                const businessData = {
                  client_id: initialData.id,
                  business_name: business.businessName,
                  entity_type: business.entityType === 'LLC' ? 'llc' :
                               business.entityType === 'S-Corp' ? 's_corp' :
                               business.entityType === 'C-Corp' ? 'corporation' :
                               business.entityType === 'Partnership' ? 'partnership' :
                               business.entityType === 'Sole Proprietorship' ? 'sole_proprietorship' :
                               'llc', // default to llc for 'Other'
                  ein: business.ein,
                  year_established: business.startYear,
                  business_address: business.businessAddress,
                  business_city: business.businessCity,
                  business_state: business.businessState,
                  business_zip: business.businessZip,
                  business_phone: business.businessPhone || null,
                  business_email: business.businessEmail || null,
                  industry: business.industry || null,
                  annual_revenue: business.annualRevenue || 0,
                  employee_count: business.employeeCount || 0,
                  is_active: business.isActive
                };

                // Check if business already exists for this client
                const { data: existingBusiness, error: checkError } = await supabase
                  .from('rd_businesses')
                  .select('id')
                  .eq('client_id', initialData.id)
                  .eq('business_name', business.businessName)
                  .eq('ein', business.ein || '')
                  .maybeSingle();

                if (checkError) {
                  console.error(`[handleSubmit] Error checking for existing business:`, checkError);
                  continue;
                }

                let businessResult;
                if (existingBusiness) {
                  // Update existing business
                  console.log(`[handleSubmit] Updating existing business ID: ${existingBusiness.id}`);
                  const { data: updateResult, error: updateError } = await supabase
                    .from('rd_businesses')
                    .update(businessData)
                    .eq('id', existingBusiness.id)
                    .select()
                    .single();

                  if (updateError) {
                    console.error(`[handleSubmit] Error updating business:`, updateError);
                    continue;
                  }
                  businessResult = updateResult;
                  console.log(`[handleSubmit] Business updated successfully with ID: ${businessResult.id}`);
                } else {
                  // Create new business
                  console.log(`[handleSubmit] Creating new business: ${business.businessName}`);
                  const { data: insertResult, error: insertError } = await supabase
                    .from('rd_businesses')
                    .insert(businessData)
                    .select()
                    .single();

                  if (insertError) {
                    console.error(`[handleSubmit] Error creating business:`, insertError);
                    continue;
                  }
                  businessResult = insertResult;
                  console.log(`[handleSubmit] Business created successfully with ID: ${businessResult.id}`);
                }

                // Save business years data using upsert logic
                if (business.years && business.years.length > 0) {
                  console.log(`[handleSubmit] Processing ${business.years.length} business years for business ${business.businessName}`);
                  
                  for (const year of business.years) {
                    const yearData = {
                      business_id: businessResult.id,
                      year: year.year,
                      is_active: year.isActive ?? true,
                      ordinary_k1_income: year.ordinaryK1Income || 0,
                      guaranteed_k1_income: year.guaranteedK1Income || 0,
                      annual_revenue: year.annualRevenue || 0,
                      employee_count: year.employeeCount || 0
                    };

                    // Use upsert to prevent duplicate business year records
                    const { error: upsertError } = await supabase
                      .from('rd_business_years')
                      .upsert(yearData, {
                        onConflict: 'business_id,year'
                      });

                    if (upsertError) {
                      console.error(`[handleSubmit] Error upserting business year ${year.year}:`, upsertError);
                    } else {
                      console.log(`[handleSubmit] Business year ${year.year} saved successfully for business ${business.businessName}`);
                    }
                  }
                }
              }
            }

            console.log(`[handleSubmit] All data saved successfully`);
            toast.success('Client updated successfully!');
            onClientCreated(completeTaxInfo);
            onClose();
          } catch (error) {
            console.error(`[handleSubmit] Error in data update process:`, error);
            // Still show success for the main client update
            toast.success('Client updated successfully! (Some data may not have been saved)');
            onClientCreated(completeTaxInfo);
            onClose();
          }
        }
      } else {
        // Create new client
        console.log(`[handleSubmit] Creating new client`);
        const createClientData = CentralizedClientService.transformTaxInfoToCreateData(completeTaxInfo);
        
        console.log(`[handleSubmit] Create client data:`, createClientData);
        
        const result = await CentralizedClientService.createClient(createClientData);
        
        console.log(`[handleSubmit] Create client result:`, result);
        
        if (result.success && result.clientId) {
          console.log(`[handleSubmit] Client created successfully with ID: ${result.clientId}`);
          toast.success('Client created successfully!');
          onClientCreated(completeTaxInfo);
          onClose();
        } else {
          console.error(`[handleSubmit] Failed to create client:`, result.error);
          setError(result.error || 'Failed to create client');
          toast.error(result.error || 'Failed to create client');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseSameEmail = (checked: boolean) => {
    setUseSameEmail(checked);
    if (checked) {
      setBusinesses(prev => prev.map(business => ({ ...business, businessEmail: formData.email })));
    }
  };

  const handleUseSameAddress = (checked: boolean) => {
    setUseSameAddress(checked);
    if (checked) {
      setBusinesses(prev => prev.map(business => ({ 
        ...business, 
        businessAddress: formData.homeAddress,
        businessCity: formData.city,
        businessState: formData.state,
        businessZip: formData.zipCode
      })));
    }
  };

  const handleEINChange = (e: React.ChangeEvent<HTMLInputElement>, businessIndex: number) => {
    const formattedEIN = formatEIN(e.target.value);
    handleBusinessInfoChange(businessIndex, 'ein', formattedEIN);
  };

  const copyPersonalEmail = (businessIndex: number) => {
    handleBusinessInfoChange(businessIndex, 'businessEmail', formData.email);
  };

  const BusinessForm = ({ 
    business, 
    onSave, 
    onCancel 
  }: { 
    business: BusinessFormData; 
    onSave: (business: BusinessFormData) => void; 
    onCancel: () => void; 
  }) => {
    const [localBusiness, setLocalBusiness] = useState(business);

    const handleChange = (field: keyof BusinessFormData, value: any) => {
      setLocalBusiness(prev => ({ ...prev, [field]: value }));
    };

    return (
      <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localBusiness.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              EIN
            </label>
            <input
              type="text"
              value={localBusiness.ein}
              onChange={(e) => handleChange('ein', formatEIN(e.target.value))}
              placeholder="XX-XXXXXXX"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type <span className="text-red-500">*</span>
            </label>
            <select
              value={localBusiness.entityType}
              onChange={(e) => handleChange('entityType', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="LLC">LLC</option>
              <option value="S-Corp">S-Corporation</option>
              <option value="C-Corp">C-Corporation</option>
              <option value="Partnership">Partnership</option>
              <option value="Sole-Proprietor">Sole Proprietor</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              value={localBusiness.industry}
              onChange={(e) => handleChange('industry', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            >
              <option value="">Select Industry</option>
              <option value="Technology">Technology</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Construction">Construction</option>
              <option value="Retail">Retail</option>
              <option value="Professional Services">Professional Services</option>
              <option value="Financial Services">Financial Services</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Transportation">Transportation</option>
              <option value="Education">Education</option>
              <option value="Food & Beverage">Food & Beverage</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Energy">Energy</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={localBusiness.startYear}
              onChange={(e) => handleChange('startYear', parseInt(e.target.value))}
              min="1900"
              max={new Date().getFullYear()}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Count
            </label>
            <input
              type="number"
              value={localBusiness.employeeCount}
              onChange={(e) => handleChange('employeeCount', parseInt(e.target.value))}
              min="0"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Address
            </label>
            <input
              type="text"
              value={localBusiness.businessAddress}
              onChange={(e) => handleChange('businessAddress', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business City
            </label>
            <input
              type="text"
              value={localBusiness.businessCity}
              onChange={(e) => handleChange('businessCity', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business State
            </label>
            <select
              value={localBusiness.businessState}
              onChange={(e) => handleChange('businessState', e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option value="">Select State</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="HI">Hawaii</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
              <option value="OH">Ohio</option>
              <option value="OK">Oklahoma</option>
              <option value="OR">Oregon</option>
              <option value="PA">Pennsylvania</option>
              <option value="RI">Rhode Island</option>
              <option value="SC">South Carolina</option>
              <option value="SD">South Dakota</option>
              <option value="TN">Tennessee</option>
              <option value="TX">Texas</option>
              <option value="UT">Utah</option>
              <option value="VT">Vermont</option>
              <option value="VA">Virginia</option>
              <option value="WA">Washington</option>
              <option value="WV">West Virginia</option>
              <option value="WI">Wisconsin</option>
              <option value="WY">Wyoming</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business ZIP
            </label>
            <input
              type="text"
              value={localBusiness.businessZip}
              onChange={(e) => handleChange('businessZip', formatZipCode(e.target.value))}
              placeholder="12345"
              maxLength={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Phone
            </label>
            <input
              type="text"
              value={localBusiness.businessPhone}
              onChange={(e) => handleChange('businessPhone', formatPhoneNumber(e.target.value))}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Email
          </label>
          <input
            type="email"
            value={localBusiness.businessEmail}
            onChange={(e) => handleChange('businessEmail', e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Annual Revenue
            </label>
            <NumericFormat
              value={localBusiness.annualRevenue}
              onValueChange={(values) => handleChange('annualRevenue', parseFloat(values.value) || 0)}
              thousandSeparator="," 
              prefix="$"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Count
            </label>
            <input
              type="number"
              value={localBusiness.employeeCount}
              onChange={(e) => handleChange('employeeCount', parseInt(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={localBusiness.isActive}
              onChange={() => handleChange('isActive', !localBusiness.isActive)}
              className="form-checkbox h-4 w-4 text-green-600"
            />
            <span className="text-xs text-gray-700">Active</span>
          </label>
        </div>

        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(localBusiness);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            Save Business
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <h2 className="text-2xl font-bold">New Client</h2>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 text-2xl font-bold transition-colors duration-200"
          >
            &times;
          </button>
        </div>

        <div className="flex h-[calc(90vh-80px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('personal')}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'personal'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Personal Information
              </button>
              <button
                onClick={() => {
                  setActiveTab('business');
                }}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'business'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Business Information
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  {/* Personal Info Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={formData.phone}
                          onChange={(e) => handlePersonalInfoChange('phone', formatPhoneNumber(e.target.value))}
                          placeholder="(555) 123-4567"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Filing Status <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.filingStatus}
                          onChange={(e) => handlePersonalInfoChange('filingStatus', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        >
                          <option value="single">Single</option>
                          <option value="married_joint">Married Filing Jointly</option>
                          <option value="married_separate">Married Filing Separately</option>
                          <option value="head_household">Head of Household</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={formData.homeAddress}
                          onChange={(e) => handlePersonalInfoChange('homeAddress', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter city"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State
                        </label>
                        <select
                          value={formData.state}
                          onChange={(e) => handlePersonalInfoChange('state', e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select State</option>
                          <option value="AL">Alabama</option>
                          <option value="AK">Alaska</option>
                          <option value="AZ">Arizona</option>
                          <option value="AR">Arkansas</option>
                          <option value="CA">California</option>
                          <option value="CO">Colorado</option>
                          <option value="CT">Connecticut</option>
                          <option value="DE">Delaware</option>
                          <option value="FL">Florida</option>
                          <option value="GA">Georgia</option>
                          <option value="HI">Hawaii</option>
                          <option value="ID">Idaho</option>
                          <option value="IL">Illinois</option>
                          <option value="IN">Indiana</option>
                          <option value="IA">Iowa</option>
                          <option value="KS">Kansas</option>
                          <option value="KY">Kentucky</option>
                          <option value="LA">Louisiana</option>
                          <option value="ME">Maine</option>
                          <option value="MD">Maryland</option>
                          <option value="MA">Massachusetts</option>
                          <option value="MI">Michigan</option>
                          <option value="MN">Minnesota</option>
                          <option value="MS">Mississippi</option>
                          <option value="MO">Missouri</option>
                          <option value="MT">Montana</option>
                          <option value="NE">Nebraska</option>
                          <option value="NV">Nevada</option>
                          <option value="NH">New Hampshire</option>
                          <option value="NJ">New Jersey</option>
                          <option value="NM">New Mexico</option>
                          <option value="NY">New York</option>
                          <option value="NC">North Carolina</option>
                          <option value="ND">North Dakota</option>
                          <option value="OH">Ohio</option>
                          <option value="OK">Oklahoma</option>
                          <option value="OR">Oregon</option>
                          <option value="PA">Pennsylvania</option>
                          <option value="RI">Rhode Island</option>
                          <option value="SC">South Carolina</option>
                          <option value="SD">South Dakota</option>
                          <option value="TN">Tennessee</option>
                          <option value="TX">Texas</option>
                          <option value="UT">Utah</option>
                          <option value="VT">Vermont</option>
                          <option value="VA">Virginia</option>
                          <option value="WA">Washington</option>
                          <option value="WV">West Virginia</option>
                          <option value="WI">Wisconsin</option>
                          <option value="WY">Wyoming</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          value={formData.zipCode}
                          onChange={(e) => handlePersonalInfoChange('zipCode', formatZipCode(e.target.value))}
                          placeholder="12345"
                          maxLength={5}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Dependents <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={formData.dependents || 0}
                          onChange={(e) => handlePersonalInfoChange('dependents', parseInt(e.target.value) || 0)}
                          min="0"
                          max="20"
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Business Owner
                        </label>
                        <select
                          value={formData.businessOwner ? 'true' : 'false'}
                          onChange={(e) => handlePersonalInfoChange('businessOwner', e.target.value === 'true')}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Personal Years Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Personal Tax Years</h3>
                      <button
                        type="button"
                        onClick={addNewYear}
                        className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-medium"
                      >
                        Add Year
                      </button>
                    </div>
                    
                    {/* Personal Income Summary */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">Income Summary</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-blue-800">Total Years</p>
                          <p className="text-xl font-bold text-blue-900">{formData.years.length}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-green-800">Total Wages</p>
                          <p className="text-xl font-bold text-green-900">
                            {formatCurrency(formData.years.reduce((sum, year) => sum + (year.wagesIncome || 0), 0))}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-purple-800">Total K-1 Income</p>
                          <p className="text-xl font-bold text-purple-900">
                            {formatCurrency(businesses.reduce((sum, business) => 
                              sum + business.years.reduce((yearSum, year) => 
                                yearSum + (year.ordinaryK1Income || 0) + (year.guaranteedK1Income || 0), 0
                              ), 0
                            ))}
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-orange-800">Total Other Income</p>
                          <p className="text-xl font-bold text-orange-900">
                            {formatCurrency(formData.years.reduce((sum, year) => 
                              sum + (year.passiveIncome || 0) + (year.capitalGains || 0) + (year.unearnedIncome || 0), 0
                            ))}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.years.map((year, index) => (
                        <div key={year.year} className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-lg font-semibold text-gray-800">Year {year.year}</h4>
                            {formData.years.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePersonalYear(year.year)}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">W2 Income</label>
                              <NumericFormat
                                value={year.wagesIncome}
                                onValueChange={(values) => handlePersonalYearChange(year.year, 'wagesIncome', parseFloat(values.value) || 0)}
                                thousandSeparator="," prefix="$"
                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Passive Income</label>
                              <NumericFormat
                                value={year.passiveIncome}
                                onValueChange={(values) => handlePersonalYearChange(year.year, 'passiveIncome', parseFloat(values.value) || 0)}
                                thousandSeparator="," prefix="$"
                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Capital Gains</label>
                              <NumericFormat
                                value={year.capitalGains}
                                onValueChange={(values) => handlePersonalYearChange(year.year, 'capitalGains', parseFloat(values.value) || 0)}
                                thousandSeparator="," prefix="$"
                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Unearned Income</label>
                              <NumericFormat
                                value={year.unearnedIncome}
                                onValueChange={(values) => handlePersonalYearChange(year.year, 'unearnedIncome', parseFloat(values.value) || 0)}
                                thousandSeparator="," prefix="$"
                                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          
                          {/* K-1 Income Section for this year */}
                          {businesses.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <h5 className="text-md font-semibold text-gray-700 mb-3">K-1 Income for {year.year}</h5>
                              <div className="space-y-3">
                                {businesses.map((business, businessIndex) => {
                                  if (!business.years || !Array.isArray(business.years)) return null;
                                  const businessYear = business.years.find(by => by.year === year.year);
                                  if (!businessYear) return null;
                                  
                                  return (
                                    <div key={businessIndex} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                      <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-gray-700">{business.businessName}</span>
                                        <div className="flex items-center space-x-2">
                                          <label className="flex items-center space-x-1">
                                            <input
                                              type="checkbox"
                                              checked={businessYear.isActive}
                                              onChange={() => handleYearChange(businessIndex, business.years.indexOf(businessYear), 'isActive', !businessYear.isActive)}
                                              className="form-checkbox h-4 w-4 text-green-600"
                                            />
                                            <span className="text-xs text-gray-700">Active</span>
                                          </label>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const yearIndex = business.years.indexOf(businessYear);
                                              if (yearIndex > -1) {
                                                const newYears = [...business.years];
                                                newYears.splice(yearIndex, 1);
                                                handleBusinessInfoChange(businessIndex, 'years', newYears);
                                              }
                                            }}
                                            className="text-xs text-red-600 hover:text-red-800"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Ordinary K-1</label>
                                          <NumericFormat
                                            value={businessYear.ordinaryK1Income || 0}
                                            onValueChange={(values) => handleYearChange(businessIndex, business.years.indexOf(businessYear), 'ordinaryK1Income', parseFloat(values.value) || 0)}
                                            thousandSeparator="," prefix="$"
                                            className="w-full px-2 py-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Guaranteed K-1</label>
                                          <NumericFormat
                                            value={businessYear.guaranteedK1Income || 0}
                                            onValueChange={(values) => handleYearChange(businessIndex, business.years.indexOf(businessYear), 'guaranteedK1Income', parseFloat(values.value) || 0)}
                                            thousandSeparator="," prefix="$"
                                            className="w-full px-2 py-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-xs font-medium text-gray-600 mb-1">Gross Receipts</label>
                                          <NumericFormat
                                            value={businessYear.annualRevenue}
                                            onValueChange={(values) => handleYearChange(businessIndex, business.years.indexOf(businessYear), 'annualRevenue', parseFloat(values.value) || 0)}
                                            thousandSeparator="," prefix="$"
                                            className="w-full px-2 py-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'business' && (
                <div className="space-y-6">
                  {/* Business Form Modal */}
                  {editingBusinessIndex !== null && (
                    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
                        <BusinessForm
                          business={businesses[editingBusinessIndex]}
                          onSave={(updatedBusiness) => {
                            setBusinesses(prev => prev.map((business, index) => 
                              index === editingBusinessIndex ? updatedBusiness : business
                            ));
                            setEditingBusinessIndex(null);
                            // Update personal income after business is saved
                            setTimeout(() => updatePersonalIncomeFromBusinesses(), 0);
                          }}
                          onCancel={() => setEditingBusinessIndex(null)}
                        />
                      </div>
                    </div>
                  )}

                  {/* Business Summary Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-800">Business Information</h3>
                      <button
                        type="button"
                        onClick={addBusiness}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 font-medium"
                      >
                        Add Business
                      </button>
                    </div>

                    {/* Business Cards */}
                    <div className="space-y-4">
                      {businesses.map((business, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800">{business.businessName || 'New Business'}</h4>
                              <p className="text-sm text-gray-600">{business.entityType} • {business.industry}</p>
                            </div>
                            <div className="flex space-x-2 items-center">
                              <label className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={business.isActive}
                                  onChange={() => handleBusinessInfoChange(index, 'isActive', !business.isActive)}
                                  className="form-checkbox h-4 w-4 text-green-600"
                                />
                                <span className="text-xs text-gray-700">Active</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => setEditingBusinessIndex(index)}
                                className="px-3 py-1 text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => removeBusiness(index)}
                                className="px-3 py-1 text-red-600 hover:text-red-800 font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {/* K-1 entry per year */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            {business.years && Array.isArray(business.years) ? business.years.map((year, yIdx) => (
                              <div key={year.year} className="bg-gray-50 rounded-lg p-3 border border-gray-100 mb-2">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-gray-700">{year.year}</span>
                                </div>
                                <div className="flex space-x-2">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Ordinary K-1</label>
                                    <NumericFormat
                                      value={year.ordinaryK1Income || 0}
                                      onValueChange={(values) => handleYearChange(index, business.years.indexOf(year), 'ordinaryK1Income', parseFloat(values.value) || 0)}
                                      thousandSeparator="," prefix="$"
                                      className="w-full px-2 py-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Guaranteed K-1</label>
                                    <NumericFormat
                                      value={year.guaranteedK1Income || 0}
                                      onValueChange={(values) => handleYearChange(index, business.years.indexOf(year), 'guaranteedK1Income', parseFloat(values.value) || 0)}
                                      thousandSeparator="," prefix="$"
                                      className="w-full px-2 py-1 rounded-md border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                  </div>
                                </div>
                              </div>
                            )) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Income Summary Section */}
                  {businesses.length > 0 && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
                      <h3 className="text-xl font-bold text-gray-800 mb-4">Income Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-600">Total Businesses</p>
                          <p className="text-2xl font-bold text-blue-600">{businesses.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-600">Total Years</p>
                          <p className="text-2xl font-bold text-green-600">
                            {businesses.reduce((sum, business) => sum + (business.years && Array.isArray(business.years) ? business.years.length : 0), 0)}
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-600">Total Employees</p>
                          <p className="text-2xl font-bold text-purple-600">
                            {businesses.reduce((sum, business) => sum + (business.employeeCount || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="sticky bottom-0 left-0 w-full flex justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50 z-10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting 
                    ? (initialData?.id ? 'Saving...' : 'Creating...') 
                    : (initialData?.id ? 'Save Updates' : 'Create Client')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewClientModal; 