'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  DoorOpen,
  Camera,
  Boxes,
  Settings,
  Menu,
  Heart,
} from 'lucide-react';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';

const mobileBottomNav = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Rooms', href: '/rooms', icon: DoorOpen },
  { name: 'Scan', href: '/scan', icon: Camera, isPrimary: true },
  { name: 'Objects', href: '/objects', icon: Boxes },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row w-full overflow-x-hidden">
      {/* DESKTOP SIDEBAR (Static, visible on large screens) */}
      <div className="hidden lg:flex w-64 shrink-0 min-h-screen border-r border-slate-800 bg-slate-900 sticky top-0 h-screen overflow-y-auto">
        <Sidebar />
      </div>

      {/* MOBILE DRAWER BACKDROP & SLIDE-OVER (Visible on < lg screens when opened) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="relative w-72 max-w-[85vw] h-full bg-slate-900 shadow-2xl border-r border-slate-800 flex flex-col z-10 animate-in slide-in-from-left duration-300">
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} showCloseButton={true} />
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 w-full min-h-screen pb-16 lg:pb-0">
        {/* TOP NAVBAR */}
        <Navbar onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

        {/* PAGE CONTENT */}
        <main className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto w-full max-w-full">
          {children}
        </main>

        {/* DESKTOP & TABLET FOOTER */}
        <footer className="py-4 px-4 sm:px-6 border-t border-slate-900/80 bg-slate-950/60 text-[11px] sm:text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <span>RoomTrace Spatial Platform • Centimeter Precision Tracking</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>by</span>
            <span className="font-bold text-sky-400">Hasim</span>
          </div>
        </footer>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on smartphones/small screens) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 flex items-center justify-around px-2 py-1.5 safe-area-bottom shadow-lg">
        {mobileBottomNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center -mt-5"
                aria-label={item.name}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 border-2 border-slate-900 transition-transform active:scale-95">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-medium text-sky-400 mt-0.5">{item.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition-colors ${
                isActive ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold text-sky-400' : ''}`}>
                {item.name}
              </span>
            </Link>
          );
        })}

        {/* Hamburger Drawer Button in Bottom Bar */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="More options"
        >
          <Menu className="w-4 h-4" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </div>
  );
}
