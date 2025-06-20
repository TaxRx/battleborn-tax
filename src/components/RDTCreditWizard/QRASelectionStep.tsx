import React, { useState } from "react";
import { qraData, QRAEntry } from "../../data/qraData";
// ... existing code ...
// Replace any hardcoded QRA/subcomponent logic with dynamic rendering from qraData
// Example:
// const qraOptions = qraData.map(entry => entry.ResearchActivity);
// const subcomponentOptions = qraData.filter(entry => entry.ResearchActivity === selectedQRA).map(entry => entry.Subcomponent);
// ... existing code ... 

interface QRASelectionStepProps {
  onChange: (selectedQRA: string, selectedSubcomponent: string) => void;
  onNext: () => void;
}

export const QRASelectionStep: React.FC<QRASelectionStepProps> = ({ onChange, onNext }) => {
  const [selectedQRA, setSelectedQRA] = useState("");
  const [selectedSubcomponent, setSelectedSubcomponent] = useState("");

  // Get unique QRA (ResearchActivity) options
  const qraOptions = Array.from(new Set(qraData.map(entry => entry.ResearchActivity)));

  // Get subcomponents for the selected QRA
  const subcomponentOptions = qraData
    .filter(entry => entry.ResearchActivity === selectedQRA)
    .map(entry => entry.Subcomponent)
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  const handleQRAChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedQRA(e.target.value);
    setSelectedSubcomponent("");
    onChange(e.target.value, "");
  };

  const handleSubcomponentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubcomponent(e.target.value);
    onChange(selectedQRA, e.target.value);
  };

  return (
    <div>
      <label>QRA (Research Activity):</label>
      <select value={selectedQRA} onChange={handleQRAChange}>
        <option value="">Select QRA</option>
        {qraOptions.map(qra => (
          <option key={qra} value={qra}>{qra}</option>
        ))}
      </select>

      {selectedQRA && (
        <>
          <label>Subcomponent:</label>
          <select value={selectedSubcomponent} onChange={handleSubcomponentChange}>
            <option value="">Select Subcomponent</option>
            {subcomponentOptions.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </>
      )}

      <button onClick={onNext} disabled={!selectedQRA || !selectedSubcomponent}>
        Next
      </button>
    </div>
  );
}; 