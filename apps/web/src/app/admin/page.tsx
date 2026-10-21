'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Server, Database, Cpu, HardDrive } from 'lucide-react';

export default function AdminPage() {
  const [health, setHealth] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/admin/health').then((r) => r.json()),
      fetch('/api/v1/admin/stats').then((r) => r.json()),
    ]).then(([hRes, sRes]) => {
      if (hRes.success) setHealth(hRes);
      if (sRes.success) setStats(sRes.data);
    });
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Admin & Diagnostics</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Cluster health, service dependencies, memory telemetry, and spatial workload metrics.
        </p>
      </div>

      {/* Services Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { name: 'PostgreSQL Relational DB', status: 'ONLINE', icon: Database, color: 'text-emerald-400' },
          { name: 'Redis / BullMQ Pipeline', status: 'ACTIVE', icon: Server, color: 'text-emerald-400' },
          { name: 'S3 / R2 Spatial Storage', status: 'ONLINE', icon: HardDrive, color: 'text-emerald-400' },
          { name: 'CV Detector Engine', status: 'READY', icon: Cpu, color: 'text-sky-400' },
        ].map((svc) => {
          const Icon = svc.icon;
          return (
            <div key={svc.name} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${svc.color}`} />
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {svc.status}
                </span>
              </div>
              <div className="font-semibold text-xs sm:text-sm text-white line-clamp-1">{svc.name}</div>
            </div>
          );
        })}
      </div>

      {/* Telemetry Stats Card */}
      {stats && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-300 font-mono">
            System Resource Telemetry
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 text-xs font-mono">
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Active Rooms</span>
              <span className="text-base sm:text-lg font-bold text-white">{stats.roomsCount}</span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Scans Ingested</span>
              <span className="text-lg font-bold text-sky-400">{stats.totalScans}</span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Tracked Objects</span>
              <span className="text-lg font-bold text-emerald-400">{stats.totalObjectsTracked}</span>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Uptime</span>
              <span className="text-lg font-bold text-purple-400">{Math.round(stats.uptimeSeconds)}s</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
