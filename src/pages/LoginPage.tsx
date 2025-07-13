import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, AuthUser } from '../services/authService';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const user = await authService.getCurrentUser();
      if (user) {
        const redirectPath = authService.getRedirectPath(user);
        navigate(redirectPath);
      }
    };
    checkSession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      const { user, error: signInError } = await authService.signIn(email, password);

      if (signInError) {
        throw new Error(signInError);
      }

      if (!user) {
        throw new Error('Login failed - no user data received');
      }

      // Show user info and redirect
      console.log('Login successful:', {
        email: user.profile.email,
        isAdmin: user.isAdmin,
        isClientUser: user.isClientUser,
        primaryClientRole: user.primaryClientRole,
        clientCount: user.clientUsers.length,
        permissions: user.permissions
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
              <span className="text-white font-bold text-lg">B</span>
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

        {/* Development Info */}
        <div className="mt-8 p-4 bg-gray-100 rounded-md">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Development Login Info:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Test Client 1:</strong> dan@fellars.com / testpass123 (owner of "Dan Fellars" client)</p>
            <p><strong>Test Client 2:</strong> testclient@fellars.com / testpass123 (owner of "Test Client")</p>
            <p><strong>Admin:</strong> admin@taxrxgroup.com / testpass123 (system administrator)</p>
            <p>After login, you'll see role-based permissions and UI</p>
          </div>
        </div>
      </div>
    </div>
  );
} 