'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  DoorOpen,
  Camera,
  Boxes,
  History,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  Compass,
  User,
  Heart,
  X,
} from 'lucide-react';
import { useUserProfile } from '../lib/profile';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Rooms', href: '/rooms', icon: DoorOpen },
  { name: 'Scan Room', href: '/scan', icon: Camera },
  { name: 'Objects', href: '/objects', icon: Boxes },
  { name: 'Scan History', href: '/rooms/room-conf-3b', icon: History },
  { name: 'Movement Reports', href: '/reports', icon: FileSpreadsheet },
  { name: 'Profile & Settings', href: '/settings', icon: Settings },
  { name: 'Admin Diagnostics', href: '/admin', icon: ShieldCheck },
];

interface SidebarProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function Sidebar({ onClose, showCloseButton = false }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useUserProfile();

  return (
    <aside className="w-full h-full bg-slate-900 flex flex-col justify-between overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 sm:px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">RoomTrace</span>
              <span className="block text-[10px] text-sky-400 font-mono uppercase tracking-wider">Spatial 3D Engine</span>
            </div>
          </div>

          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="px-3 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Made by Hasim & System Status */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* User Card Shortcut */}
        <Link
          href="/settings"
          className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/60 transition-colors"
        >
          <div className={`w-7 h-7 rounded-full bg-gradient-to-tr ${profile.avatarBg || 'from-sky-500 to-indigo-600'} flex items-center justify-center text-white font-bold text-xs shadow-sm`}>
            {profile.name ? profile.name.charAt(0).toUpperCase() : 'H'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-slate-200 truncate">{profile.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{profile.role}</div>
          </div>
        </Link>

        {/* Made by Hasim Brand Footer */}
        <div className="bg-gradient-to-br from-sky-950/40 to-slate-950/80 rounded-lg p-3 border border-sky-900/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Project Architect</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Online
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-sky-300 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" /> Made by Hasim
            </span>
            <span className="text-[10px] text-slate-500 font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
