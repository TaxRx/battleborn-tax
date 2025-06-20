import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DemoAccessButton from './DemoAccessButton';
import useAuthStore from '../store/authStore';

interface HomePageProps {
  onLoginClick: () => void;
  onTryCalculatorClick: () => void;
}

export default function HomePage({ onLoginClick, onTryCalculatorClick }: HomePageProps) {
  const navigate = useNavigate();
  const { isAuthenticated, userType } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Smart Tax Planning</span>
              <span className="block bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                for Your Business
              </span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Discover personalized tax strategies and maximize your savings with our advanced tax planning tools.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8 space-y-4 sm:space-y-0 sm:space-x-4">
              <button
                onClick={onTryCalculatorClick}
                className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 md:py-4 md:text-lg md:px-10"
              >
                Try Calculator
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
            {/* Demo Access Buttons */}
            <div className="mt-8 max-w-md mx-auto sm:flex sm:justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <DemoAccessButton userType="admin" />
              <DemoAccessButton userType="client" />
            </div>
            {/* Admin Dashboard Link for logged-in admins */}
            {isAuthenticated && userType === 'admin' && (
              <div className="mt-8">
                <button
                  onClick={() => navigate('/admin')}
                  className="px-8 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-300"
                >
                  Go to Admin Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}