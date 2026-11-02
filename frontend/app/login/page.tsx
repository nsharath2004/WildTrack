'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { apiRequest } from '@/services/api';
import { PawPrint, Lock, User, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res: any = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      login(res.token, res.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 bg-forest-950 flex items-center justify-center p-4 z-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Brand Banner */}
        <div className="bg-forest-900 p-8 text-center text-white relative">
          <div className="w-16 h-16 rounded-2xl bg-forest-700/80 mx-auto flex items-center justify-center text-green-300 shadow-inner mb-3">
            <PawPrint className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">WildTrack Portal</h1>
          <p className="text-xs text-forest-200 mt-1">PES University Wildlife Conservation DBMS</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Username or Official Email
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (e.g. admin)"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:border-forest-600 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-forest-600 focus:border-forest-600 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-forest-800 hover:bg-forest-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>

          {/* Role testing shortcuts for evaluators */}
          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center mb-2">
              Evaluation Role Presets
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="px-2 py-1.5 bg-gray-100 hover:bg-forest-100 text-gray-700 font-medium rounded-lg text-center border border-gray-200"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('researcher', 'research123')}
                className="px-2 py-1.5 bg-gray-100 hover:bg-forest-100 text-gray-700 font-medium rounded-lg text-center border border-gray-200"
              >
                Researcher
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('officer', 'officer123')}
                className="px-2 py-1.5 bg-gray-100 hover:bg-forest-100 text-gray-700 font-medium rounded-lg text-center border border-gray-200"
              >
                Officer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
