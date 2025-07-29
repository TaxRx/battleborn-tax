import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [demoPassword, setDemoPassword] = useState('');
  const [showDemoLogins, setShowDemoLogins] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useAuthStore();
  const { setUser } = useUser();

  useEffect(() => {
    // Force logout when visiting login page
    const forceLogout = async () => {
      try {
        // Clear auth store
        logout();
        
        // Clear user context
        setUser(null);
        
        // Sign out from Supabase (don't wait for it)
        supabase.auth.signOut().catch(error => console.error('Supabase signOut error:', error));
        
        // Clear any cached data
        localStorage.clear();
        sessionStorage.clear();
        
        console.log('Forced logout on login page visit');
      } catch (error) {
        console.error('Error during forced logout:', error);
      }
    };
    
    forceLogout();
  }, [navigate, logout, setUser]);

  const handleSubmit = async (e: React.FormEvent) => {
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
        primaryClientRole: user.primaryClientRole,
        clientCount: user.clientUsers.length,
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

  const quickLogin = async (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
    setError('');
    setIsLoading(true);

    try {
      console.log('Abbount to Lgoin')
      const { user, error: signInError } = await authService.signIn(email, password, setUser);
      console.log('signIn Details', {user, signInError})
      if (signInError) {
        throw new Error(signInError);
      }

      if (!user) {
        throw new Error('Login failed - no user data received');
      }

      // Update auth store with user type
      const userType = user.profile.account?.type || 'client';
      login(userType);

      const redirectPath = authService.getRedirectPath(user);
      // Show user info and redirect
      console.log('Login successful:', {
        redirectPath, user, userType
      });
      navigate(redirectPath);
    } catch (err) {
      console.error('Quick login error:', err);
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
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              onClick={() => navigate('/forgot-password')}
              className="font-medium text-blue-600 hover:text-blue-500"
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

        {/* Demo Access */}
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          {!showDemoLogins ? (
            <div className="space-y-2">
              <input
                type="password"
                placeholder="Enter demo access code"
                value={demoPassword}
                onChange={(e) => {
                  setDemoPassword(e.target.value);
                  if (e.target.value === 'galileo11!!') {
                    setShowDemoLogins(true);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          ) : (
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quick Login (Click to login):</h3>
              <div className="text-xs space-y-2">
                <button
                  onClick={() => quickLogin('admin@example.com', 'testpass123')}
                  disabled={isLoading}
                  className="block w-full text-left p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span className="font-medium text-gray-900">Admin:</span> admin@example.com (platform administration)
                </button>
                <button
                  onClick={() => quickLogin('operator@example.com', 'testpass123')}
                  disabled={isLoading}
                  className="block w-full text-left p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span className="font-medium text-gray-900">Operator:</span> operator@example.com (service fulfillment)
                </button>
                <button
                  onClick={() => quickLogin('affiliate@example.com', 'testpass123')}
                  disabled={isLoading}
                  className="block w-full text-left p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <span className="font-medium text-gray-900">Affiliate:</span> affiliate@example.com (sales partner)
                </button>
                <button
                  onClick={() => quickLogin('client@example.com', 'testpass123')}
                  disabled={isLoading}
                  className="block w-full text-left p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <span className="font-medium text-gray-900">Client:</span> client@example.com (end customer)
                </button>
                <button
                  onClick={() => quickLogin('expert@example.com', 'testpass123')}
                  disabled={isLoading}
                  className="block w-full text-left p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <span className="font-medium text-gray-900">Expert:</span> expert@example.com (consultant)
                </button>
                <p className="text-gray-500 mt-2 italic">Click any account above to instantly login</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 