import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Isolated supabase client for testing
const testSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

const ClientPortalTest: React.FC = () => {
  const { businessId, token } = useParams<{ businessId: string; token: string }>();
  const [status, setStatus] = useState<string>('Testing...');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    testTokenValidation();
  }, [businessId, token]);

  const testTokenValidation = async () => {
    try {
      setStatus('Validating token with isolated supabase client...');
      
      const { data, error } = await testSupabase.rpc('validate_portal_token', {
        p_token: token,
        p_ip_address: null
      });

      if (error) {
        setStatus(`❌ Token validation failed: ${error.message}`);
        setTokenValid(false);
        return;
      }

      if (!data || data.length === 0 || !data[0].is_valid) {
        setStatus('❌ Token is invalid or expired');
        setTokenValid(false);
        return;
      }

      setStatus('✅ Token validation successful! Isolated client working correctly.');
      setTokenValid(true);

    } catch (error) {
      setStatus(`❌ Error: ${error.message}`);
      setTokenValid(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Client Portal Token Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Business ID:</label>
            <p className="text-sm text-gray-600">{businessId}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Token (first 20 chars):</label>
            <p className="text-sm text-gray-600 font-mono">{token?.substring(0, 20)}...</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Status:</label>
            <p className={`text-sm ${tokenValid === true ? 'text-green-600' : tokenValid === false ? 'text-red-600' : 'text-yellow-600'}`}>
              {status}
            </p>
          </div>
          
          <button 
            onClick={testTokenValidation}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Test Again
          </button>
          
          {tokenValid && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                🎉 Token system is working correctly! The isolated supabase client successfully validated the token without interference from the main app's authentication system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPortalTest; 