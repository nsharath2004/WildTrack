'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { Bell, Search, Activity, User, ShieldAlert } from 'lucide-react';

interface NavbarProps {
  title?: string;
  subtitle?: string;
}

export default function Navbar({ title, subtitle }: NavbarProps) {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/health');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setDbStatus(data.database === 'connected' ? 'connected' : 'disconnected');
        } else {
          if (isMounted) setDbStatus('disconnected');
        }
      } catch {
        if (isMounted) setDbStatus('disconnected');
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => { isMounted = false; clearInterval(interval); };
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div>
        <h2 className="text-xl font-bold text-gray-800 leading-tight">{title || 'WildTrack Management'}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-4">
        {/* Backend health pill */}
        <div className="flex items-center space-x-2 text-xs font-medium px-2.5 py-1 rounded-full border bg-gray-50">
          <span
            className={`w-2 h-2 rounded-full ${
              dbStatus === 'connected'
                ? 'bg-emerald-500 animate-pulse'
                : dbStatus === 'checking'
                ? 'bg-amber-400'
                : 'bg-rose-500'
            }`}
          />
          <span className="text-gray-600">
            {dbStatus === 'connected'
              ? 'MySQL 8.0 Connected'
              : dbStatus === 'checking'
              ? 'Connecting...'
              : 'Backend Offline'}
          </span>
        </div>

        {/* User Badge */}
        {user && (
          <div className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 bg-forest-50 border border-forest-200 text-forest-800 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
            <span>Role: {user.role}</span>
          </div>
        )}
      </div>
    </header>
  );
}
