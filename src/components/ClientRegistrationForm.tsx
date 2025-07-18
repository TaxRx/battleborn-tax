import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, Building, User, Mail, Phone, MapPin, Hash, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

interface ClientRegistrationFormProps {
  onRegistrationSuccess: (data: { clientId: string; userId: string }) => void;
  onClose: () => void;
  invitationToken?: string;
  affiliateId?: string;
  accountType?: 'client' | 'affiliate' | 'expert';
}

interface FormData {
  // Business Information
  businessName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  taxId: string;
  businessType: string;
  
  // Owner Information
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  password: string;
  confirmPassword: string;
  
  // Optional fields
  invitationToken?: string;
  affiliateId?: string;
  accountType?: 'client' | 'affiliate' | 'expert';
}

interface FormErrors {
  [key: string]: string;
}

const businessTypes = [
  'LLC',
  'Corporation',
  'S-Corporation',
  'Partnership',
  'Sole Proprietorship',
  'Non-Profit',
  'Other'
];

export default function ClientRegistrationForm({ 
  onRegistrationSuccess, 
  onClose,
  invitationToken,
  affiliateId,
  accountType = 'client'
}: ClientRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessAddress: '',
    taxId: '',
    businessType: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    confirmPassword: '',
    invitationToken: invitationToken || '',
    affiliateId: affiliateId || '',
    accountType: accountType
  });

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ''
  });

  // Password strength checker
  useEffect(() => {
    if (formData.password) {
      const password = formData.password;
      let score = 0;
      let feedback = '';

      if (password.length >= 8) score += 1;
      if (password.length >= 12) score += 1;
      if (/[A-Z]/.test(password)) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;

      if (score < 3) {
        feedback = 'Weak - Add more characters, numbers, and symbols';
      } else if (score < 5) {
        feedback = 'Good - Consider adding more complexity';
      } else {
        feedback = 'Strong - Excellent password security';
      }

      setPasswordStrength({ score, feedback });
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [formData.password]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Format Tax ID as they type
    if (field === 'taxId') {
      const formatted = formatTaxId(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    }

    // Format phone numbers as they type
    if (field === 'businessPhone' || field === 'ownerPhone') {
      const formatted = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [field]: formatted }));
    }
  };

  const formatTaxId = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) {
      return digits;
    } else {
      return `${digits.slice(0, 2)}-${digits.slice(2, 9)}`;
    }
  };

  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      // Business Information Validation
      if (!formData.businessName.trim()) {
        newErrors.businessName = 'Business name is required';
      }
      if (!formData.businessEmail.trim()) {
        newErrors.businessEmail = 'Business email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) {
        newErrors.businessEmail = 'Please enter a valid email address';
      }
      if (!formData.businessPhone.trim()) {
        newErrors.businessPhone = 'Business phone is required';
      }
      if (!formData.businessAddress.trim()) {
        newErrors.businessAddress = 'Business address is required';
      }
      if (!formData.taxId.trim()) {
        newErrors.taxId = 'Tax ID (EIN) is required';
      } else if (!/^\d{2}-\d{7}$/.test(formData.taxId)) {
        newErrors.taxId = 'Tax ID must be in format XX-XXXXXXX';
      }
      if (!formData.businessType) {
        newErrors.businessType = 'Business type is required';
      }
    } else if (step === 2) {
      // Owner Information Validation
      if (!formData.ownerFirstName.trim()) {
        newErrors.ownerFirstName = 'First name is required';
      }
      if (!formData.ownerLastName.trim()) {
        newErrors.ownerLastName = 'Last name is required';
      }
      if (!formData.ownerEmail.trim()) {
        newErrors.ownerEmail = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.ownerEmail)) {
        newErrors.ownerEmail = 'Please enter a valid email address';
      }
      if (!formData.ownerPhone.trim()) {
        newErrors.ownerPhone = 'Phone number is required';
      }
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(2)) {
      return;
    }

    setLoading(true);

    try {
      // Call the user registration Edge Function
      const { data, error } = await supabase.functions.invoke('user-service', {
        body: {
          pathname: '/user-service/register',
          email: formData.ownerEmail,
          password: formData.password,
          fullName: `${formData.ownerFirstName} ${formData.ownerLastName}`,
          type: formData.accountType,
          personalInfo: {
            firstName: formData.ownerFirstName,
            lastName: formData.ownerLastName,
            phone: formData.ownerPhone,
            email: formData.ownerEmail
          },
          businessInfo: {
            businessName: formData.businessName,
            businessEmail: formData.businessEmail,
            businessPhone: formData.businessPhone,
            businessAddress: formData.businessAddress,
            taxId: formData.taxId,
            businessType: formData.businessType
          },
          invitationToken: formData.invitationToken,
          affiliateId: formData.affiliateId
        }
      });

      if (error) {
        console.error('Registration error:', error);
        toast.error(error.message || 'Registration failed. Please try again.');
        return;
      }

      if (data?.error) {
        console.error('Registration error:', data.error);
        toast.error(data.error);
        return;
      }

      // Success!
      toast.success('Registration successful! Please check your email for verification.');
      onRegistrationSuccess({
        clientId: data.clientId,
        userId: data.userId
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          {accountType === 'client' ? 'Business Information' : 
           accountType === 'affiliate' ? 'Firm Information' : 
           'Practice Information'}
        </h2>
        <p className="text-gray-600">
          {accountType === 'client' ? 'Tell us about your business' : 
           accountType === 'affiliate' ? 'Tell us about your firm' : 
           'Tell us about your practice'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {accountType === 'client' ? 'Business Name' : 
             accountType === 'affiliate' ? 'Firm Name' : 
             'Practice Name'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.businessName}
            onChange={(e) => handleInputChange('businessName', e.target.value)}
            className={`w-full px-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.businessName ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder={accountType === 'client' ? 'Enter your business name' : 
                        accountType === 'affiliate' ? 'Enter your firm name' : 
                        'Enter your practice name'}
          />
          {errors.businessName && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.businessName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {accountType === 'client' ? 'Business Email' : 
             accountType === 'affiliate' ? 'Firm Email' : 
             'Practice Email'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              value={formData.businessEmail}
              onChange={(e) => handleInputChange('businessEmail', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.businessEmail ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="business@example.com"
            />
          </div>
          {errors.businessEmail && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.businessEmail}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {accountType === 'client' ? 'Business Phone' : 
             accountType === 'affiliate' ? 'Firm Phone' : 
             'Practice Phone'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              value={formData.businessPhone}
              onChange={(e) => handleInputChange('businessPhone', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.businessPhone ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="555-123-4567"
            />
          </div>
          {errors.businessPhone && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.businessPhone}
            </p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {accountType === 'client' ? 'Business Address' : 
             accountType === 'affiliate' ? 'Firm Address' : 
             'Practice Address'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={formData.businessAddress}
              onChange={(e) => handleInputChange('businessAddress', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.businessAddress ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="123 Business St, City, State 12345"
            />
          </div>
          {errors.businessAddress && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.businessAddress}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax ID (EIN) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => handleInputChange('taxId', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.taxId ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="XX-XXXXXXX"
              maxLength={10}
            />
          </div>
          {errors.taxId && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.taxId}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {accountType === 'client' ? 'Business Type' : 
             accountType === 'affiliate' ? 'Firm Type' : 
             'Practice Type'} <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
            className={`w-full px-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.businessType ? 'border-red-500' : 'border-gray-200'
            }`}
          >
            <option value="">
              {accountType === 'client' ? 'Select business type' : 
               accountType === 'affiliate' ? 'Select firm type' : 
               'Select practice type'}
            </option>
            {businessTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.businessType && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.businessType}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Owner Information</h2>
        <p className="text-gray-600">Create your account details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.ownerFirstName}
            onChange={(e) => handleInputChange('ownerFirstName', e.target.value)}
            className={`w-full px-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.ownerFirstName ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="John"
          />
          {errors.ownerFirstName && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.ownerFirstName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.ownerLastName}
            onChange={(e) => handleInputChange('ownerLastName', e.target.value)}
            className={`w-full px-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              errors.ownerLastName ? 'border-red-500' : 'border-gray-200'
            }`}
            placeholder="Doe"
          />
          {errors.ownerLastName && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.ownerLastName}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.ownerEmail ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="john@example.com"
            />
          </div>
          {errors.ownerEmail && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.ownerEmail}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="tel"
              value={formData.ownerPhone}
              onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
              className={`w-full pl-12 pr-4 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.ownerPhone ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="555-987-6543"
            />
          </div>
          {errors.ownerPhone && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.ownerPhone}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-12 pr-12 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.password ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formData.password && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      passwordStrength.score < 3 ? 'bg-red-500' : 
                      passwordStrength.score < 5 ? 'bg-yellow-500' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  />
                </div>
                <span className={`text-sm font-medium ${
                  passwordStrength.score < 3 ? 'text-red-600' : 
                  passwordStrength.score < 5 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {passwordStrength.score < 3 ? 'Weak' : 
                   passwordStrength.score < 5 ? 'Good' : 
                   'Strong'}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{passwordStrength.feedback}</p>
            </div>
          )}
          {errors.password && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full pl-12 pr-12 py-3 bg-white border rounded-lg text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <p className="text-green-600 text-sm mt-1 flex items-center">
              <CheckCircle className="w-4 h-4 mr-1" />
              Passwords match
            </p>
          )}
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.confirmPassword}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div>
            <h1 className="text-2xl font-bold">
              {accountType === 'client' ? 'Client Registration' : 
               accountType === 'affiliate' ? 'Affiliate Registration' : 
               'Expert Registration'}
            </h1>
            <p className="text-blue-100">Step {currentStep} of 2</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white hover:text-gray-200 text-2xl font-bold transition-colors duration-200"
          >
            &times;
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 2) * 100}%` }}
              />
            </div>
            <span className="ml-4 text-sm font-medium text-gray-600">
              {currentStep === 1 ? 
                (accountType === 'client' ? 'Business Information' : 
                 accountType === 'affiliate' ? 'Firm Information' : 
                 'Practice Information') : 
                'Owner Information'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
          </form>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {invitationToken && (
              <p className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                Registration via invitation
              </p>
            )}
          </div>
          <div className="flex space-x-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Previous
              </button>
            )}
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                onClick={handleSubmit}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 