import React, { useState } from 'react';
import { useAugustaStore } from '../../store/augustaStore';
import { useTaxStore } from '../../store/taxStore';
import Navigation from '../Navigation';
import PartiesInfo from './PartiesInfo';
import RentalInfo from './RentalInfo';
import DatesInfo from './DatesInfo';

interface AugustaRuleWizardProps {
  onClose: () => void;
}

export default function AugustaRuleWizard({ onClose }: AugustaRuleWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const augustaStore = useAugustaStore();
  const { taxInfo, selectedYear, updateStrategy } = useTaxStore();

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const handleSaveStep = async (step: number, data: any) => {
    switch (step) {
      case 1:
        augustaStore.setPartiesInfo(data);
        break;
      case 2:
        augustaStore.setRentalInfo(data);
        break;
      case 3:
        augustaStore.setDatesInfo(data);
        // Calculate total rental income
        const totalRental = data.dates.reduce((sum: number, date: any) => sum + date.rate, 0);
        
        // Update the Augusta Rule strategy with the new details
        await updateStrategy('augusta_rule', {
          augustaRule: {
            daysRented: data.dates.length,
            dailyRate: totalRental / data.dates.length,
            dates: data.dates,
            partiesInfo: augustaStore.partiesInfo,
            rentalInfo: augustaStore.rentalInfo
          }
        });
        
        onClose();
        break;
    }
  };

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  // Add a dummy onViewChange handler since this is a wizard and doesn't need actual view changes
  const handleViewChange = () => {
    // In the wizard context, view changes should close the wizard
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PartiesInfo
            formData={{
              businessInfo: {
                businessAddress: taxInfo?.businessAddress || ''
              }
            }}
            onNext={() => setCurrentStep(2)}
            onBack={handleBack}
            onSave={(data) => handleSaveStep(1, data)}
          />
        );
      case 2:
        return (
          <RentalInfo
            onNext={() => setCurrentStep(3)}
            onBack={handleBack}
            onSave={(data) => handleSaveStep(2, data)}
          />
        );
      case 3:
        return (
          <DatesInfo
            onNext={onClose}
            onBack={handleBack}
            onSave={(data) => handleSaveStep(3, data)}
            dailyRate={augustaStore.rentalInfo?.rentalInfo?.dailyRate || 0}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        isMobile={isMobile}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onClose={onClose}
        onViewChange={handleViewChange}
      />

      <div className={`${isMobile ? 'ml-0' : 'ml-64'}`}>
        <div className="max-w-7xl mx-auto">
          {/* Progress Bar */}
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Augusta Rule Setup</h1>
              <div className="text-lg font-medium text-navy">
                Tax Year {selectedYear}
              </div>
            </div>

            <div className="flex items-center">
              {[
                { id: 1, label: 'Parties Info' },
                { id: 2, label: 'Rental Info' },
                { id: 3, label: 'Dates' }
              ].map((step, index, steps) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => handleStepChange(step.id)}
                    className={`flex items-center ${
                      currentStep >= step.id ? 'text-navy' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        currentStep >= step.id ? 'bg-navy text-white' : 'bg-gray-200'
                      }`}
                    >
                      {step.id}
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
        </div>
      </div>
    </div>
  );
}