import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Doughnut } from 'react-chartjs-2';
import { states } from '../data/states';
import { calculateCharitableDonationNetSavings } from '../utils/taxCalculations';
import { NumericFormat } from 'react-number-format';
import { taxRates } from '../data/taxRates';
import * as Dialog from '@radix-ui/react-dialog';
import { TaxInfo } from '../types/tax';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/battleborn-logo.svg';
import { saveLeadToDatabase } from '../lib/services/leads.service';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

// Add keyframes for image effects
const keyframesStyle = `
  @keyframes slowPulse {
    0% { transform: scale(1.05); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1.05); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes glow {
    0% { filter: brightness(1); }
    50% { filter: brightness(1.2); }
    100% { filter: brightness(1); }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  .animate-glow {
    animation: glow 4s ease-in-out infinite;
  }
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const [income, setIncome] = useState<number | null>(null);
  const [state, setState] = useState('CA');
  const [donationAmount, setDonationAmount] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  // Add styles to head on mount
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = keyframesStyle;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Calculate benefits
  const calculations = React.useMemo(() => {
    if (!income || !donationAmount) return null;

    const taxInfo: TaxInfo = {
      user_id: 'anonymous',
      wages_income: income,
      passive_income: 0,
      unearned_income: 0,
      business_owner: false,
      standard_deduction: false,
      filing_status: 'single',
      state: state,
      dependents: 0,
      full_name: '',
      email: '',
      home_address: '',
      capital_gains: 0,
      custom_deduction: 0,
      ordinary_k1_income: 0,
      guaranteed_k1_income: 0
    };

    const { federal, state: stateSavings } = calculateCharitableDonationNetSavings(
      taxInfo,
      taxRates[new Date().getFullYear()],
      donationAmount,
      donationAmount * 5,
      []
    );

    // Calculate net savings (total tax benefit minus donation amount)
    const totalBenefit = federal + stateSavings;
    const netSavings = totalBenefit - donationAmount;

    return {
      heroesSupported: Math.floor(donationAmount / 5000),
      philanthropicImpact: donationAmount * 5,
      netTaxSavings: netSavings,
      federal,
      state: stateSavings,
      initial: donationAmount,
      totalBenefit
    };
  }, [income, state, donationAmount]);

  const chartData = React.useMemo(() => {
    if (!calculations) return null;

    return {
      labels: ['Initial Amount', 'Net Federal Benefit', 'Net State Benefit'],
      datasets: [{
        data: [calculations.initial, calculations.federal, calculations.state],
        backgroundColor: ['#94a3b8', '#22c55e', '#0ea5e9'],
        borderColor: ['#64748b', '#16a34a', '#0284c7'],
        borderWidth: 1
      }]
    };
  }, [calculations]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            family: 'Inter, system-ui, sans-serif',
            weight: 'normal' as const
          },
          color: '#4B5563'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            return ` ${context.label}: $${value.toLocaleString()}`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold' as const,
          size: 11
        },
        formatter: (value: number) => {
          if (value < 1000) return '';
          return `$${(value / 1000).toFixed(0)}K`;
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const leadData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        income: income || undefined,
        state,
        donationAmount: donationAmount || undefined,
        calculations: calculations || undefined
      };

      // Save lead to database
      await saveLeadToDatabase(leadData);

      setShowModal(false);
      alert('Thank you for your interest! We will be in touch shortly.');
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('There was an error submitting your request. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">Battleborn Advisors, LLC</div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  console.log('Login button clicked');
                  navigate('/login');
                }}
                type="button"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login to Tax App
              </button>
              <a
                href="https://calendar.app.google/JemBHKpc9rggCKus8"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-[#12ab61] text-white rounded-lg hover:bg-[#0f9654] transition-colors"
              >
                Schedule a Call
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Strategic Philanthropy with Exceptional Returns
            </h1>
            <p className="mt-3 max-w-3xl mx-auto text-xl text-gray-500 sm:mt-4">
              Empowering wealth advisors to deliver life-changing impact for first responders while creating significant tax benefits for clients.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Statement */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#1a1a3f] to-[#2d2d67] rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:p-16">
            <h2 className="text-4xl font-bold text-white mb-8">Join the Philanthropic Tax Benefit Movement</h2>
            <div className="prose prose-lg prose-invert">
              <p className="text-gray-300 text-xl leading-relaxed">
                Strategically leverage medical and biotechnology donations to achieve exceptional social impact and substantial tax savings. 
                Our expert team coordinates every detail, working directly with:
              </p>
              
              <ul className="space-y-4 my-8">
                <li className="flex items-start space-x-3 text-gray-300">
                  <span className="text-blue-400 text-xl">•</span>
                  <span>Philanthropic donation specialists to identify high-impact opportunities.</span>
                </li>
                <li className="flex items-start space-x-3 text-gray-300">
                  <span className="text-blue-400 text-xl">•</span>
                  <span>Vetted 501(c)(3) charities to ensure compliance and maximize benefits.</span>
                </li>
                <li className="flex items-start space-x-3 text-gray-300">
                  <span className="text-blue-400 text-xl">•</span>
                  <span>Legal and accounting experts to safeguard and optimize your clients' returns.</span>
                </li>
              </ul>

              <p className="text-gray-300 text-xl italic">
                Doing good and benefiting financially aren't mutually exclusive—they amplify each other.
              </p>

              <div className="mt-12">
                <h3 className="text-2xl font-semibold text-blue-400 mb-6">At Battleborn Advisors, we're:</h3>
                <ul className="space-y-4 my-8">
                  <li className="flex items-start space-x-3 text-gray-300">
                    <span className="text-blue-400 text-xl">•</span>
                    <span>A dedicated team of tax attorneys, technologists, and investment architects.</span>
                  </li>
                  <li className="flex items-start space-x-3 text-gray-300">
                    <span className="text-blue-400 text-xl">•</span>
                    <span>Committed to delivering proven, IRS-compliant tax strategies.</span>
                  </li>
                  <li className="flex items-start space-x-3 text-gray-300">
                    <span className="text-blue-400 text-xl">•</span>
                    <span>Focused on converting tax savings into meaningful, long-term investments and legacies.</span>
                  </li>
                </ul>
              </div>

              <p className="text-2xl font-semibold text-center text-white mt-12">
                Do good. Get good. Together.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* The Pathway Section - Moved up */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">The Pathway</h2>
          <p className="mt-2 text-xl text-gray-600">
            A powerful alignment of heart and strategy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 mb-6">
                <svg className="w-full h-full text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Choose a Cause</h3>
              <p className="text-gray-600">
                We work with a network of vetted nonprofits delivering real-world results—focusing on first responders, public health organizations, and children's programs.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 mb-6">
                <svg className="w-full h-full text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fund a Donation</h3>
              <p className="text-gray-600">
                Your clients fund the donation of goods (such as health supplements, diagnostics, or equipment) at their wholesale rate. They never take possession—we handle all logistics.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="w-12 h-12 mb-6">
                <svg className="w-full h-full text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Deliver Impact + Tax Benefits</h3>
              <p className="text-gray-600">
                The nonprofit receives needed supplies. Your clients receive a full documentation package, including FMV Appraisal Report, Charitable Acknowledgment Letter, and Proof of Delivery & Compliance.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Supporting Our Heroes Section */}
      <div className="relative bg-gradient-to-b from-gray-900 to-gray-800 py-24">
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1582152629442-4a864303fb96?auto=format&fit=crop&q=80" 
            alt="Firefighter in action" 
            className="w-full h-full object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900/70" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="relative z-10">
              <div className="mb-6">
                <p className="text-sm tracking-widest text-gray-400">2025 BATTLEBORN PHILANTHROPIC INITIATIVE</p>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4 transform hover:scale-105 transition-transform duration-300">
                Supporting Our Heroes
              </h2>
              <h3 className="text-2xl font-semibold text-emerald-400 mb-8 transform hover:translate-x-2 transition-transform duration-300">
                Rebuilding Cardiac & Pulmonary Health in First Responders
              </h3>
              <div className="prose prose-lg prose-invert">
                <p className="text-gray-300 leading-relaxed hover:text-white transition-colors duration-300">
                  Every day, firefighters and EMTs put their lives on the line. But long after the sirens fade, 
                  their exposure to smoke, toxins, and high-stress trauma lingers — leaving many with chronic 
                  cardiac and respiratory conditions.
                </p>
                <p className="text-white font-semibold text-xl mt-6 transform hover:translate-x-2 transition-transform duration-300">
                  We're helping fix that.
                </p>
                <p className="text-gray-300 leading-relaxed mt-6 hover:text-white transition-colors duration-300">
                  Through donations made via the Philanthropic Benefit Pathway, your clients can directly fund 
                  specialized cardiac and pulmonary care regimens tailored for frontline heroes. These programs 
                  don't just support — they rebuild.
                </p>
              </div>
            </div>
            <div className="mt-12 lg:mt-0 relative z-10">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                <div className="group relative overflow-hidden rounded-xl shadow-2xl transform hover:scale-[1.02] transition-all duration-500 ease-out">
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 via-blue-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src="https://images.unsplash.com/photo-1599491143817-01484590a81f?auto=format&fit=crop&q=80"
                      alt="Firefighter in action"
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-xl shadow-2xl transform hover:scale-[1.02] transition-all duration-500 ease-out">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 via-orange-500 to-yellow-500 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                  <div className="relative overflow-hidden rounded-xl">
                    <img
                      src="https://images.unsplash.com/photo-1599045118108-bf9954418b76?auto=format&fit=crop&q=80&w=1000"
                      alt="EMT with ambulance"
                      className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Challenge and Initiative Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* The Challenge */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 transform hover:scale-[1.02] transition-all duration-500 shadow-xl">
            <h3 className="text-2xl font-bold text-white mb-2">The Challenge</h3>
            <h4 className="text-xl font-semibold text-blue-400 mb-6">
              First Responders Are in Crisis — And No One's Talking About It
            </h4>
            <p className="text-gray-300 mb-6">
              Firefighters, EMTs, and frontline personnel are exposed to smoke, chemicals, and physical trauma 
              at a level unmatched in civilian life.
            </p>
            <p className="text-gray-300 mb-4">As a result, they face dramatically higher rates of:</p>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-gray-300 group">
                <span className="flex-shrink-0 h-6 w-6 text-red-400 mt-1">❤️</span>
                <span className="group-hover:text-white transition-colors duration-300">
                  Cardiac arrhythmia and vascular inflammation
                </span>
              </li>
              <li className="flex items-start space-x-3 text-gray-300 group">
                <span className="flex-shrink-0 h-6 w-6 text-blue-400 mt-1">🫁</span>
                <span className="group-hover:text-white transition-colors duration-300">
                  Pulmonary fibrosis and chronic respiratory distress
                </span>
              </li>
              <li className="flex items-start space-x-3 text-gray-300 group">
                <span className="flex-shrink-0 h-6 w-6 text-yellow-400 mt-1">⚡</span>
                <span className="group-hover:text-white transition-colors duration-300">
                  Early-onset cardiovascular disease
                </span>
              </li>
            </ul>
            <p className="text-gray-300 mt-6 font-medium">
              These aren't isolated cases — they're systemic. And most don't have access to advanced, specialized care.
            </p>
          </div>

          {/* Our Initiative */}
          <div className="bg-white rounded-2xl p-8 transform hover:scale-[1.02] transition-all duration-500 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Our Initiative</h3>
            <h4 className="text-xl font-semibold text-emerald-600 mb-6">
              We're Rebuilding Cardiac & Pulmonary Health — Nationwide
            </h4>
            <p className="text-gray-600 mb-6">
              Through the Philanthropic Benefit Pathway, we direct donor-funded, evidence-based health programs 
              to those who need them most. Developed in collaboration with physicians and scientists at NanoGenesis Labs, this program delivers:
            </p>
            <div className="space-y-6">
              <div className="group">
                <h5 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                  <span className="text-blue-500 mr-2">🔹</span>
                  Cardiac Health Program
                </h5>
                <p className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                  Advanced diagnostics + cellular therapies to restore heart health post-exposure
                </p>
              </div>
              <div className="group">
                <h5 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                  <span className="text-blue-500 mr-2">🔹</span>
                  Pulmonary Care Initiative
                </h5>
                <p className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                  Targeted respiratory treatments designed to rebuild lung function
                </p>
              </div>
              <div className="group">
                <h5 className="flex items-center text-lg font-semibold text-gray-900 mb-2">
                  <span className="text-blue-500 mr-2">🔹</span>
                  Hero Health Initiative
                </h5>
                <p className="text-gray-600 group-hover:text-gray-900 transition-colors duration-300">
                  Ongoing wellness support for first responders and their families
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calculator Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Benefit Calculator</h2>
          <p className="mt-2 text-lg text-gray-600">
            Discover the powerful impact and tax advantages of our philanthropic pathway
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Heroes Supported</p>
              <p className="text-4xl font-bold text-purple-600">{calculations?.heroesSupported || 0}</p>
              <div className="flex items-center space-x-1">
                <span className="flex items-center text-xs text-purple-300">
                  <span className="w-2 h-2 rounded-full bg-purple-200 mr-1"></span>
                  Estimated Impact
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Philanthropic Impact</p>
              <p className="text-4xl font-bold text-pink-600">${calculations?.philanthropicImpact.toLocaleString() || '0'}</p>
              <div className="flex items-center space-x-1">
                <span className="flex items-center text-xs text-pink-300">
                  <span className="w-2 h-2 rounded-full bg-pink-200 mr-1"></span>
                  Total Value
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">Net Tax Savings</p>
              <p className="text-4xl font-bold text-emerald-600">${calculations?.netTaxSavings.toLocaleString() || '0'}</p>
              <div className="flex items-center space-x-1">
                <span className="flex items-center text-xs text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-200 mr-1"></span>
                  After Donation
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calculator Inputs */}
          <div className="lg:col-span-7 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">W-2 Income</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xl">$</span>
                  </div>
                  <NumericFormat
                    value={income || ''}
                    onValueChange={(values) => setIncome(values.floatValue || null)}
                    thousandSeparator={true}
                    className="block w-full pl-8 pr-12 py-4 text-2xl font-medium border-gray-300 rounded-md focus:ring-[#12ab61] focus:border-[#12ab61] bg-white"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="block w-full py-3 text-lg border-gray-300 rounded-md focus:ring-[#12ab61] focus:border-[#12ab61]"
                >
                  {states.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl">
                <label className="block text-sm font-medium text-gray-700 mb-2">Donation Amount</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-xl">$</span>
                  </div>
                  <NumericFormat
                    value={donationAmount || ''}
                    onValueChange={(values) => setDonationAmount(values.floatValue || null)}
                    thousandSeparator={true}
                    className="block w-full pl-8 pr-12 py-4 text-2xl font-medium border-gray-300 rounded-md focus:ring-[#12ab61] focus:border-[#12ab61] bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-5 bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 h-full flex flex-col">
              <h3 className="text-center text-sm font-medium text-gray-500 uppercase mb-4">
                Net Benefit Distribution
              </h3>
              <div className="flex-grow relative">
                {chartData && (
                  <div className="absolute inset-0">
                    <Doughnut
                      data={{
                        ...chartData,
                        datasets: [{
                          ...chartData.datasets[0],
                          data: [
                            (calculations?.federal || 0) - (calculations?.initial || 0),
                            calculations?.state || 0
                          ]
                        }]
                      }}
                      options={{
                        ...chartOptions,
                        maintainAspectRatio: false,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TBB Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tax Benefit Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Donation Amount</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">${calculations?.initial.toLocaleString() || '0'}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Federal Tax Benefit</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">${calculations?.federal.toLocaleString() || '0'}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">State Tax Benefit</td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right">${calculations?.state.toLocaleString() || '0'}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">Total Tax Benefit</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">${calculations?.totalBenefit.toLocaleString() || '0'}</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600">Net Savings</td>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-right">${calculations?.netTaxSavings.toLocaleString() || '0'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 shadow-xl">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              This Is More Than a Donation. It's a Legacy.
            </h2>
            <div className="space-y-4 mb-12">
              <div className="flex items-start space-x-3 text-left">
                <span className="flex-shrink-0 h-6 w-6 text-emerald-500 mt-1">✅</span>
                <span className="text-gray-700 text-lg">
                  Equips a first responder with customized, science-backed care
                </span>
              </div>
              <div className="flex items-start space-x-3 text-left">
                <span className="flex-shrink-0 h-6 w-6 text-emerald-500 mt-1">✅</span>
                <span className="text-gray-700 text-lg">
                  Delivers a professional third-party valuation for FMV-based tax deductions
                </span>
              </div>
              <div className="flex items-start space-x-3 text-left">
                <span className="flex-shrink-0 h-6 w-6 text-emerald-500 mt-1">✅</span>
                <span className="text-gray-700 text-lg">
                  Provides a fully managed donation experience — from logistics to paperwork
                </span>
              </div>
            </div>
            
            <blockquote className="text-2xl font-medium text-gray-900 italic mb-8">
              "Our donors don't just reduce their taxes — they extend lives."
            </blockquote>
            
            <p className="text-lg text-gray-700">
              This program transforms charitable giving into real-world healing.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
            <div className="lg:self-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                <span className="block">Ready to make an impact?</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-emerald-200">
                Get our detailed whitepaper about the philanthropic tax benefit pathway and a personalized value calculation.
              </p>
              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-emerald-700 bg-white hover:bg-emerald-50"
                >
                  Learn more
                </button>
                <a
                  href="https://calendar.app.google/JemBHKpc9rggCKus8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600"
                >
                  Free Consultation
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      <Dialog.Root open={showModal} onOpenChange={setShowModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <Dialog.Title className="text-2xl font-bold text-gray-900 mb-4">
              Get More Information
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#12ab61] focus:border-[#12ab61]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#12ab61] focus:border-[#12ab61]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#12ab61] focus:border-[#12ab61]"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#12ab61] rounded-md hover:bg-[#0f9654]"
                >
                  Get More Information
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Real Impact Section */}
      <div className="bg-gradient-to-br from-blue-900 to-indigo-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Real Impact, Real Lives</h2>
            <h3 className="text-2xl font-semibold text-blue-400">
              From Your Clients' Generosity to a Firefighter's Future
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 transform hover:scale-105 transition-all duration-300">
              <img 
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80" 
                alt="First responders in action" 
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
              <h4 className="text-xl font-semibold text-white mb-4">Cardiac Care</h4>
              <p className="text-blue-100">
                Comprehensive diagnostics and customized treatment plans for heart health restoration.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 transform hover:scale-105 transition-all duration-300">
              <img 
                src="https://images.unsplash.com/photo-1587574293340-e0011c4e8ecf?auto=format&fit=crop&q=80" 
                alt="Medical treatment" 
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
              <h4 className="text-xl font-semibold text-white mb-4">Pulmonary Therapy</h4>
              <p className="text-blue-100">
                Advanced treatments for smoke-related lung conditions and respiratory health.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 transform hover:scale-105 transition-all duration-300">
              <img 
                src="https://images.unsplash.com/photo-1590105577767-e21a1067899f?auto=format&fit=crop&q=80" 
                alt="Preventive care" 
                className="w-full h-48 object-cover rounded-lg mb-6"
              />
              <h4 className="text-xl font-semibold text-white mb-4">Ongoing Support</h4>
              <p className="text-blue-100">
                Preventive protocols and continuous support for long-term health maintenance.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-xl text-white">
              This is more than compliance. It's community, compassion, and contribution — with measurable impact.
            </p>
          </div>
        </div>
      </div>

      {/* Footer with Disclaimer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-sm prose-invert max-w-none">
            <h4 className="text-gray-400 font-semibold mb-4">Disclaimer</h4>
            <p className="text-gray-500 leading-relaxed">
              The information provided by Battleborn Advisors is for general informational purposes only and does not 
              constitute legal, tax, or financial advice. While we strive to provide accurate and up-to-date information, 
              Battleborn Advisors makes no representations or warranties of any kind, express or implied, about the 
              completeness, accuracy, reliability, suitability, or availability with respect to the website or the 
              information contained on the website for any purpose. Any reliance you place on such information is 
              strictly at your own risk.
            </p>
            <p className="text-gray-500 leading-relaxed mt-4">
              Please consult with your accountant, attorney, or other qualified advisor to assess the suitability of 
              our services for your specific circumstances. TaxRx operates as a tax advisory service and does not 
              replace your existing accountant or tax preparer. Use of our services or information does not establish 
              an attorney-client or fiduciary relationship.
            </p>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Battleborn Advisors, LLC. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 