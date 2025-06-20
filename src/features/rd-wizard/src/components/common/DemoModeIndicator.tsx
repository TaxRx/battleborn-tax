import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../../store/authStore';
import Button from './Button';
import { motion } from 'framer-motion';

const DemoModeIndicator: React.FC = () => {
  const navigate = useNavigate();
  const { demoMode, userType, disableDemoMode } = useAuthStore();

  if (!demoMode) return null;

  const handleExitDemo = () => {
    disableDemoMode();
    navigate('/');
    toast.info('You have exited demo mode');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="fixed bottom-4 right-4 z-50 bg-amber-100 border border-amber-300 rounded-lg shadow-md p-3"
    >
      <div className="flex flex-col items-start">
        <div className="flex items-center mb-2">
          <motion.span 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
            className="inline-block w-3 h-3 bg-amber-500 rounded-full mr-2"
          ></motion.span>
          <span className="font-medium text-amber-800">
            Demo Mode: {userType === 'admin' ? 'Administrator' : 'Client'}
          </span>
        </div>
        <p className="text-xs text-amber-700 mb-2">
          You are currently viewing the application in demo mode.
          <br />
          No changes will be saved.
        </p>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs border-amber-500 text-amber-700 hover:bg-amber-50"
          onClick={handleExitDemo}
        >
          Exit Demo Mode
        </Button>
      </div>
    </motion.div>
  );
};

export default DemoModeIndicator;