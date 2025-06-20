import React from 'react';
import { CreditCard } from 'lucide-react';
import Card from '../../components/common/Card';

const Payment = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment</h1>
      
      <Card>
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <CreditCard className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Process Payment</h2>
            <p className="text-gray-600 mb-8">
              Complete your payment to finalize your R&D tax credit claim
            </p>
            <button
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
              onClick={() => {
                // Payment processing logic will be implemented here
                console.log('Process payment');
              }}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Payment;