import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const navigate = useNavigate();

  // Check network connectivity
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log('Checking Supabase connectivity...');
        console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
        
        // First try a basic fetch to the Supabase URL
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL);
        console.log('Basic connectivity check:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });

        // Then try to get the session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Session check:', {
          hasSession: !!sessionData?.session,
          sessionError: sessionError?.message
        });

        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
          setError('Unable to connect to the authentication service');
        }
      } catch (err) {
        console.error('Connection check failed:', err);
        setConnectionStatus('error');
        setError('Unable to connect to the authentication service. Please check your network connection.');
      }
    };
    checkConnection();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Starting sign in process...');
      console.log('Connection status:', connectionStatus);
      
      // Validate input
      if (!email || !password) {
        throw new Error('Please enter both email and password');
      }

      // Log the request we're about to make
      console.log('Preparing sign in request:', {
        email,
        url: import.meta.env.VITE_SUPABASE_URL,
        hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Sign in response:', {
        hasData: !!data,
        hasError: !!signInError,
        errorMessage: signInError?.message,
        errorStatus: signInError?.status
      });

      if (signInError) {
        console.error('Sign in error details:', {
          message: signInError.message,
          status: signInError.status,
          name: signInError.name,
          stack: signInError.stack
        });
        
        if (signInError.message.includes('fetch')) {
          setError('Unable to connect to the authentication service. Please check your internet connection and try again.');
        } else {
          setError(signInError.message);
        }
        return;
      }

      if (data?.user) {
        console.log('Sign in successful, user:', {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role
        });
        
        // Wait a moment for the auth state to update
        await new Promise(resolve => setTimeout(resolve, 500));
        navigate('/dashboard', { replace: true });
      } else {
        console.error('No user data received');
        setError('Login successful but no user data received. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error during sign in:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError('An unexpected error occurred. Please try again.');
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#12ab61] hover:bg-[#0f9654] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#12ab61] disabled:opacity-50"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
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