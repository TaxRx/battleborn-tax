import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClientRegistrationForm from '../components/ClientRegistrationForm';
import { toast } from 'react-hot-toast';
import { UserCheck, Briefcase, Users } from 'lucide-react';

type AccountType = 'client' | 'affiliate' | 'expert';

export default function ClientRegistration() {
  const [showForm, setShowForm] = useState(false);
  const [selectedAccountType, setSelectedAccountType] = useState<AccountType>('client');
  const navigate = useNavigate();

  const handleRegistrationSuccess = (data: { clientId: string; userId: string }) => {
    console.log('Registration successful:', data);
    toast.success('Registration successful! Welcome to TaxApp!');
    
    // In a real app, you might redirect to a verification page or dashboard
    setShowForm(false);
    
    // For now, just show success message
    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  const handleClose = () => {
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to TaxApp
          </h1>
          <p className="text-gray-600 text-lg">
            Join our platform and start optimizing your tax strategy today
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Choose Your Account Type
              </h2>
              <p className="text-gray-600">
                Select the option that best describes your role
              </p>
            </div>

            <div className="space-y-4">
              {/* Account Type Selection */}
              <div className="grid grid-cols-1 gap-4">
                <div
                  onClick={() => setSelectedAccountType('client')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedAccountType === 'client'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <UserCheck className={`h-6 w-6 ${selectedAccountType === 'client' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-medium text-gray-900">Client</h3>
                      <p className="text-sm text-gray-600">Business owner seeking tax planning services</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedAccountType('affiliate')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedAccountType === 'affiliate'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Briefcase className={`h-6 w-6 ${selectedAccountType === 'affiliate' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-medium text-gray-900">Affiliate</h3>
                      <p className="text-sm text-gray-600">CPA firm, wealth management firm, or tax professional</p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedAccountType('expert')}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedAccountType === 'expert'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Users className={`h-6 w-6 ${selectedAccountType === 'expert' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-medium text-gray-900">Expert</h3>
                      <p className="text-sm text-gray-600">Lawyer, advisor, or consultant providing professional services</p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl text-lg"
              >
                Continue Registration
              </button>

              <div className="text-center">
                <p className="text-gray-600 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="text-center">
                <p className="text-gray-500 text-sm mb-4">
                  What you'll get:
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Professional tax planning tools</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Multi-user business access</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Secure document management</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Expert advisor support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            By registering, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {showForm && (
        <ClientRegistrationForm
          onRegistrationSuccess={handleRegistrationSuccess}
          onClose={handleClose}
          accountType={selectedAccountType}
        />
      )}
    </div>
  );
} 