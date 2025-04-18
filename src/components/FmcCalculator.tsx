import React, { useEffect } from 'react';

interface FmcCalculations {
  federalSavings: number;
  stateSavings: number;
  managementFee: number;
  totalBenefit?: number;
  totalSavings?: number;
  businessIncome?: number;
  managementFeePercent?: number;
}

interface SavingsChangeProps {
  familyManagementCompany: FmcCalculations;
}

const FmcCalculator: React.FC<{ onSavingsChange: (calculations: SavingsChangeProps) => void }> = ({ onSavingsChange }) => {
  const [calculations, setCalculations] = React.useState<FmcCalculations>({
    federalSavings: 0,
    stateSavings: 0,
    managementFee: 0
  });

  const [businessIncome, setBusinessIncome] = React.useState(0);
  const [managementFeePercent, setManagementFeePercent] = React.useState(0);

  useEffect(() => {
    const federalSavings = calculations.federalSavings || 0;
    const stateSavings = calculations.stateSavings || 0;
    const totalBenefit = federalSavings + stateSavings;

    onSavingsChange({
      familyManagementCompany: {
        ...calculations,
        businessIncome,
        managementFeePercent,
        totalBenefit,
        totalSavings: totalBenefit
      }
    });
  }, [calculations, businessIncome, managementFeePercent, onSavingsChange]);

  return (
    <div>
      {/* Render your component content here */}
    </div>
  );
};

export default FmcCalculator; 