import React from 'react';
import { useNavigate } from 'react-router-dom';

const SOLUTIONS = [
  {
    id: 'augusta',
    title: 'Augusta Rule',
    description: 'The Augusta Rule allows homeowners to rent out their home for up to 14 days per year, tax-free. This strategy is especially useful for business owners who can rent their home to their business for meetings or events.',
    requirements: [
      'You own a home in the U.S.',
      'You rent it out for 14 days or fewer per year',
      'You use the home personally for more than 14 days per year',
      'You have a legitimate business reason for the rental (e.g., board meetings, company retreats)'
    ],
    howItWorks: 'Our Augusta Rule Wizard guides you through the process of documenting your rental, calculating fair market value, and generating the necessary paperwork to stay compliant.',
    getStartedRoute: '/client/augusta-wizard'
  },
  {
    id: 'rdtc',
    title: 'R&D Tax Credit',
    description: 'The R&D Tax Credit rewards businesses for investing in innovation, process improvements, and new technology. Many healthcare and technology companies qualify without realizing it.',
    requirements: [
      'You have U.S.-based payroll',
      'You invest in new or improved products, processes, or software',
      'You can document qualifying research activities and expenses',
      'You are not a tax-exempt organization'
    ],
    howItWorks: 'Our R&D Tax Credit Wizard walks you through identifying qualifying activities, collecting supporting documentation, and calculating your estimated credit.',
    getStartedRoute: '/client/rdtc-wizard'
  }
];

export default function Solutions() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Tax Solutions</h1>
      <div className="grid gap-8 md:grid-cols-2">
        {SOLUTIONS.map((solution) => (
          <div key={solution.id} className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">{solution.title}</h2>
              <p className="mb-4 text-gray-700">{solution.description}</p>
              <h3 className="font-medium mb-1">Qualification Requirements:</h3>
              <ul className="list-disc list-inside mb-4 text-gray-600">
                {solution.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
              <h3 className="font-medium mb-1">How Our Solution Helps:</h3>
              <p className="mb-4 text-gray-700">{solution.howItWorks}</p>
            </div>
            <button
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              onClick={() => navigate(solution.getStartedRoute)}
            >
              Get Started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 