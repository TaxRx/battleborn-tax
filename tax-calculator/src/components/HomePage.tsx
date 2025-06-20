import React from 'react';
import { ArrowRight, Calculator } from 'lucide-react';

interface HomePageProps {
  onLoginClick: () => void;
  onTryCalculatorClick: () => void;
}

export default function HomePage({ onLoginClick, onTryCalculatorClick }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="fixed w-full bg-gradient-to-r from-gray-800 to-gray-900 shadow-lg z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-lg">
                <Calculator className="h-8 w-8 text-white" />
              </div>
              <span className="text-2xl font-bold ml-2">
                <span className="text-white">Tax</span>
                <span className="text-emerald-400">Rx</span>
              </span>
            </div>
            <button
              onClick={onLoginClick}
              className="px-4 py-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

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
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <button
                onClick={onTryCalculatorClick}
                className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 md:py-4 md:text-lg md:px-10"
              >
                Try Calculator
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-2 rounded-lg">
              <Calculator className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold ml-2">
              <span className="text-white">Tax</span>
              <span className="text-emerald-400">Rx</span>
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} TaxRx. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}