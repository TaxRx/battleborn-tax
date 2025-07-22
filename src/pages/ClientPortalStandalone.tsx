import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Download, FileText, CheckCircle, Clock, AlertCircle, Eye, PenTool, User, Building2 } from 'lucide-react';

// Completely isolated supabase client for portal only
const PORTAL_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const PORTAL_SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const portalClient = createClient(PORTAL_SUPABASE_URL, PORTAL_SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  }
});

interface Business {
  id: string;
  name: string;
  business_years: BusinessYear[];
}

interface BusinessYear {
  id: string;
  year: number;
  total_qre: number;
  federal_credit: number;
  state_credit: number;
}

const ClientPortalStandalone: React.FC = () => {
  const { businessId, token } = useParams<{ businessId: string; token: string }>();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    const validateTokenAndLoadData = async () => {
      try {
        console.log('🔐 Validating token:', { businessId, token: token?.substring(0, 10) + '...' });
        
        if (!businessId || !token) {
          throw new Error('Missing business ID or token');
        }

        // Step 1: Validate token
        const { data: validationData, error: validationError } = await portalClient
          .rpc('validate_portal_token', {
            token_value: token,
            business_uuid: businessId
          });

        console.log('🔐 Token validation result:', { validationData, validationError });

        if (validationError || !validationData) {
          throw new Error('Invalid or expired token');
        }

        setTokenValid(true);

        // Step 2: Load business data
        const { data: businessData, error: businessError } = await portalClient
          .from('rd_businesses')
          .select(`
            id,
            name,
            business_years:rd_business_years(
              id,
              year,
              total_qre,
              federal_credit,
              state_credit
            )
          `)
          .eq('id', businessId)
          .single();

        console.log('📊 Business data loaded:', { businessData, businessError });

        if (businessError) {
          throw new Error('Failed to load business data');
        }

        setBusiness(businessData);
      } catch (err) {
        console.error('❌ Portal error:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    validateTokenAndLoadData();
  }, [businessId, token]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your R&D report...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !tokenValid || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600 mb-4">
              {error || 'This link has expired or is invalid.'}
            </p>
            <p className="text-sm text-gray-500">
              Please contact your advisor for a new access link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - show business data
  const currentYear = business.business_years?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{business.name}</h1>
                <p className="text-sm text-gray-500">R&D Tax Credit Report</p>
              </div>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Verified Access
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentYear ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QRE Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Qualified Research Expenses</h3>
                <Calendar className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                ${currentYear.total_qre?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-gray-500">Tax Year {currentYear.year}</p>
            </div>

            {/* Federal Credit Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Federal Credit</h3>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">
                ${currentYear.federal_credit?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-gray-500">Estimated Benefit</p>
            </div>

            {/* State Credit Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">State Credit</h3>
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ${currentYear.state_credit?.toLocaleString() || '0'}
              </div>
              <p className="text-sm text-gray-500">Additional Benefit</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report In Progress</h3>
            <p className="text-gray-600">
              Your R&D tax credit analysis is being prepared. Please check back soon.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">
              This report was generated specifically for {business.name}
            </p>
            <p className="text-xs text-gray-400">
              For questions about this report, please contact your advisor
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalStandalone; 