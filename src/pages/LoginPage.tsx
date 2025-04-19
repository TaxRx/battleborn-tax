import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, testConnection } from '../lib/supabase';
import { useUserStore } from '../store/userStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const navigate = useNavigate();
  const { fetchUserProfile, user, loading: profileLoading, error: profileError } = useUserStore();

  // Check network connectivity
  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;
    
    const checkNetwork = async () => {
      try {
        console.log('Checking network connection...');
        const isConnected = await testConnection();
        console.log('Connection test result:', isConnected);
        
        if (!mounted) return;
        
        if (isConnected) {
          setConnectionStatus('connected');
          setError('');
        } else {
          setConnectionStatus('error');
          setError('Unable to connect to the server. Please check your internet connection and try again.');
          
          // Retry connection check after 5 seconds
          retryTimeout = setTimeout(() => {
            if (mounted) {
              checkNetwork();
            }
          }, 5000);
        }
      } catch (err) {
        console.error('Network check failed:', err);
        if (!mounted) return;
        setConnectionStatus('error');
        setError('Unable to connect to the server. Please check your internet connection and try again.');
        
        // Retry connection check after 5 seconds
        retryTimeout = setTimeout(() => {
          if (mounted) {
            checkNetwork();
          }
        }, 5000);
      }
    };

    checkNetwork();
    
    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  // Handle navigation after successful login
  useEffect(() => {
    if (user && !profileLoading && !profileError) {
      if (user.isAdmin) {
        console.log('Admin user detected, redirecting to leads page...');
        navigate('/leads', { replace: true });
      } else {
        console.log('Regular user detected, redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profileLoading, profileError, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Starting login process...');
      
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      // Test connection before attempting sign in
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error('Unable to connect to the authentication service. Please check your network connection.');
      }

      console.log('Attempting to sign in...');
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        }
        throw new Error(signInError.message);
      }

      if (!data?.user) {
        throw new Error('Login successful but no user data received. Please try again.');
      }

      console.log('Login successful, fetching user profile...');
      await fetchUserProfile();

    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="/logo.png" alt="Battleborn Advisors" className="mx-auto h-12 w-auto" />
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isLoading || connectionStatus === 'checking'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#12ab61] focus:border-[#12ab61] sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading || connectionStatus === 'checking'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#12ab61] focus:border-[#12ab61] sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || connectionStatus !== 'connected'}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#12ab61] hover:bg-[#0f9654] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#12ab61] disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : connectionStatus === 'checking' ? 'Checking connection...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Need help?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <a
                href="mailto:support@battleborngroup.com"
                className="font-medium text-[#12ab61] hover:text-[#0f9654]"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 