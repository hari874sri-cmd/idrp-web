import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Leaf, Lock, Mail, AlertCircle, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginDemo } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'ADMIN') {
        navigate('/admin-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'DONOR' | 'RECEIVER' | 'ADMIN') => {
    setError(null);
    setLoading(true);
    try {
      await loginDemo(role);
      if (role === 'ADMIN') navigate('/admin-dashboard');
      else navigate('/dashboard');
    } catch (err: any) {
      setError('Could not log in with demo credentials. Please run seed command.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-forest-700 text-white flex items-center justify-center mx-auto shadow-xs">
            <Leaf className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Sign in to ReRoute AI</h2>
          <p className="text-xs text-gray-500">Access your food redistribution dashboard</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-forest-700 hover:bg-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* 1-Click Fast Evaluation Buttons */}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Fast Evaluation Logins (1-Click)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('DONOR')}
              className="py-1.5 px-2 bg-gray-50 hover:bg-forest-50 hover:text-forest-800 border border-gray-200 rounded-xl text-[11px] font-medium transition-colors text-center"
            >
              Demo Donor
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('RECEIVER')}
              className="py-1.5 px-2 bg-gray-50 hover:bg-forest-50 hover:text-forest-800 border border-gray-200 rounded-xl text-[11px] font-medium transition-colors text-center"
            >
              Demo Receiver
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('ADMIN')}
              className="py-1.5 px-2 bg-gray-50 hover:bg-forest-50 hover:text-forest-800 border border-gray-200 rounded-xl text-[11px] font-medium transition-colors text-center"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Don't have an organization account?{' '}
          <Link to="/register" className="text-forest-700 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

