'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/services/api';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500 font-medium">Loading WildTrack Platform...</p>
      </div>
    </div>
  );
}
