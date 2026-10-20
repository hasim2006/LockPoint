'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search, Shield, User, Sparkles, Menu, Compass } from 'lucide-react';
import { useUserProfile } from '../lib/profile';

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const { profile } = useUserProfile();

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left section: Hamburger (Mobile) + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-md min-w-0 mr-2">
        {/* Mobile Hamburger Toggle Button */}
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Brand Icon (when sidebar is closed) */}
        <Link href="/" className="flex items-center gap-1.5 lg:hidden shrink-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-sm">
            <Compass className="w-4 h-4" />
          </div>
        </Link>

        {/* Search input with responsive placeholder */}
        <div className="relative w-full min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
          <input
            type="text"
            placeholder="Search rooms, objects..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Right section: Badges, Notifications, Avatar */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Creator Badge: Made by Hasim */}
        <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-gradient-to-r from-sky-500/15 via-indigo-500/15 to-purple-500/15 border border-sky-500/30 text-sky-300 text-[10px] sm:text-xs font-medium shadow-sm">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 animate-pulse shrink-0" />
          <span className="hidden xs:inline">Made by </span>
          <strong className="text-white font-semibold">Hasim</strong>
        </div>

        {/* Environment Badge (hidden on mobile, visible on tablet+) */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>PRO • {profile.measurementUnits === 'metric' ? 'Metric (m/cm)' : 'Imperial (ft/in)'}</span>
        </div>

        {/* Notifications */}
        <button
          aria-label="View notifications"
          className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 flex items-center justify-center transition-colors relative shrink-0"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-sky-400 absolute top-1.5 right-1.5"></span>
        </button>

        {/* User Profile Button linking to Settings */}
        <Link
          href="/settings"
          className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-800 hover:opacity-90 transition-opacity shrink-0"
          title="Edit User Profile"
        >
          <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${profile.avatarBg || 'from-sky-500 to-indigo-600'} flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0`}>
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'H'}
          </div>
          <div className="text-left hidden lg:block">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1 truncate max-w-[100px]">
              {profile.name}
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{profile.role}</div>
          </div>
        </Link>
      </div>
    </header>
  );
}
