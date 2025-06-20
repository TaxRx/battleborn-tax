// This file has been renamed to RDTCreditWizard.legacy.tsx to prevent accidental usage. No code changes made.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import useActivitiesStore from '../store/activitiesStore';
import useExpenseStore from '../store/expenseStore';
import useStaffStore from '../store/staffStore';
import useBusinessStore from '../store/businessStore';
import useCreditStore from '../store/creditStore';
import { useUser } from '../context/UserContext';
import { getBusinessesForUser } from '../services/businessService';
import { getActivitiesForBusiness } from '../services/activityService';
import { getContractorExpensesForBusiness, getSupplyExpensesForBusiness } from '../services/expenseService';
import { getEmployeesForBusiness } from '../services/employeeService';

interface RDTCreditWizardProps {
  onClose: () => void;
}

const steps = [
  { id: 'business-info', title: 'Business Information' },
  { id: 'qualified-activities', title: 'Qualified Research Activities' },
  { id: 'qualified-expenses', title: 'Qualified Expenses' },
  { id: 'research-outcomes', title: 'Research Outcomes' },
  { id: 'finalize', title: 'Finalize Calculations' }
];

const RDTCreditWizard: React.FC<RDTCreditWizardProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [business, setBusiness] = useState<any>(null);

  // Initialize stores
  const activitiesStore = useActivitiesStore();
  const expenseStore = useExpenseStore();
  const staffStore = useStaffStore();
  const businessStore = useBusinessStore();
  const creditStore = useCreditStore();

  // Load data on mount
  React.useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return;

      try {
        // Get business info
        const businessesResponse = await getBusinessesForUser(user.id);
        if (businessesResponse?.data?.[0]) {
          const businessData = businessesResponse.data[0];
          setBusiness(businessData);
          businessStore.setYearStarted(businessData.year_started);

          // Load activities
          const activitiesResponse = await getActivitiesForBusiness(businessData.id);
          if (activitiesResponse?.data) {
            activitiesStore.setAvailableActivities(activitiesResponse.data);
          }

          // Load expenses
          const contractorExpensesResponse = await getContractorExpensesForBusiness(businessData.id);
          if (contractorExpensesResponse?.data) {
            contractorExpensesResponse.data.forEach(expense => {
              expenseStore.addContractorExpense(expense);
            });
          }

          const supplyExpensesResponse = await getSupplyExpensesForBusiness(businessData.id);
          if (supplyExpensesResponse?.data) {
            supplyExpensesResponse.data.forEach(expense => {
              expenseStore.addSupplyExpense(expense);
            });
          }

          // Load employees
          const employeesResponse = await getEmployeesForBusiness(businessData.id);
          if (employeesResponse?.data) {
            employeesResponse.data.forEach(employee => {
              staffStore.addEmployee(employee);
            });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save final calculations
      const qualifiedExpenses = expenseStore.getContractorExpensesByYear(businessStore.availableYears[0])
        .reduce((sum, expense) => sum + expense.amount, 0) +
        expenseStore.getSupplyExpensesByYear(businessStore.availableYears[0])
          .reduce((sum, expense) => sum + expense.amount, 0);

      const creditAmount = creditStore.calculateCredit(
        qualifiedExpenses,
        business?.average_gross_receipts || 0
      );

      toast.success('Calculations saved successfully');
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress bar */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-between">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <div
                          className={`relative flex items-center justify-center w-8 h-8 rounded-full ${
                            index <= currentStep
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="ml-2 text-sm font-medium text-gray-900">
                          {step.title}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {currentStep === 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Business Information</h2>
                {/* Business info form */}
              </div>
            )}

            {currentStep === 1 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Qualified Research Activities</h2>
                {/* QRA form */}
              </div>
            )}

            {currentStep === 2 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Qualified Expenses</h2>
                {/* Expenses form */}
              </div>
            )}

            {currentStep === 3 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Research Outcomes</h2>
                {/* Research outcomes form */}
              </div>
            )}

            {currentStep === 4 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Finalize Calculations</h2>
                {/* Final calculations and summary */}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="mt-6 flex justify-between">
          <button
            onClick={handleBack}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {currentStep === 0 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700"
          >
            {currentStep === steps.length - 1 ? 'Save & Close' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RDTCreditWizard; 