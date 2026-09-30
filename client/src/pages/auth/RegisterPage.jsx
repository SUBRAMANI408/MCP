import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../app/store';
import { TrophyIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('player');
  const [associationId, setAssociationId] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error('Please fill in required fields');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        name,
        email,
        password,
        phone: phone || undefined,
        role,
        associationId: associationId || undefined
      });
      const { token, user } = res.data.data;
      setAuth(user, token);
      toast.success(`Account created! Welcome, ${user.name}`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4" style={{
      background: 'radial-gradient(ellipse at 20% 50%, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(34,197,94,0.08) 0%, transparent 50%), #0f172a'
    }}>
      <div className="w-full max-w-md animate-fade-in my-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-sport-500 mb-4 shadow-2xl shadow-primary-500/30">
            <TrophyIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Create Account</h1>
          <p className="text-dark-100/60 mt-1">Join the Sports Association Platform</p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                className="input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Email Address *</label>
              <input
                type="email"
                className="input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-12"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-100/40 hover:text-dark-100/80 transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Select Role *</label>
              <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="player">Player</option>
                <option value="captain">Team Captain</option>
                <option value="association_head">Association Head</option>
                <option value="tournament_organizer">Tournament Organizer</option>
                <option value="ground_officer">Ground booking Officer</option>
                <option value="funds_officer">Funds Officer</option>
              </select>
            </div>
            {role !== 'player' && (
              <div>
                <label className="label">Association ID (Optional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Enter Association Mongo ID if known"
                  value={associationId}
                  onChange={(e) => setAssociationId(e.target.value)}
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base mt-2"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-sm text-dark-100/50">Already have an account? </span>
            <Link to="/login" className="text-sm text-primary-400 hover:text-primary-300 font-semibold transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
