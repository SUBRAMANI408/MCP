import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-dark-950">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-600/30 blur-[120px] animate-pulse-soft"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-sport-600/20 blur-[150px] animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-accent-600/10 blur-[100px] animate-float"></div>
        
        {/* CSS Grid Pattern Overlay */}
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row glass rounded-3xl overflow-hidden z-10 border border-dark-700/50 shadow-2xl animate-fade-in relative">
        
        {/* Left Side - Hero / Branding */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-primary-900 via-dark-900 to-sport-900 p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-sport-500 mb-6 shadow-lg shadow-primary-500/40 animate-float">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white font-display uppercase tracking-tighter leading-tight">
              Dominate <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-sport-400">The Field</span>
            </h1>
            <p className="mt-4 text-dark-100/80 font-medium max-w-sm">
              The ultimate platform to manage associations, organize tournaments, and track live matches in real-time.
            </p>
          </div>

          <div className="relative z-10 mt-12 md:mt-0">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-500"></span>
              </span>
              <p className="text-sm font-bold text-accent-400 uppercase tracking-widest">Platform Active</p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-dark-900/80 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Access Portal</h2>
            <p className="text-dark-100/60 text-sm mb-8">Enter your credentials to access your dashboard.</p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="player@sports.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="label !mb-0">Password</label>
                  <Link to="/forgot-password" className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-wider">
                    Recover?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-100/40 hover:text-primary-400 transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3.5 mt-4"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Authenticating...
                  </span>
                ) : 'Enter Platform'}
              </button>
            </form>
            
            <div className="text-center mt-8">
              <span className="text-sm text-dark-100/50 font-medium">New athlete? </span>
              <Link to="/register" className="text-sm text-sport-400 hover:text-sport-300 font-bold transition-colors tracking-wide uppercase">
                Register Profile
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
