import React from 'react';
import { Link } from 'react-router-dom';
import { LightbulbIcon as LightBulbIcon } from 'lucide-react';
import { 
  CheckCircleIcon, 
  AcademicCapIcon, 
  BanknotesIcon, 
  ShieldCheckIcon,
  ChartBarIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import DemoAccessButton from '../../components/common/DemoAccessButton';

const LandingPage: React.FC = () => {
  const benefits = [
    {
      title: 'Maximize Your R&D Credits',
      description: 'Our AI-powered platform identifies qualifying activities that many healthcare professionals miss, ensuring you receive the maximum credit you deserve.',
      icon: BanknotesIcon,
    },
    {
      title: 'Streamlined Process',
      description: 'Say goodbye to complex paperwork and tedious calculations. Our step-by-step approach simplifies the entire R&D tax credit process.',
      icon: ClipboardDocumentCheckIcon,
    },
    {
      title: 'Clinical Expertise',
      description: 'Built specifically for healthcare professionals with pre-mapped activities relevant to dentistry, orthodontics, and other medical practices.',
      icon: AcademicCapIcon,
    },
    {
      title: 'Audit Protection',
      description: 'Comprehensive documentation and compliance-focused approach provides solid protection in case of audit.',
      icon: ShieldCheckIcon,
    },
  ];

  const testimonials = [
    {
      quote: "This platform transformed how we handle R&D tax credits. The AI suggestions identified activities we never considered eligible before.",
      author: "Dr. Sarah Johnson",
      role: "Dentist, Johnson Dental Care",
    },
    {
      quote: "The step-by-step process made claiming R&D credits simple and straightforward. We were amazed by the final credit amount.",
      author: "Dr. Michael Chen",
      role: "Orthodontist, Chen Orthodontics",
    },
    {
      quote: "As a busy medical practice, we didn't have time to navigate complex tax credits. This solution did the heavy lifting for us.",
      author: "Dr. Robert Garcia",
      role: "Family Medicine, Garcia Medical Center",
    },
  ];

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <LightBulbIcon className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">R&D Tax Pro</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <a href="#features" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">Testimonials</a>
              <Link to="/login" className="text-blue-600 hover:text-blue-500 px-3 py-2 text-sm font-medium">Login</Link>
              <Link 
                to="/register" 
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>
            <div className="flex md:hidden">
              <button className="text-gray-600 hover:text-gray-900">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-blue-600 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 py-20 sm:py-24 md:py-32 lg:py-40">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                <span className="block">R&D Tax Credits for</span>
                <span className="block text-blue-200">Healthcare Professionals</span>
              </h1>
              <p className="mt-3 text-base text-blue-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto lg:mx-0">
                Our AI-driven platform helps clinicians like you qualify for and maximize R&D tax credits 
                specifically designed for healthcare innovations. Stop leaving money on the table.
              </p>
              <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link 
                    to="/register" 
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                  >
                    Start Your Claim
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <a 
                    href="#how-it-works" 
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-500 bg-opacity-30 hover:bg-opacity-40 md:py-4 md:text-lg md:px-10 transition-colors duration-200"
                  >
                    Learn More
                  </a>
                </div>
              </div>
              
              {/* Demo Access Buttons */}
              <div className="mt-6 sm:flex sm:justify-center lg:justify-start space-y-3 sm:space-y-0 sm:space-x-4">
                <DemoAccessButton 
                  userType="client" 
                  variant="outline" 
                  className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20"
                />
                <DemoAccessButton 
                  userType="admin" 
                  variant="outline" 
                  className="w-full sm:w-auto bg-white/10 text-white border-white/20 hover:bg-white/20"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 hidden lg:block lg:w-1/2">
          <svg 
            className="absolute right-0 h-full text-blue-600 transform translate-x-1/3" 
            fill="currentColor"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon points="50,0 100,0 50,100 0,100" />
          </svg>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 uppercase tracking-wide">Features</h2>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Designed for Healthcare Innovation
            </p>
            <p className="max-w-2xl mt-5 mx-auto text-xl text-gray-500">
              Our platform is specifically tailored to identify and document R&D activities in clinical settings.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                      <benefit.icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{benefit.title}</h3>
                    <p className="mt-2 text-base text-gray-500">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 uppercase tracking-wide">Process</h2>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              How It Works
            </p>
            <p className="max-w-2xl mt-5 mx-auto text-xl text-gray-500">
              A simple, guided process to maximize your R&D tax credits with minimal effort.
            </p>
          </div>

          <div className="mt-16">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">Simple 9-Step Process</span>
              </div>
            </div>

            <div className="mt-8 max-w-3xl mx-auto">
              <div className="space-y-8">
                {[
                  { 
                    step: 1, 
                    title: 'Create Your Account', 
                    description: 'Sign up with your name and email to get started.' 
                  },
                  { 
                    step: 2, 
                    title: 'Enter Business Information', 
                    description: 'Provide basic details about your practice, specialty, and location.' 
                  },
                  { 
                    step: 3, 
                    title: 'Upload Documents', 
                    description: 'Upload your production and payroll reports for AI analysis.' 
                  },
                  { 
                    step: 4, 
                    title: 'Review AI Suggestions', 
                    description: 'Our AI identifies qualifying R&D activities based on your practice.' 
                  },
                  { 
                    step: 5, 
                    title: 'Staff Review', 
                    description: 'Confirm staff involvement in research activities.' 
                  },
                  { 
                    step: 6, 
                    title: 'Finalize Calculations', 
                    description: 'Review and approve final tax credit calculations.' 
                  },
                  { 
                    step: 7, 
                    title: 'Expert Review', 
                    description: 'Our administrators review your claim for accuracy and compliance.' 
                  },
                  { 
                    step: 8, 
                    title: 'Payment', 
                    description: 'Pay the final fee to unlock your complete reports.' 
                  },
                  { 
                    step: 9, 
                    title: 'Download Reports', 
                    description: 'Receive comprehensive reports for your accountant and records.' 
                  }
                ].map((item) => (
                  <div key={item.step} className="relative">
                    <div>
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="h-full w-0.5 bg-gray-200 ml-7" />
                      </div>
                      <div className="relative flex space-x-4">
                        <div>
                          <span className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold">
                            {item.step}
                          </span>
                        </div>
                        <div className="min-w-0 pt-1.5">
                          <h3 className="text-lg font-medium text-gray-900">
                            {item.title}
                          </h3>
                          <p className="text-base text-gray-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-200 uppercase tracking-wide">Testimonials</h2>
            <p className="mt-1 text-3xl font-extrabold text-white sm:text-4xl">
              Hear From Our Clients
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="text-blue-600 mb-4">
                    <svg width="45" height="36" className="fill-current">
                      <path d="M13.415.001C6.07 5.185.887 13.681.887 23.041c0 7.632 4.608 12.096 9.936 12.096 5.04 0 8.784-4.032 8.784-8.784 0-4.752-3.312-8.208-7.632-8.208-.864 0-2.016.144-2.304.288.72-4.896 5.328-10.656 9.936-13.536L13.415.001zm24.768 0c-7.2 5.184-12.384 13.68-12.384 23.04 0 7.632 4.608 12.096 9.936 12.096 4.896 0 8.784-4.032 8.784-8.784 0-4.752-3.456-8.208-7.776-8.208-.864 0-1.872.144-2.16.288.72-4.896 5.184-10.656 9.792-13.536L38.183.001z"></path>
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-6">{testimonial.quote}</p>
                  <div>
                    <p className="font-bold text-gray-900">{testimonial.author}</p>
                    <p className="text-gray-500 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 rounded-lg shadow-xl overflow-hidden">
            <div className="pt-10 pb-12 px-6 sm:pt-16 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
              <div className="lg:self-center lg:max-w-3xl">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                  <span className="block">Ready to maximize your</span>
                  <span className="block text-blue-600">R&D tax credits?</span>
                </h2>
                <p className="mt-4 text-lg leading-6 text-gray-500">
                  Join thousands of healthcare professionals who are already benefiting from our platform.
                  Get started today and discover the R&D tax credits you've been missing.
                </p>
                <div className="mt-8">
                  <div className="inline-flex rounded-md shadow">
                    <Link
                      to="/register"
                      className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Create Free Account
                    </Link>
                  </div>
                  <div className="ml-3 inline-flex">
                    <Link
                      to="/login"
                      className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
                
                {/* Demo Access Buttons */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <DemoAccessButton userType="client" />
                  <DemoAccessButton userType="admin" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <div className="flex items-center">
                <LightBulbIcon className="h-8 w-8 text-white" />
                <span className="ml-2 text-xl font-bold text-white">R&D Tax Pro</span>
              </div>
              <p className="text-gray-300 text-base">
                Helping healthcare professionals maximize their R&D tax credits with a streamlined, AI-powered platform.
              </p>
              <div className="flex space-x-6">
                {/* Social links would go here */}
              </div>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Solutions
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Dental Practices
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Orthodontics
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Medical Practices
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Specialists
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Support
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Help Center
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Guides
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        API Status
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Company
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        About
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Blog
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Partners
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                    Legal
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; 2025 R&D Tax Pro, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;