'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  DoorOpen,
  Camera,
  Calendar,
  Layers,
  ArrowLeft,
  Activity,
  Boxes,
  CheckCircle2,
  Clock,
  Compass,
} from 'lucide-react';
import { Room, RoomScan, TrackedObject, MovementEvent } from '@roomtrace/types';
import { SpatialCanvas } from '../../../components/spatial-canvas';

interface RoomDetailProps {
  params: Promise<{ id: string }>;
}

export default function RoomDetailPage({ params }: RoomDetailProps) {
  const resolvedParams = use(params);
  const roomId = resolvedParams.id;

  const [room, setRoom] = useState<Room | null>(null);
  const [scans, setScans] = useState<RoomScan[]>([]);
  const [objects, setObjects] = useState<TrackedObject[]>([]);
  const [movements, setMovements] = useState<MovementEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoom() {
      try {
        const [roomRes, mvtRes] = await Promise.all([
          fetch(`/api/v1/rooms/${roomId}`).then((r) => r.json()),
          fetch(`/api/v1/rooms/${roomId}/movements`).then((r) => r.json()),
        ]);

        if (roomRes.success) {
          setRoom(roomRes.data);
          setScans(roomRes.data.scans || []);
          setObjects(roomRes.data.objects || []);
        }
        if (mvtRes.success) {
          setMovements(mvtRes.data);
        }
      } catch (err) {
        console.error('Error fetching room:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRoom();
  }, [roomId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        Loading room spatial telemetry...
      </div>
    );
  }

  if (!room) {
    return (
      <div className="p-8 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Room not found</h2>
        <Link href="/rooms" className="text-sky-400 text-sm hover:underline">
          Return to rooms directory
        </Link>
      </div>
    );
  }

  const baselineScan = scans.find((s) => s.scanType === 'BASELINE') || scans[scans.length - 1];
  const latestScan = scans.find((s) => s.scanType === 'REPEAT') || scans[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/rooms"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Rooms
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2 sm:gap-3">
            <span>{room.name}</span>
            <span className="text-[10px] sm:text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {room.floor} • {room.building}
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/scan?roomId=${room.id}`}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-xs sm:text-sm font-medium transition-colors shadow-lg shadow-sky-500/20"
          >
            <Camera className="w-4 h-4" />
            <span>Rescan Room</span>
          </Link>
        </div>
      </div>

      {/* 3D Spatial Canvas Viewer */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs sm:text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Interactive 3D Spatial Room Reconstruction</span>
          </span>
          <span className="text-[10px] sm:text-xs font-mono text-slate-400">
            Tap objects to inspect • Drag / touch to rotate
          </span>
        </div>

        <SpatialCanvas
          objects={objects}
          movements={movements}
          roomDimensions={room.dimensions || { width: 6.5, height: 3.0, depth: 8.0 }}
        />
      </div>

      {/* Scan History & Movement Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Tracked Objects Inventory */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Tracked Objects in Room ({objects.length})</h2>
            <span className="text-xs text-slate-400 font-mono">Coordinate Unit: Meters (m)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Item / ID</th>
                  <th className="py-2.5 px-3">Baseline Position (X, Y, Z)</th>
                  <th className="py-2.5 px-3">Displacement</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {objects.map((obj) => {
                  const mvt = movements.find((m) => m.objectId === obj.id);
                  return (
                    <tr key={obj.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-100">{obj.userDefinedName}</div>
                        <div className="font-mono text-[11px] text-slate-400">{obj.persistentId}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {obj.baselinePosition.x.toFixed(2)}m, {obj.baselinePosition.y.toFixed(2)}m,{' '}
                        {obj.baselinePosition.z.toFixed(2)}m
                      </td>
                      <td className="py-3 px-3">
                        {mvt ? (
                          <div>
                            <span className="font-medium text-slate-200">{mvt.formattedDisplacement}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Conf: {mvt.confidenceScore}% (±{Math.round(mvt.uncertaintyRadiusMeters * 100)} cm)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Baseline established</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-medium font-mono ${
                            obj.lastMovementStatus === 'SIGNIFICANT_MOVEMENT'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : obj.lastMovementStatus === 'MINOR_MOVEMENT'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : obj.lastMovementStatus === 'ROTATED_ONLY'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {(obj.lastMovementStatus || 'STABLE').replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Scan Timeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h2 className="text-base font-semibold text-white">Scan Timeline</h2>

          <div className="space-y-3">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-300 font-semibold">{scan.scanType} SCAN</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono text-[10px]">
                    {scan.qualityLevel} ({scan.qualityScore}%)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-800/80">
                  <div>Features: {scan.featureCount}</div>
                  <div>Planes: {scan.planeCount}</div>
                  <div>Objects: {scan.detectedObjectCount}</div>
                  <div>RMSE: {scan.registrationRmseMeters ? `${scan.registrationRmseMeters.toFixed(3)}m` : '0.000m'}</div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(scan.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
