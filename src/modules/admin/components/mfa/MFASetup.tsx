// Epic 3: Multi-Factor Authentication Setup Component
// Foundation for future MFA implementation

import React, { useState, useEffect } from 'react';
import { adminSecurityService } from '../../services/adminSecurityService';

interface MFASettings {
  id?: string;
  user_id: string;
  enabled: boolean;
  method: 'totp' | 'sms' | 'email' | 'hardware_key';
  verified: boolean;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
}

interface MFASetupProps {
  onSetupComplete?: (success: boolean) => void;
  onCancel?: () => void;
}

export const MFASetup: React.FC<MFASetupProps> = ({
  onSetupComplete,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState<'select' | 'setup' | 'verify' | 'complete'>('select');
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'sms' | 'email'>('totp');
  const [settings, setSettings] = useState<MFASettings | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const mfaMethods = [
    {
      id: 'totp',
      name: 'Authenticator App',
      description: 'Use an authenticator app like Google Authenticator or Authy',
      icon: '📱',
      recommended: true
    },
    {
      id: 'sms',
      name: 'SMS Text Message',
      description: 'Receive verification codes via SMS',
      icon: '💬',
      recommended: false
    },
    {
      id: 'email',
      name: 'Email',
      description: 'Receive verification codes via email',
      icon: '📧',
      recommended: false
    }
  ];

  const handleMethodSelect = (method: 'totp' | 'sms' | 'email') => {
    setSelectedMethod(method);
    setCurrentStep('setup');
  };

  const handleTOTPSetup = async () => {
    setLoading(true);
    setError('');

    try {
      // In a real implementation, this would call the backend to generate TOTP secret
      // For now, we'll simulate the process
      const mockQrCodeUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      setQrCodeUrl(mockQrCodeUrl);
      setCurrentStep('verify');
    } catch (error) {
      setError('Failed to setup TOTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSMSSetup = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real implementation, this would send SMS verification code
      setCurrentStep('verify');
    } catch (error) {
      setError('Failed to send SMS verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSetup = async () => {
    setLoading(true);
    setError('');

    try {
      // In a real implementation, this would send email verification code
      setCurrentStep('verify');
    } catch (error) {
      setError('Failed to send email verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real implementation, this would verify the code with the backend
      const mockBackupCodes = [
        '12345678', '87654321', '11223344', '44332211',
        '56789012', '21098765', '99887766', '66778899'
      ];
      
      setBackupCodes(mockBackupCodes);
      setCurrentStep('complete');
      
      if (onSetupComplete) {
        onSetupComplete(true);
      }
    } catch (error) {
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const codesText = `TaxApp Admin MFA Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

Instructions:
- Use these codes if you lose access to your primary MFA method
- Each code can only be used once
- Generate new codes if you use more than half of them
- Keep these codes secure and private`;

    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const printBackupCodes = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>MFA Backup Codes</title>
            <style>
              body { font-family: monospace; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .codes { margin: 20px 0; }
              .code { margin: 5px 0; padding: 5px; background: #f5f5f5; }
              .warning { background: #fff3cd; padding: 10px; border: 1px solid #ffeaa7; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>TaxApp Admin MFA Backup Codes</h2>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="warning">
              <strong>IMPORTANT:</strong> Store these codes in a safe place. Each code can only be used once.
            </div>
            <div class="codes">
              ${backupCodes.map((code, index) => `<div class="code">${index + 1}. ${code}</div>`).join('')}
            </div>
            <div class="warning">
              <p><strong>Instructions:</strong></p>
              <ul>
                <li>Use these codes if you lose access to your primary MFA method</li>
                <li>Each code can only be used once</li>
                <li>Generate new codes if you use more than half of them</li>
                <li>Keep these codes secure and private</li>
              </ul>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          Set Up Multi-Factor Authentication
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Add an extra layer of security to your admin account
        </p>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Select Method */}
        {currentStep === 'select' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Choose Your Method</h3>
            <div className="grid gap-4">
              {mfaMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => handleMethodSelect(method.id as any)}
                  className="relative p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {method.recommended && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        Recommended
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{method.icon}</div>
                    <div>
                      <h4 className="text-md font-medium text-gray-900">{method.name}</h4>
                      <p className="text-sm text-gray-600">{method.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Setup */}
        {currentStep === 'setup' && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentStep('select')}
                className="text-blue-600 hover:text-blue-500"
              >
                ← Back to method selection
              </button>
            </div>

            {selectedMethod === 'totp' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Set Up Authenticator App</h3>
                <div className="bg-blue-50 p-4 rounded-md">
                  <h4 className="text-sm font-medium text-blue-900">Instructions:</h4>
                  <ol className="mt-2 text-sm text-blue-800 list-decimal list-inside space-y-1">
                    <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                    <li>Scan the QR code below or enter the secret key manually</li>
                    <li>Enter the 6-digit code from your app to verify</li>
                  </ol>
                </div>
                <div className="text-center">
                  <button
                    onClick={handleTOTPSetup}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'Generate QR Code'}
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'sms' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Set Up SMS Authentication</h3>
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> SMS is less secure than authenticator apps. We recommend using an authenticator app when possible.
                  </p>
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={handleSMSSetup}
                  disabled={loading || !phoneNumber}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {selectedMethod === 'email' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Set Up Email Authentication</h3>
                <div className="bg-yellow-50 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Email MFA is less secure than authenticator apps. Use this only if other methods are not available.
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Verification codes will be sent to your registered email address.
                </p>
                <button
                  onClick={handleEmailSetup}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Verify */}
        {currentStep === 'verify' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Verify Your Setup</h3>

            {selectedMethod === 'totp' && qrCodeUrl && (
              <div className="text-center space-y-4">
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                <p className="text-sm text-gray-600">
                  Scan this QR code with your authenticator app
                </p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-xs text-gray-600 font-mono">
                    Secret Key: JBSWY3DPEHPK3PXP (manual entry)
                  </p>
                </div>
              </div>
            )}

            {selectedMethod === 'sms' && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  A verification code has been sent to {phoneNumber}
                </p>
              </div>
            )}

            {selectedMethod === 'email' && (
              <div className="bg-blue-50 p-4 rounded-md">
                <p className="text-sm text-blue-800">
                  A verification code has been sent to your email address
                </p>
              </div>
            )}

            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
                maxLength={6}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentStep('setup')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleVerification}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify & Enable MFA'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Complete */}
        {currentStep === 'complete' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">MFA Setup Complete!</h3>
              <p className="mt-2 text-sm text-gray-600">
                Your account is now protected with multi-factor authentication.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Important: Save Your Backup Codes
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      Store these backup codes in a safe place. You can use them to access your account if you lose your primary MFA method.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Backup Codes</h4>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-2 rounded border">
                    {index + 1}. {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={downloadBackupCodes}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Download Codes
              </button>
              <button
                onClick={printBackupCodes}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Print Codes
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  if (onSetupComplete) onSetupComplete(true);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Complete Setup
              </button>
            </div>
          </div>
        )}

        {/* Cancel Button */}
        {currentStep !== 'complete' && onCancel && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-500 text-sm"
            >
              Cancel Setup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};