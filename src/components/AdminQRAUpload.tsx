import React, { useState } from "react";
import Papa, { ParseResult } from "papaparse";
import { QRAEntry } from "../data/qraData";

const columns = [
  "Category", "Area", "Focus", "ResearchActivity", "Subcomponent", "Phase", "Hint", "GeneralDescription", "Goal", "Hypothesis", "Alternatives", "Uncertainties", "DevelopmentProcess", "ResearchLeaderRole", "ClinicianRole", "MidlevelRole", "ClinicalAssistantRole", "InclusionCriteriaAge", "InclusionCriteriaSex", "InclusionCriteriaConsent", "InclusionOther", "ExclusionCriteria1", "ExclusionCriteria2", "ExclusionCriteria3", "OutcomeMeasure1", "OutcomeMeasure2", "StudyType", "Allocation", "PrimaryPurpose", "Enrollment", "TechnicalCategory", "TimePercent"
];

export const AdminQRAUpload: React.FC = () => {
  const [parsedData, setParsedData] = useState<QRAEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<QRAEntry>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<QRAEntry>) => {
        const data = results.data;
        const valid = data.every(row => columns.every(col => col in row));
        if (!valid) {
          setError("CSV columns do not match expected format.");
          setParsedData([]);
          return;
        }
        setParsedData(data);
        setError(null);
      },
      error: (err: Error, _file: File) => {
        setError("Error parsing CSV: " + err.message);
      }
    });
  };

  return (
    <div>
      <h2>Upload QRA CSV</h2>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {parsedData.length > 0 && (
        <div>
          <h3>Preview ({parsedData.length} rows):</h3>
          <table>
            <thead>
              <tr>
                {columns.map(col => <th key={col}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {parsedData.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {columns.map(col => <td key={col}>{(row as any)[col]}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {parsedData.length > 5 && <div>...and {parsedData.length - 5} more rows</div>}
        </div>
      )}
    </div>
  );
}; 