'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import {
  LayoutDashboard,
  Bug,
  PawPrint,
  TreePine,
  Users2,
  FileSpreadsheet,
  Binoculars,
  AlertTriangle,
  Siren,
  Stethoscope,
  FolderKanban,
  HeartHandshake,
  BarChart3,
  SearchCode,
  ShieldCheck,
  LogOut,
  UserCheck
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  roles?: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const navItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Species', href: '/species', icon: Bug },
    { name: 'Animals', href: '/animals', icon: PawPrint },
    { name: 'Protected Areas', href: '/protected-areas', icon: TreePine },
    { name: 'Researchers', href: '/researchers', icon: Users2 },
    { name: 'Research Projects', href: '/research', icon: FileSpreadsheet },
    { name: 'Sightings', href: '/sightings', icon: Binoculars },
    { name: 'Threats', href: '/threats', icon: AlertTriangle },
    { name: 'Incidents', href: '/incidents', icon: Siren },
    { name: 'Veterinary Records', href: '/veterinary', icon: Stethoscope },
    { name: 'Conservation Projects', href: '/projects', icon: FolderKanban },
    { name: 'Volunteers', href: '/volunteers', icon: HeartHandshake },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    { name: 'Knowledge Search', href: '/knowledge-search', icon: SearchCode },
    { name: 'User Management', href: '/users', icon: ShieldCheck, roles: ['Admin'] },
  ];

  if (pathname === '/login') return null;

  return (
    <aside className="w-64 bg-forest-900 text-forest-100 flex flex-col h-screen fixed left-0 top-0 border-r border-forest-800 z-30 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-forest-800 flex items-center space-x-3 bg-forest-950/60">
        <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-accent-mint shadow-md">
          <PawPrint className="w-6 h-6 text-green-300" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-wide">WildTrack</h1>
          <p className="text-xs text-green-400 font-medium tracking-wider uppercase">PESU Conservation</p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        {navItems.map((item) => {
          if (item.roles && !item.roles.some((r) => hasRole(r))) {
            return null;
          }
          const isActive = pathname === item.href;
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-forest-700 text-white shadow-sm border-l-4 border-green-400 font-semibold'
                  : 'text-forest-200 hover:bg-forest-800 hover:text-white'
              }`}
            >
              <IconComponent className={`w-4 h-4 ${isActive ? 'text-green-300' : 'text-forest-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-4 border-t border-forest-800 bg-forest-950/50">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-forest-700 flex items-center justify-center text-xs font-bold text-white border border-forest-500">
                {user.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-forest-800 text-green-300 rounded border border-forest-700">
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-forest-300 hover:text-red-400 rounded-lg hover:bg-forest-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center space-x-2 w-full py-2 px-3 bg-forest-700 hover:bg-forest-600 text-white text-xs font-medium rounded-lg transition-colors shadow"
          >
            <UserCheck className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
