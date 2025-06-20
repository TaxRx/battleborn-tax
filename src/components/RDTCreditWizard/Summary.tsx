import React from 'react';
import { RDTWizardTypes } from './rdtWizardStore';

interface SummaryProps {
  qras: RDTWizardTypes.QRAEntry[];
  employees: RDTWizardTypes.Employee[];
  contractors: RDTWizardTypes.Contractor[];
  supplies: RDTWizardTypes.Supply[];
  onBack: () => void;
  onComplete: () => void;
}

export default function Summary({
  qras,
  employees,
  contractors,
  supplies,
  onBack,
  onComplete
}: SummaryProps) {
  const calculateTotalQRE = () => {
    const employeeTotal = employees.reduce((sum, emp) => sum + emp.salary, 0);
    const contractorTotal = contractors.reduce((sum, con) => sum + con.amount, 0);
    const supplyTotal = supplies.reduce((sum, sup) => sum + sup.amount, 0);
    return employeeTotal + contractorTotal + supplyTotal;
  };

  const totalQRE = calculateTotalQRE();
  const totalCredit = totalQRE * 0.14; // 14% credit rate

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Qualified Research Activities</h3>
        <div className="space-y-4">
          {qras.map((qra, index) => (
            <div key={index} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{qra.ResearchActivity}</p>
                <p className="text-sm text-gray-500">{qra.Subcomponent}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {qra.Category} - {qra.Area}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Employees</h3>
        <div className="space-y-4">
          {employees.map(employee => (
            <div key={employee.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{employee.name}</p>
                <p className="text-sm text-gray-500">{employee.role}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  ${employee.salary.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Contractors</h3>
        <div className="space-y-4">
          {contractors.map(contractor => (
            <div key={contractor.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{contractor.name}</p>
                {contractor.description && (
                  <p className="text-sm text-gray-500">{contractor.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  ${contractor.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Supplies</h3>
        <div className="space-y-4">
          {supplies.map(supply => (
            <div key={supply.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{supply.item}</p>
                {supply.description && (
                  <p className="text-sm text-gray-500">{supply.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  ${supply.amount.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Calculation Summary</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="font-medium">Total Qualified Research Expenses</p>
            <p className="text-lg font-medium">${totalQRE.toLocaleString()}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="font-medium">Estimated R&D Tax Credit (14%)</p>
            <p className="text-lg font-medium text-emerald-600">
              ${totalCredit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Complete
        </button>
      </div>
    </div>
  );
} 