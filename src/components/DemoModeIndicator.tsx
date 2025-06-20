import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const DemoModeIndicator: React.FC = () => {
  const navigate = useNavigate();
  const { demoMode, userType, disableDemoMode } = useAuthStore();

  if (!demoMode) return null;

  const handleExitDemo = () => {
    disableDemoMode();
    navigate('/');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-100 border border-amber-300 rounded-lg shadow-md p-3">
      <div className="flex flex-col items-start">
        <div className="flex items-center mb-2">
          <span className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
          <span className="font-medium text-amber-800">
            Demo Mode: {userType === 'admin' ? 'Administrator' : 'Client'}
          </span>
        </div>
        <p className="text-xs text-amber-700 mb-2">
          You are currently viewing the application in demo mode.
          <br />
          No changes will be saved.
        </p>
        <button
          onClick={handleExitDemo}
          className="text-xs px-3 py-1 border border-amber-500 text-amber-700 rounded hover:bg-amber-50 transition-colors"
        >
          Exit Demo Mode
        </button>
      </div>
    </div>
  );
};

export default DemoModeIndicator; 