'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'green' | 'amber' | 'rose' | 'blue' | 'purple';
  trend?: string;
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'green',
  trend,
}: StatsCardProps) {
  const colorMap = {
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      iconBg: 'bg-emerald-600',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      iconBg: 'bg-amber-600',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      iconBg: 'bg-rose-600',
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-100',
      iconBg: 'bg-blue-600',
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-100',
      iconBg: 'bg-purple-600',
    },
  };

  const scheme = colorMap[color] || colorMap.green;

  return (
    <div className={`p-5 rounded-2xl bg-white border ${scheme.border} shadow-sm hover:shadow-md transition-shadow flex items-center justify-between`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value !== undefined ? value : '—'}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        {trend && (
          <span className="inline-block text-xs font-medium text-emerald-600">
            {trend}
          </span>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl ${scheme.iconBg} flex items-center justify-center text-white shadow-md`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
