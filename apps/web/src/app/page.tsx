'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  DoorOpen,
  Camera,
  Boxes,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  MoveRight,
} from 'lucide-react';
import { Room, RoomScan, MovementEvent } from '@roomtrace/types';

export default function DashboardPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [recentMovements, setRecentMovements] = useState<MovementEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [roomsRes, mvtRes] = await Promise.all([
          fetch('/api/v1/rooms').then((r) => r.json()),
          fetch('/api/v1/rooms/room-conf-3b/movements').then((r) => r.json()),
        ]);

        if (roomsRes.success) setRooms(roomsRes.data);
        if (mvtRes.success) setRecentMovements(mvtRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalTracked = rooms.reduce((acc, r) => acc + (r.objectCount || 0), 0);
  const movedCount = recentMovements.filter(
    (m) => m.movementStatus === 'SIGNIFICANT_MOVEMENT' || m.movementStatus === 'MINOR_MOVEMENT'
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
            Spatial Room Overview
            <span className="text-[10px] sm:text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              System Ready
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centimeter-accurate physical object tracking and displacement analysis via AR spatial mapping.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/scan"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-sky-500 text-white font-medium text-xs sm:text-sm hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
          >
            <Camera className="w-4 h-4" />
            <span>New Scan</span>
          </Link>
          <Link
            href="/rooms"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-slate-800 text-slate-200 font-medium text-xs sm:text-sm hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <span>Rooms</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Active Rooms</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <DoorOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 sm:mt-3">{rooms.length}</div>
          <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Managed spatial zones</div>
        </div>

        {/* Card 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Objects Tracked</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white mt-2 sm:mt-3">{totalTracked}</div>
          <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Persistent 3D identities</div>
        </div>

        {/* Card 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Relocations</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-rose-400 mt-2 sm:mt-3">{movedCount}</div>
          <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Displaced objects</div>
        </div>

        {/* Card 4 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Registration</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-2 sm:mt-3">94%</div>
          <div className="text-[11px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">RMSE &lt; 0.018 m</div>
        </div>
      </div>

      {/* Main Content Grid: Rooms & Recent Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Monitored Rooms */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Configured Rooms</h2>
              <p className="text-xs text-slate-400">Baseline maps and latest comparison scans</p>
            </div>
            <Link href="/rooms" className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {rooms.map((room) => (
              <Link
                key={room.id}
                href={`/rooms/${room.id}`}
                className="block bg-slate-950/60 border border-slate-800 hover:border-sky-500/40 rounded-xl p-3.5 sm:p-4 transition-all hover:bg-slate-800/40"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                      <DoorOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-slate-100 truncate">{room.name}</h3>
                      <div className="text-xs text-slate-400 truncate">
                        {room.floor} • {room.building}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 text-left sm:text-right border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                    <div>
                      <div className="text-xs font-mono font-medium text-slate-200">{room.objectCount} objects</div>
                      <div className="text-[11px] text-slate-400">
                        {room.dimensions
                          ? `${room.dimensions.width}m × ${room.dimensions.depth}m`
                          : 'Geometry pending'}
                      </div>
                    </div>
                    <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      Active
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Movement Events Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Movement Activity</h2>
              <p className="text-xs text-slate-400">Real-time displacement logs</p>
            </div>
            <Link href="/reports" className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1">
              Full Report <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentMovements.slice(0, 5).map((mvt) => (
              <div
                key={mvt.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">{mvt.objectName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                      mvt.movementStatus === 'SIGNIFICANT_MOVEMENT'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : mvt.movementStatus === 'MINOR_MOVEMENT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : mvt.movementStatus === 'ROTATED_ONLY'
                        ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {mvt.movementStatus.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sky-400 font-medium">{mvt.formattedDisplacement}</div>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span>Confidence: {mvt.confidenceScore}%</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Recent Scan
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
