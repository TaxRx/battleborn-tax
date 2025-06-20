import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import FormInput from '../../components/forms/FormInput';
import { LoginFormData } from '../../types';
import { toast } from 'react-toastify';
import { useUser } from '../../context/UserContext';
import DemoAccessButton from '../../components/common/DemoAccessButton';
import { isDemoMode } from '../../utils/demoMode';
import { demoUsers } from '../../data/demoSeed';
import { useContext } from 'react';
import { UserContext } from '../../context/UserContext';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();
  const { signIn } = useUser();
  const { setUser } = useContext(UserContext);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast.error('Login failed. Please check your credentials.');
        return;
      }
      toast.success('Successfully logged in!');
      // Fetch user role from Supabase (if you store it in the users table)
      // For now, default to /client
      navigate('/client');
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
      console.error('Login error:', error);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'client') => {
    const user = demoUsers.find(u => u.role === role);
    if (user) {
      localStorage.setItem('demoUser', JSON.stringify(user));
      setUser(user);
      window.location.href = '/dashboard';
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
        Sign in to your account
      </h2>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address',
            },
          })}
        />

        <FormInput
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('rememberMe')}
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
              Forgot your password?
            </Link>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            className="w-full"
          >
            Sign in
          </Button>
        </div>
      </form>

      <div className="mt-6">
        <div className="text-center">
          <span className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </span>
        </div>
      </div>

      {/* Demo Access Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">
          Or try a demo account
        </h3>
        <div className="flex flex-col space-y-2">
          <DemoAccessButton userType="client" className="w-full" />
          <DemoAccessButton userType="admin" className="w-full" />
        </div>
      </div>

      {isDemoMode() && (
        <div style={{ marginTop: 24 }}>
          <h3>Demo Mode</h3>
          <button onClick={() => handleDemoLogin('admin')}>Login as Admin</button>
          <button onClick={() => handleDemoLogin('client')}>Login as Client</button>
        </div>
      )}
    </div>
  );
};

export default Login;