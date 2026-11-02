'use client';

import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export default function Badge({ status, className = '' }: BadgeProps) {
  const getBadgeStyle = (val: string) => {
    const s = (val || '').toLowerCase().trim();
    if (s.includes('critically') || s.includes('critical') || s.includes('poaching') || s.includes('high')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (s.includes('endangered') || s.includes('injured') || s.includes('sick') || s.includes('open')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (s.includes('vulnerable') || s.includes('under investigation') || s.includes('medium') || s.includes('pending') || s.includes('planning')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (s.includes('healthy') || s.includes('least concern') || s.includes('active') || s.includes('resolved') || s.includes('completed') || s.includes('low')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (s.includes('recovering') || s.includes('ongoing')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
        status
      )} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-70" />
      {status || 'Unknown'}
    </span>
  );
}
