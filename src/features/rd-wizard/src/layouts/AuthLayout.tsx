import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { LightbulbIcon as LightBulbIcon } from 'lucide-react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center">
            <LightBulbIcon className="h-10 w-10 text-blue-600" />
            <span className="ml-2 text-2xl font-bold text-gray-900">R&D Tax Pro</span>
          </Link>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10">
          <Outlet />
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="px-4 sm:px-10">
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900">
              Trusted by healthcare professionals
            </h3>
            <div className="mt-4">
              <ul className="space-y-3">
                {[
                  'Maximize R&D tax credits for your practice',
                  'AI-powered qualification and calculation',
                  'Compliance-focused methodology',
                  'Secure, streamlined process'
                ].map((benefit, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;