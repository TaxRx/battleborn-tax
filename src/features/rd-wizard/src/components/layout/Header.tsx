import React from 'react';
import { Link } from 'react-router-dom';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { BeakerIcon } from '@heroicons/react/24/solid';

const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <BeakerIcon className="h-8 w-8 text-[#4772fa] mr-2" />
              <h1 className="font-['DM_Serif_Display'] text-2xl text-[#2c3e50] hover:text-[#4772fa] transition-colors">
                Direct Research
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="bg-[#e8f0ff] p-2 rounded-lg text-[#4772fa] hover:bg-[#4772fa] hover:text-white transition-colors"
            >
              <UserCircleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 