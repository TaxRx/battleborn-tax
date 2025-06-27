import React from 'react';
import { UserIcon, CalendarIcon, ArrowPathIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';

interface ActionBarProps {
  userName: string;
  userState: string;
  selectedYear: number;
  onYearChange: (year: number) => void;
  onUpdateInfo: () => void;
  onSave: () => void;
  extraActions?: React.ReactNode;
}

const ActionBar: React.FC<ActionBarProps> = ({ userName, userState, selectedYear, onYearChange, onUpdateInfo, onSave, extraActions }) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white shadow-lg p-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            <span>{userName} | {userState}</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <CalendarIcon className="h-5 w-5 mr-2" />
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1 text-white"
            >
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <button onClick={onUpdateInfo} className="flex items-center bg-gray-600 hover:bg-gray-500 rounded-md px-4 py-2">
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Update Info
          </button>
          <button onClick={onSave} className="flex items-center bg-green-600 hover:bg-green-500 rounded-md px-4 py-2">
            <DocumentCheckIcon className="h-5 w-5 mr-2" />
            Save
          </button>
          {extraActions}
        </div>
      </div>
    </div>
  );
};

export default ActionBar; 