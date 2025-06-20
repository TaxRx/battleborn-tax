import React, { useState, useEffect } from 'react';
import { Loader2, Search, Star } from 'lucide-react';
import { NumericFormat } from 'react-number-format';

interface RentalInfoProps {
  onNext: () => void;
  onBack: () => void;
  onSave: (data: any) => void;
}

interface Comp {
  id: string;
  name: string;
  description: string;
  hourlyRate: number;
  imageUrl: string;
  included: boolean;
}

const getMetroArea = (zip: string) => {
  const prefix = zip.substring(0, 3);
  
  // Simple mapping of zip prefixes to major metro areas
  const metroMap: Record<string, { name: string; zip: string }> = {
    '100': { name: 'New York City', zip: '10001' },
    '900': { name: 'Los Angeles', zip: '90001' },
    '606': { name: 'Chicago', zip: '60601' }
  };

  return metroMap[prefix] || { name: 'New York City', zip: '10001' };
};

export default function RentalInfo({ onNext, onBack, onSave }: RentalInfoProps) {
  const [loading, setLoading] = useState(false);
  const [comps, setComps] = useState<Comp[]>([]);
  const [searchZip, setSearchZip] = useState('');
  const [hourlyRate, setHourlyRate] = useState<number | null>(null);
  const [fallbackMetro, setFallbackMetro] = useState<string | null>(null);
  const [selectedComps, setSelectedComps] = useState<string[]>([]);

  // Mock data for major zip codes
  const mockComps: Record<string, Comp[]> = {
    '10001': [
      {
        id: '1',
        name: 'Manhattan Executive Suite',
        description: 'Luxury meeting space in Midtown with skyline views',
        hourlyRate: 400,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
        included: true
      },
      {
        id: '2',
        name: 'Park Avenue Conference Center',
        description: 'Premium meeting rooms with state-of-the-art facilities',
        hourlyRate: 350,
        imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
        included: true
      },
      {
        id: '3',
        name: 'Fifth Avenue Business Hub',
        description: 'Modern workspace with panoramic city views',
        hourlyRate: 300,
        imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
        included: true
      }
    ],
    '90001': [
      {
        id: '1',
        name: 'LA Business Center',
        description: 'Modern facility in downtown LA',
        hourlyRate: 300,
        imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
        included: true
      },
      {
        id: '2',
        name: 'Beverly Hills Executive Space',
        description: 'Luxury meeting rooms in prime location',
        hourlyRate: 275,
        imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
        included: true
      }
    ],
    '60601': [
      {
        id: '1',
        name: 'Loop Conference Center',
        description: 'Premium space in Chicago Loop',
        hourlyRate: 275,
        imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
        included: true
      },
      {
        id: '2',
        name: 'Michigan Avenue Suites',
        description: 'Elegant meeting spaces with lake views',
        hourlyRate: 250,
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
        included: true
      }
    ]
  };

  const fetchComps = async (zip: string) => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const zipPrefix = zip.substring(0, 3);
      let results = mockComps[zip] || mockComps[`${zipPrefix}01`];
      
      if (!results) {
        const metro = getMetroArea(zip);
        results = mockComps[metro.zip];
        setFallbackMetro(metro.name);
      }

      if (results) {
        const sortedComps = [...results].sort((a, b) => b.hourlyRate - a.hourlyRate);
        setComps(sortedComps);
        setSelectedComps(sortedComps.map(comp => comp.id));
        
        if (!hourlyRate && sortedComps.length > 0) {
          setHourlyRate(sortedComps[0].hourlyRate);
        }
      }
    } catch (error) {
      console.error('Error fetching comps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchZip.length === 5) {
      fetchComps(searchZip);
    }
  };

  const toggleComp = (compId: string) => {
    setSelectedComps(prev => {
      if (prev.includes(compId)) {
        return prev.filter(id => id !== compId);
      }
      return [...prev, compId];
    });
  };

  const calculateDailyRate = () => {
    if (!hourlyRate) return 0;
    return hourlyRate * 8;
  };

  const handleNext = () => {
    onSave({
      rentalInfo: {
        selectedComps,
        hourlyRate,
        dailyRate: calculateDailyRate(),
        zip: searchZip
      }
    });
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Rental Rate Analysis</h2>
      
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <form onSubmit={handleSearch} className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Comparable Properties
          </label>
          <div className="flex space-x-4">
            <div className="flex-grow">
              <input
                type="text"
                value={searchZip}
                onChange={(e) => setSearchZip(e.target.value.slice(0, 5))}
                placeholder="Enter ZIP code"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                pattern="[0-9]{5}"
              />
            </div>
            <button
              type="submit"
              disabled={searchZip.length !== 5}
              className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Search size={20} />
              <span>Search</span>
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-navy" />
              <p className="text-gray-600">Searching for comparable properties...</p>
            </div>
          </div>
        ) : (
          <>
            {fallbackMetro && (
              <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded-lg">
                No exact matches found. Showing comparable properties from {fallbackMetro}.
              </div>
            )}

            <div className="space-y-6">
              {comps.map((comp) => (
                <div
                  key={comp.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedComps.includes(comp.id)
                      ? 'border-navy bg-navy-50'
                      : 'border-gray-200 hover:border-navy'
                  }`}
                  onClick={() => toggleComp(comp.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-32 h-24 rounded-lg overflow-hidden">
                      <img
                        src={comp.imageUrl}
                        alt={comp.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{comp.name}</h3>
                          <p className="text-sm text-gray-600">{comp.description}</p>
                          <div className="flex items-center mt-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className="text-gold"
                                fill="#D4A017"
                              />
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">${comp.hourlyRate}/hr</div>
                          <div className="text-sm text-gray-600">
                            ${comp.hourlyRate * 8}/day
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-medium mb-4">Set Your Rental Rate</h3>
        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hourly Rate
            </label>
            <NumericFormat
              value={hourlyRate || ''}
              onValueChange={(values) => setHourlyRate(values.floatValue || null)}
              thousandSeparator={true}
              prefix="$"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter hourly rate"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Daily Rate (8 hours)
            </label>
            <div className="px-4 py-2 border rounded-lg bg-gray-50">
              ${calculateDailyRate().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!hourlyRate}
          className="px-6 py-2 bg-navy text-white rounded-lg hover:bg-navy-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}