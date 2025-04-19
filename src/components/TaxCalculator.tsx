import React, { useState, useEffect } from 'react';
import InfoForm from './InfoForm';
import TaxResults from './TaxResults';
import { TaxInfo, TaxStrategy, SavedCalculation } from '../types';
import { useTaxStore } from '../store/taxStore';
import { useUserStore } from '../store/userStore';
import { supabase } from '../lib/supabase';

const TaxCalculator: React.FC = () => {
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserStore();
  const { 
    taxInfo, 
    setTaxInfo, 
    selectedYear, 
    setSelectedYear,
    selectedStrategies,
    setSelectedStrategies,
    savedCalculations,
    setSavedCalculations,
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
          throw new Error('Failed to load your saved calculations');
        }

        if (data) {
          console.log('Found saved calculation:', data.id);
          await loadCalculation(data.id);
          if (mounted) {
            setShowResults(true);
          }
        } else {
          console.log('No saved calculations found');
          if (mounted) {
            setShowResults(false);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'An error occurred while loading your data');
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
  }, [user?.id]); // Only depend on user.id instead of the entire user object

  const handleInfoSubmit = (info: TaxInfo, year: number) => {
    setTaxInfo(info);
    setSelectedYear(year);
    setShowResults(true);
  };

  const handleStrategiesSelect = (strategies: TaxStrategy[]) => {
    setSelectedStrategies(strategies);
  };

  const handleSaveCalculation = (calc: SavedCalculation) => {
    setSavedCalculations([...savedCalculations, calc]);
  };

  const handleStrategyAction = (strategyId: string, action: string) => {
    // Handle strategy actions here
    console.log('Strategy action:', strategyId, action);
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
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!showResults ? (
        <InfoForm onSubmit={handleInfoSubmit} />
      ) : taxInfo ? (
        <TaxResults
          taxInfo={taxInfo}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onStrategiesSelect={handleStrategiesSelect}
          onSaveCalculation={handleSaveCalculation}
          onStrategyAction={handleStrategyAction}
        />
      ) : null}
    </div>
  );
};

export default TaxCalculator; 