import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { TrophyIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      toast.success('Password reset link sent to your email');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-sport-500 mb-4 shadow-2xl shadow-primary-500/30">
            <TrophyIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Reset Password</h1>
          <p className="text-dark-100/60 mt-1">We will email you a link to reset it</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="your-email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-sm text-primary-400 hover:text-primary-300">
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
