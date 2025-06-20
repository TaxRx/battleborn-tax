import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

interface DemoAccessButtonProps {
  userType: 'client' | 'admin';
  label?: string;
  className?: string;
}

const DemoAccessButton: React.FC<DemoAccessButtonProps> = ({
  userType,
  label = `Demo ${userType === 'admin' ? 'Admin' : 'Client'} Access`,
  className = ''
}) => {
  const navigate = useNavigate();
  const enableDemoMode = useAuthStore(state => state.enableDemoMode);

  const handleClick = () => {
    enableDemoMode(userType);
    navigate(userType === 'admin' ? '/admin' : '/client');
  };

  return (
    <button
      onClick={handleClick}
      className={`px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors ${className}`}
    >
      {label}
    </button>
  );
};

export default DemoAccessButton; 