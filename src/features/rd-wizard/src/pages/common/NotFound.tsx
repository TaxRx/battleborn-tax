import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center max-w-md">
        <h1 className="mt-6 text-9xl font-bold text-gray-900">404</h1>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Page not found</h2>
        <p className="mt-4 text-base text-gray-600">
          Sorry, we couldn't find the page you're looking for. Please check the URL or return home.
        </p>
        <div className="mt-10">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <HomeIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;