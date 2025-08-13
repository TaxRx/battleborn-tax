import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService, AuthUser } from '../services/authService';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../store/authStore';
import { useUser } from '../context/UserContext';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'magic-link' | 'password'>('magic-link');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, logout } = useAuthStore();
  const { setUser } = useUser();

  useEffect(() => {
    // Check for magic link error in URL
    const magicLinkError = searchParams.get('error');
    if (magicLinkError === 'magic_link_failed') {
      setError('Magic link authentication failed. The link may have expired or is invalid. Please try logging in manually or request a new magic link.');
    }

    // Check if user is already authenticated, if so redirect to dashboard
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          console.log('User already authenticated, redirecting to dashboard');
          navigate('/dashboard');
          return;
        }
        
        // Check if we came from a magic link redirect (referrer contains hash fragments)
        const cameFromMagicLink = document.referrer && (
          document.referrer.includes('access_token=') || 
          document.referrer.includes('type=magiclink')
        );
        
        // Only force logout if explicitly on /login route and NOT from magic link redirect
        if (window.location.pathname === '/login' && !cameFromMagicLink) {
          // Clear auth store
          logout();
          
          // Clear user context
          setUser(null);
          
          // Sign out from Supabase (don't wait for it)
          supabase.auth.signOut().catch(error => console.error('Supabase signOut error:', error));
          
          // Clear any cached data
          localStorage.clear();
          sessionStorage.clear();
          
          console.log('Forced logout on explicit login page visit');
        } else if (cameFromMagicLink) {
          console.log('Login page accessed from magic link redirect, skipping forced logout');
        }
      } catch (error) {
        console.error('Error during auth check:', error);
      }
    };
    
    checkAuthAndRedirect();
  }, [navigate, logout, setUser, searchParams]);

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setMagicLinkSent(false);

    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }

      const { success, error: magicLinkError, message } = await authService.sendMagicLink(email);

      if (!success || magicLinkError) {
        throw new Error(magicLinkError || 'Failed to send login link');
      }

      setMagicLinkSent(true);
      setError('');
    } catch (err) {
      console.error('Magic link error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !otpCode) {
        throw new Error('Please enter the 6-digit code');
      }

      if (otpCode.length !== 6) {
        throw new Error('Please enter a valid 6-digit code');
      }

      const { user, error: verifyError } = await authService.verifyOtp(email, otpCode, setUser);

      if (verifyError) {
        throw new Error(verifyError);
      }

      if (!user) {
        throw new Error('OTP verification failed - no user data received');
      }

      // Update auth store with user type
      const userType = user.profile.account?.type || 'client';
      login(userType);

      // Show user info and redirect
      console.log('OTP login successful:', {
        email: user.profile.email,
        isAdmin: user.isAdmin,
        isClientUser: user.isClientUser,
        clientCount: user.clients?.length || 0,
        permissions: user.permissions,
        userType
      });

      const redirectPath = authService.getRedirectPath(user);
      navigate(redirectPath);
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      const { user, error: signInError } = await authService.signIn(email, password, setUser);

      if (signInError) {
        throw new Error(signInError);
      }

      if (!user) {
        throw new Error('Login failed - no user data received');
      }

      // Update auth store with user type
      const userType = user.profile.account?.type || 'client';
      login(userType);

      // Show user info and redirect
      console.log('Login successful:', {
        email: user.profile.email,
        isAdmin: user.isAdmin,
        isClientUser: user.isClientUser,
        clientCount: user.clients?.length || 0,
        permissions: user.permissions,
        userType
      });

      const redirectPath = authService.getRedirectPath(user);
      navigate(redirectPath);
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">GT</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Access your tax planning dashboard
          </p>
        </div>
        
        {loginMode === 'magic-link' ? (
          // Magic Link Mode
          !magicLinkSent ? (
            // Step 1: Send Magic Link
            <form className="mt-8 space-y-6" onSubmit={handleMagicLinkSubmit}>
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending Link...' : 'Send Login Link'}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('password');
                    setError('');
                    setMagicLinkSent(false);
                  }}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Sign in with Password
                </button>
              </div>

              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Register here
                  </button>
                </div>
              </div>
            </form>
          ) : (
            // Step 2: Enter OTP Code or use Magic Link
            <div className="mt-8 space-y-6">
              <div className="rounded-md bg-green-50 p-4">
                <div className="text-sm text-green-700">
                  Login link sent! Please check your email and either:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Click the login link in your email, or</li>
                    <li>Enter the 6-digit code below</li>
                  </ul>
                </div>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div>
                  <label htmlFor="otp-code" className="sr-only">
                    6-digit verification code
                  </label>
                  <input
                    id="otp-code"
                    name="otp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm text-center text-lg tracking-widest font-mono"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      // Only allow numbers and limit to 6 digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500 text-center">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length !== 6}
                    className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>
                </div>
              </form>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={async () => {
                    setError('');
                    setIsLoading(true);
                    try {
                      await authService.sendMagicLink(email);
                    } catch (err) {
                      setError('Failed to resend code');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="font-medium text-blue-600 hover:text-blue-500 disabled:opacity-50"
                >
                  Resend Code
                </button>
                
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('password');
                      setError('');
                      setMagicLinkSent(false);
                      setOtpCode('');
                    }}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Sign in with Password
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setMagicLinkSent(false);
                      setError('');
                      setOtpCode('');
                    }}
                    className="font-medium text-gray-600 hover:text-gray-500"
                  >
                    ← Back to Email
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          // Password Mode
          <form className="mt-8 space-y-6" onSubmit={handlePasswordSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('magic-link');
                  setError('');
                  setPassword('');
                  setMagicLinkSent(false);
                  setOtpCode('');
                }}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Login with Email Link
              </button>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="font-medium text-blue-600 hover:text-blue-500 block"
              >
                Forgot your password?
              </button>
              <div className="text-sm text-gray-600">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Register here
                </button>
              </div>
            </div>
          </form>
        )}

      </div>
    </div>
  );
} 