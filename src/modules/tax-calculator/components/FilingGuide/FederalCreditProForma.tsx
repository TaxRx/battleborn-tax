import React, { useState } from 'react';
import { Form6765 } from './Form6765';
import Form6765v2024 from './Form6765v2024';
import './FederalCreditProForma.css';

interface FederalCreditProFormaProps {
  businessData: any;
  selectedYear: any;
  calculations: any;
  clientId: string;
  userId?: string;
  selectedMethod?: 'standard' | 'asc';
}

export const FederalCreditProForma: React.FC<FederalCreditProFormaProps> = ({
  businessData,
  selectedYear,
  calculations,
  clientId,
  userId,
  selectedMethod: propSelectedMethod
}) => {
  const [selectedVersion, setSelectedVersion] = useState<'pre-2024' | 'post-2024'>('post-2024');
  const [selectedMethod, setSelectedMethod] = useState<'standard' | 'asc'>(propSelectedMethod || 'standard');

  // Determine if we should show post-2024 form based on year
  const isPost2024 = selectedYear?.year >= 2024;
  const effectiveVersion = isPost2024 ? 'post-2024' : selectedVersion;

  return (
    <div className="federal-proforma-container">
      <h2 className="federal-proforma-title">Federal Credits</h2>
      
      <div className="federal-selector-container">
        <label>
          Version:
          <select 
            value={effectiveVersion} 
            onChange={(e) => setSelectedVersion(e.target.value as 'pre-2024' | 'post-2024')}
            disabled={isPost2024}
          >
            <option value="pre-2024">Pre-2024</option>
            <option value="post-2024">Post-2024</option>
          </select>
        </label>
        
        <label>
          Method:
          <select 
            value={selectedMethod} 
            onChange={(e) => setSelectedMethod(e.target.value as 'standard' | 'asc')}
          >
            <option value="standard">Standard</option>
            <option value="asc">ASC</option>
          </select>
        </label>
      </div>

      <div className="federal-proforma-content">
        {effectiveVersion === 'pre-2024' ? (
          <Form6765
            businessData={businessData}
            selectedYear={selectedYear}
            calculations={calculations}
            clientId={clientId}
            userId={userId}
            selectedMethod={selectedMethod}
          />
        ) : (
          <Form6765v2024
            businessData={businessData}
            selectedYear={selectedYear}
            calculations={calculations}
            clientId={clientId}
            userId={userId}
            selectedMethod={selectedMethod}
          />
        )}
      </div>
    </div>
  );
}; 