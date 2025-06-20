import React, { useState, useEffect } from 'react';
import InfoForm from './InfoForm';
import TaxResults from './TaxResults';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../types/tax';
import { useTaxStore } from '../store/taxStore';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';
import { User } from '../types/user';

const TaxCalculator: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();
  const { 
    tax_info, 
    setTaxInfo, 
    strategies,
    setStrategies,
    saveCalculation,
    loadCalculation
  } = useTaxStore();

  useEffect(() => {
    let mounted = true;

    const loadUserData = async () => {
      if (!mounted) return;
      
      try {
        setLoading(true);
        setError(null);
        
        if (!user) {
          console.log('No user found, showing info form');
          setShowResults(false);
          setLoading(false);
          return;
        }

        console.log('Loading data for user:', user.email);
        
        // Load the most recent calculation for the user
        const { data, error } = await supabase
          .from('tax_calculations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!mounted) return;

        if (error) {
          console.error('Error loading calculation:', error);
          if (error.code === 'PGRST116') {
            console.log('No calculations found for user');
            setShowResults(false);
            setLoading(false);
            return;
          }
          let errorMessage = 'Failed to load your saved calculations';
          if (error.message) {
            errorMessage = error.message;
          }
          throw new Error(errorMessage);
        }

        if (data) {
          console.log('Found saved calculation:', data.id);
          await loadCalculation(new Date().getFullYear());
          if (mounted) {
            setShowResults(true);
          }
        } else {
          console.log('No saved calculations found');
          if (mounted) {
            setShowResults(false);
          }
        }
      } catch (error: unknown) {
        console.error('Error loading user data:', error);
        if (mounted) {
          let errorMessage = 'An unexpected error occurred while loading user data';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = String(error.message);
          }
          setError(errorMessage);
          setShowResults(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadUserData();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  const handleInfoSubmit = async (info: TaxInfo) => {
    if (!user) {
      console.error('No user found in handleInfoSubmit');
      setError('No user found. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting tax profile update for user:', user.id);
      
      // First, update the user profile to mark tax profile as completed
      console.log('Updating profiles table...');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ has_completed_tax_profile: true })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Failed to update tax profile status:', updateError);
        throw new Error(`Failed to update tax profile status: ${updateError.message}`);
      }

      // Convert camelCase to snake_case for database
      const profileData = {
        user_id: user.id,
        home_address: info.home_address || null,
        business_name: info.business_name || null,
        business_address: info.business_address || null,
        household_income: info.household_income || 0,
        filing_status: info.filing_status,
        state: info.state,
        entity_type: info.entity_type || null,
        dependents: info.dependents,
        wages_income: info.wages_income || 0,
        passive_income: info.passive_income || 0,
        unearned_income: info.unearned_income || 0,
        capital_gains: info.capital_gains || 0,
        business_owner: info.business_owner || false,
        ordinary_k1_income: info.ordinary_k1_income || 0,
        guaranteed_k1_income: info.guaranteed_k1_income || 0,
        standard_deduction: info.standard_deduction || false,
        custom_deduction: info.custom_deduction || 0
      };

      console.log('Preparing to save tax profile data:', profileData);

      // Check for existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('tax_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching tax profile:', fetchError);
        throw new Error(`Failed to check existing tax profile: ${fetchError.message}`);
      }

      let result;
      if (existingProfile) {
        console.log('Updating existing tax profile...');
        result = await supabase
          .from('tax_profiles')
          .update(profileData)
          .eq('user_id', user.id);
      } else {
        console.log('Creating new tax profile...');
        result = await supabase
          .from('tax_profiles')
          .insert([profileData]);
      }

      if (result.error) {
        console.error('Error saving tax profile:', result.error);
        throw new Error(`Failed to save tax information: ${result.error.message}`);
      }

      console.log('Successfully saved tax profile');
      // Update the tax store with the new info
      setTaxInfo(info);
      setShowResults(true);
    } catch (error: unknown) {
      console.error('Error in handleInfoSubmit:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      let errorMessage = 'An unexpected error occurred while saving your tax information';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      setError(errorMessage);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStrategiesSelect = (selectedStrategies: TaxStrategy[]) => {
    setStrategies(selectedStrategies);
  };

  const handleSaveCalculation = async () => {
    try {
      await saveCalculation();
    } catch (error) {
      console.error('Error saving calculation:', error);
      setError('Failed to save calculation. Please try again.');
    }
  };

  const updateUserProfile = async (data: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          email: data.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;
    } catch (err) {
      console.error('Error updating user profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!showResults ? (
        <InfoForm onSubmit={handleInfoSubmit} initialData={tax_info} />
      ) : (
        <TaxResults
          taxInfo={tax_info}
          strategies={strategies}
          onStrategiesSelect={handleStrategiesSelect}
          onSaveCalculation={handleSaveCalculation}
        />
      )}
    </div>
  );
};

export default TaxCalculator; 