import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import useAuthStore from '../../store/authStore';

interface DemoAccessButtonProps {
  userType: 'client' | 'admin';
  label?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

const DemoAccessButton: React.FC<DemoAccessButtonProps> = ({
  userType,
  label = `Demo ${userType === 'admin' ? 'Admin' : 'Client'} Access`,
  className,
  variant = 'secondary'
}) => {
  const navigate = useNavigate();
  const enableDemoMode = useAuthStore(state => state.enableDemoMode);

  const handleClick = () => {
    enableDemoMode(userType);
    navigate(userType === 'admin' ? '/admin' : '/client');
  };

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleClick}
    >
      {label}
    </Button>
  );
};

export default DemoAccessButton;