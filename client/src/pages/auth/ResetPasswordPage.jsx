import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { TrophyIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Token is missing');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast.success('Password reset successful. Please login with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed.');
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
          <h1 className="font-display text-3xl font-bold text-white">Create New Password</h1>
          <p className="text-dark-100/60 mt-1">Please enter your new password below</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? 'Resetting password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
