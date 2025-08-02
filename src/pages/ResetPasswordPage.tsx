import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import PasswordStrengthMeter, { validatePasswordStrength } from '../components/PasswordStrengthMeter';
import { passwordService } from '../services/passwordService';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidPassword, setIsValidPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Check if we have tokens from URL (query params or fragment) or if user is already authenticated
  useEffect(() => {
    // First check query parameters
    let accessToken = searchParams.get('access_token');
    let refreshToken = searchParams.get('refresh_token');
    
    // If not found in query params, check URL fragment (hash)
    if (!accessToken || !refreshToken) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      accessToken = hashParams.get('access_token');
      refreshToken = hashParams.get('refresh_token');
    }
    
    if (accessToken && refreshToken) {
      // Set the session with the tokens from the URL
      const setSession = async () => {
        try {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            setError('Invalid or expired reset link. Please request a new password reset.');
          }
        } catch (err) {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      };
      setSession();
    } else {
      // Check if user is already authenticated (for development/testing)
      const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Invalid or expired reset link. Please request a new password reset.');
        }
      };
      checkAuth();
    }
  }, [searchParams]);

  const handlePasswordStrengthChange = (strength: number, isValid: boolean) => {
    setIsValidPassword(isValid);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate password strength
      const { isValid, failedRequirements } = validatePasswordStrength(password);
      if (!isValid) {
        throw new Error(`Password does not meet requirements: ${failedRequirements.join(', ')}`);
      }

      // Check if passwords match
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Update the password using the password service
      const result = await passwordService.updatePassword(password);

      if (!result.success) {
        throw new Error(result.error);
      }

      setIsSuccess(true);
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center">
              <div className="h-8 w-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">✓</span>
              </div>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Password updated successfully
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Your password has been updated. You will be redirected to the login page shortly.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="text-sm text-green-700">
              <p className="font-medium mb-2">✓ Success!</p>
              <p>You can now sign in with your new password.</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center font-medium text-blue-600 hover:text-blue-500"
            >
              Go to login now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">GT</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create new password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* New Password */}
            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center top-6"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Password Strength Meter */}
          <PasswordStrengthMeter 
            password={password} 
            onStrengthChange={handlePasswordStrengthChange}
          />

          {/* Password Match Indicator */}
          {confirmPassword && (
            <div className="flex items-center space-x-2">
              <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                password === confirmPassword ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <span className={`text-xs ${
                  password === confirmPassword ? 'text-green-600' : 'text-red-600'
                }`}>
                  {password === confirmPassword ? '✓' : '✗'}
                </span>
              </div>
              <span className={`text-sm ${
                password === confirmPassword ? 'text-green-700' : 'text-red-700'
              }`}>
                {password === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {error}
                {error.includes('Invalid or expired reset link') && (
                  <div className="mt-2">
                    <button
                      onClick={() => navigate('/forgot-password')}
                      className="font-medium text-red-600 hover:text-red-500 underline"
                    >
                      Request a new password reset
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !isValidPassword || password !== confirmPassword}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Updating password...' : 'Update password'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 