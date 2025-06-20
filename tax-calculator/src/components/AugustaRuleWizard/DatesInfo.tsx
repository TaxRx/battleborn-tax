import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Save } from 'lucide-react';

interface DatesInfoProps {
  onNext: () => void;
  onBack: () => void;
  onSave: (data: any) => void;
  dailyRate: number;
}

interface RentalDate {
  id: number;
  date: string;
  rate: number;
  purpose: string;
  customNote?: string;
  isCustomizing: boolean;
}

const purposeOptions = [
  'Board meeting',
  'Business planning meeting',
  'Team event',
  'Conference',
  'Retreat',
  'Advisor Meeting',
  'Shareholder Meeting'
];

export default function DatesInfo({ onNext, onBack, onSave, dailyRate }: DatesInfoProps) {
  const [dates, setDates] = useState<RentalDate[]>([]);

  useEffect(() => {
    // Get first Saturday of each month for the year
    const year = new Date().getFullYear();
    const firstSaturdays = Array.from({ length: 12 }, (_, monthIndex) => {
      const date = new Date(year, monthIndex, 1);
      const day = date.getDay();
      const firstSaturday = new Date(date.setDate(date.getDate() + ((6 - day + 7) % 7)));
      return firstSaturday.toISOString().split('T')[0];
    });

    // Add March 20 and July 29
    const additionalDates = [`${year}-03-20`, `${year}-07-29`];
    const allDates = [...firstSaturdays, ...additionalDates]
      .sort()
      .slice(0, 14) // Limit to 14 days
      .map((date, index) => ({
        id: index + 1,
        date,
        rate: dailyRate,
        purpose: date.endsWith('03-20') || date.endsWith('07-29') ? 'Retreat' : 'Board meeting',
        customNote: '',
        isCustomizing: false
      }));

    setDates(allDates);
  }, [dailyRate]);

  const handlePurposeChange = (id: number, purpose: string) => {
    setDates(prev => prev.map(date => 
      date.id === id ? { ...date, purpose } : date
    ));
  };

  const toggleCustomization = (id: number) => {
    setDates(prev => prev.map(date => 
      date.id === id ? { ...date, isCustomizing: !date.isCustomizing } : date
    ));
  };

  const handleCustomNoteChange = (id: number, note: string) => {
    setDates(prev => prev.map(date => 
      date.id === id ? { ...date, customNote: note } : date
    ));
  };

  const saveCustomNote = (id: number) => {
    setDates(prev => prev.map(date => 
      date.id === id ? { ...date, isCustomizing: false } : date
    ));
  };

  const handleDateChange = (id: number, newDate: string) => {
    setDates(prev => prev.map(date => 
      date.id === id ? { ...date, date: newDate } : date
    ));
  };

  const handleRateChange = (id: number, rate: string) => {
    setDates(prev => prev.map(date => 
      date.id === id ? { ...date, rate: parseFloat(rate) || dailyRate } : date
    ));
  };

  const handleSubmit = () => {
    onSave({ dates });
    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Rental Dates & Use</h2>
      
      <p className="text-gray-600 mb-8">
        Add a date to begin detailing fees and purposes. Each new date will auto-populate 
        with your calculated daily rate, but feel free to modify it.
      </p>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Column Headers */}
        <div className="grid grid-cols-12 gap-4 items-center p-4 bg-gray-50 border-b">
          <div className="col-span-1 font-medium text-gray-600">#</div>
          <div className="col-span-3 font-medium text-gray-600">DATE</div>
          <div className="col-span-2 font-medium text-gray-600">DAILY RATE</div>
          <div className="col-span-3 font-medium text-gray-600">PURPOSE</div>
          <div className="col-span-3 font-medium text-gray-600">CUSTOMIZE</div>
        </div>

        {/* Date Rows */}
        <div className="divide-y">
          {dates.map((date) => (
            <div key={date.id} className="p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  <span className="text-lg font-bold">{date.id}</span>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="date"
                      value={date.date}
                      onChange={(e) => handleDateChange(date.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                    <Calendar className="text-gray-400" size={20} />
                  </div>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    value={date.rate}
                    onChange={(e) => handleRateChange(date.id, e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>

                <div className="col-span-3">
                  <div className="relative">
                    <select
                      value={date.purpose}
                      onChange={(e) => handlePurposeChange(date.id, e.target.value)}
                      className="w-full px-3 py-2 border rounded-md appearance-none"
                    >
                      <option value="">Select purpose</option>
                      {purposeOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                    <ChevronDown 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                      size={16}
                    />
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-grow">
                      {date.purpose === 'Board meeting' && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={date.isCustomizing}
                            onChange={() => toggleCustomization(date.id)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Note Section */}
              {date.purpose === 'Board meeting' && date.isCustomizing && (
                <div className="mt-4 pl-12">
                  <div className="flex items-end space-x-4">
                    <div className="flex-grow">
                      <textarea
                        value={date.customNote}
                        onChange={(e) => handleCustomNoteChange(date.id, e.target.value)}
                        placeholder="Add custom notes for this board meeting..."
                        className="w-full px-3 py-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                    <button
                      onClick={() => saveCustomNote(date.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Save size={16} />
                      <span>Save Note</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}