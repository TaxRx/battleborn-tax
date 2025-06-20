import React, { useState, useEffect } from 'react';
import { useRDTWizardStore, RDTWizardTypes } from './rdtWizardStore';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import QRAForm from './QRAForm';
import EmployeeForm from './EmployeeForm';
import ContractorForm from './ContractorForm';
import SupplyForm from './SupplyForm';
import Summary from './Summary';
import BusinessInfoStep from './BusinessInfoStep';
import QRAStep from './QRAStep';
import { QRAEntry } from './QRAFormModal';
import { BusinessInfo as BusinessInfoModal } from './BusinessInfoModal';
import { useUser } from '../../context/UserContext';
import { v4 as uuidv4 } from 'uuid';

interface RDTCreditWizardProps {
  onClose: () => void;
}

export default function RDTCreditWizard({ onClose }: RDTCreditWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoModal | null>(null);
  const [qras, setQRAs] = useState<QRAEntry[]>([]);
  const {
    employees,
    contractors,
    supplies,
    loading,
    error,
    fetchWizardData,
    updateQRA,
    updateEmployee,
    updateContractor,
    updateSupply,
    saveCalculation
  } = useRDTWizardStore();
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      fetchWizardData(user.id);
    }
  }, [user]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handleSaveStep = async (step: number, data: any) => {
    switch (step) {
      case 1:
        await updateQRA(data);
        break;
      case 2:
        await updateEmployee(data);
        break;
      case 3:
        await updateContractor(data);
        break;
      case 4:
        await updateSupply(data);
        break;
      case 5:
        // Handle final calculation
        break;
    }
    handleNext();
  };

  const handleComplete = async () => {
    // Calculate totalQRE and totalCredit
    const totalQRE = employees.reduce((sum, emp) => sum + emp.salary, 0)
      + contractors.reduce((sum, con) => sum + con.amount, 0)
      + supplies.reduce((sum, sup) => sum + sup.amount, 0);
    const totalCredit = totalQRE * 0.14;
    const calculation: RDTWizardTypes.Calculation = {
      id: uuidv4(),
      userId: user?.id || '',
      year: new Date().getFullYear(),
      qras,
      employees,
      contractors,
      supplies,
      totalCredit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveCalculation(calculation);
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessInfoStep
            businessInfo={businessInfo}
            setBusinessInfo={setBusinessInfo}
            onNext={() => setCurrentStep(2)}
          />
        );
      case 2:
        if (!businessInfo) return null;
        return (
          <QRAStep
            qras={qras}
            setQRAs={setQRAs}
            onNext={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
            businessCategory={businessInfo.category}
            businessFocus={businessInfo.focuses[0]}
          />
        );
      case 3:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Employee Information</h3>
            <EmployeeForm
              initialData={employees[0]}
              qras={qras}
              onSave={(data) => handleSaveStep(2, data)}
              onBack={handleBack}
            />
          </div>
        );
      case 4:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Contractor Information</h3>
            <ContractorForm
              initialData={contractors[0]}
              qras={qras}
              onSave={(data) => handleSaveStep(3, data)}
              onBack={handleBack}
            />
          </div>
        );
      case 5:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Supply Expenses</h3>
            <SupplyForm
              initialData={supplies[0]}
              qras={qras}
              onSave={(data) => handleSaveStep(4, data)}
              onBack={handleBack}
            />
          </div>
        );
      case 6:
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium mb-4">Calculation Summary</h3>
            <Summary
              qras={qras}
              employees={employees}
              contractors={contractors}
              supplies={supplies}
              onBack={handleBack}
              onComplete={handleComplete}
            />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg">
        <h3 className="text-red-600 font-bold mb-2">Error</h3>
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Progress Bar */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">R&D Tax Credit Setup</h1>
            <div className="text-lg font-medium text-navy">
              Tax Year {new Date().getFullYear()}
            </div>
          </div>

          <div className="flex items-center">
            {[
              { id: 1, label: 'Business Info' },
              { id: 2, label: 'QRAs' },
              { id: 3, label: 'Employees' },
              { id: 4, label: 'Contractors' },
              { id: 5, label: 'Supplies' },
              { id: 6, label: 'Summary' }
            ].map((step, index, steps) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center ${
                    currentStep >= step.id ? 'text-navy' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep >= step.id ? 'bg-navy text-white' : 'bg-gray-200'
                    }`}
                  >
                    {currentStep > step.id ? <Check size={20} /> : step.id}
                  </div>
                  <span className="ml-2">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      currentStep > step.id ? 'bg-navy' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
          <div className="max-w-7xl mx-auto flex justify-between">
            <button
              onClick={handleBack}
              className="px-6 py-2 border rounded-lg flex items-center space-x-2 hover:bg-gray-50"
            >
              <ArrowLeft size={20} />
              <span>Back</span>
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg flex items-center space-x-2 hover:bg-emerald-700"
            >
              <span>Next</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 