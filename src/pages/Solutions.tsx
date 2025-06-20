import React from 'react';
import { useNavigate } from 'react-router-dom';

interface SolutionCard {
  title: string;
  description: string;
  requirements: string[];
  path: string;
}

const solutions: SolutionCard[] = [
  {
    title: 'R&D Tax Credit',
    description: 'Calculate potential tax savings from qualified research and development activities.',
    requirements: [
      'Business must be engaged in qualified research activities',
      'Activities must meet the four-part test',
      'Expenses must be properly documented',
    ],
    path: '/solutions/rd-credit',
  },
  {
    title: 'Augusta Rule',
    description: 'Calculate tax savings from renting your home for business meetings.',
    requirements: [
      'Home must be used for business meetings',
      'Rental must be at fair market value',
      'Maximum 14 days per year',
    ],
    path: '/solutions/augusta-rule',
  },
];

const Solutions = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Tax Strategy Solutions
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Explore our tax strategy wizards to maximize your savings
        </p>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        {solutions.map((solution) => (
          <div
            key={solution.title}
            className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
          >
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {solution.title}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {solution.description}
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Requirements:
              </h4>
              <ul className="list-disc pl-5 space-y-1">
                {solution.requirements.map((requirement) => (
                  <li key={requirement} className="text-sm text-gray-500">
                    {requirement}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <button
                  onClick={() => navigate(solution.path)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Solutions; 