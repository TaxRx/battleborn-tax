import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import FormInput from '../../components/forms/FormInput';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement password reset logic
      toast.success('Password reset instructions have been sent to your email');
    } catch (error) {
      toast.error('Failed to send password reset instructions');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8">
      <h2 className="text-2xl font-bold text-center mb-6">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          required
        />
        
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Sending Instructions...' : 'Send Reset Instructions'}
        </Button>

        <div className="text-center mt-4">
          <Link 
            to="/login" 
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </Card>
  );
};

export default ForgotPassword;