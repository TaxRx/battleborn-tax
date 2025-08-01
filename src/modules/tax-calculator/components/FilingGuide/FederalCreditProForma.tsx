import React, { useState, useEffect } from 'react';
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
  // Fix: 2023 should default to pre-2024 form, 2024+ should default to post-2024
  const isPost2024 = selectedYear?.year >= 2024;
  const defaultVersion = isPost2024 ? 'post-2024' : 'pre-2024';
  
  const [selectedVersion, setSelectedVersion] = useState<'pre-2024' | 'post-2024'>(defaultVersion);
  const [selectedMethod, setSelectedMethod] = useState<'standard' | 'asc'>(propSelectedMethod || 'standard');

  // Update selected version when year changes
  useEffect(() => {
    const newDefaultVersion = selectedYear?.year >= 2024 ? 'post-2024' : 'pre-2024';
    setSelectedVersion(newDefaultVersion);
  }, [selectedYear?.year]);

  // For years 2024+, force post-2024 form; for 2023 and earlier, allow selection but default to pre-2024
  const effectiveVersion = selectedYear?.year >= 2024 ? 'post-2024' : selectedVersion;

  return (
    <div className="federal-proforma-container">
      <h2 className="federal-proforma-title">Federal Credits</h2>
      
      <div className="federal-selector-container">
        <label>
          Form Version:
          <select 
            value={effectiveVersion} 
            onChange={(e) => setSelectedVersion(e.target.value as 'pre-2024' | 'post-2024')}
            disabled={selectedYear?.year >= 2024}
          >
            <option value="pre-2024">Form 6765 (Pre-2024)</option>
            <option value="post-2024">Form 6765 (2024+)</option>
          </select>
          {selectedYear?.year >= 2024 && (
            <small style={{ display: 'block', color: '#6b7280', marginTop: '4px' }}>
              Tax year {selectedYear.year} requires the 2024+ form version
            </small>
          )}
        </label>
        
        <label>
          Calculation Method:
          <select 
            value={selectedMethod} 
            onChange={(e) => setSelectedMethod(e.target.value as 'standard' | 'asc')}
          >
            <option value="standard">Standard Method</option>
            <option value="asc">Alternative Simplified Credit (ASC)</option>
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