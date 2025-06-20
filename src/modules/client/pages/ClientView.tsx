import React from 'react';

const ClientView: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Client View
          </h1>
          <p className="text-gray-600 mb-6">
            This is where clients will view their tax proposals and strategies.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-green-900 mb-2">
              Client Features (Coming Soon)
            </h2>
            <ul className="text-left text-green-800 space-y-2">
              <li>• View personalized tax strategy reports</li>
              <li>• Review projected savings</li>
              <li>• Track proposal status</li>
              <li>• Download PDF reports</li>
              <li>• Secure document sharing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientView; 