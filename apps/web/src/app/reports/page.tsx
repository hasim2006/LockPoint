'use client';

import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { MovementReportSummary } from '@roomtrace/types';

export default function ReportsPage() {
  const [summary, setSummary] = useState<MovementReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/rooms/room-conf-3b/reports/summary')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSummary(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        Generating spatial movement report...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Movement Audit Report</h1>
          <p className="text-sm text-slate-400 mt-1">
            Baseline vs Latest Scan comparison for {summary.roomName}.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting spatial report as CSV / JSON')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-slate-400">Total Tracked</span>
          <div className="text-2xl font-bold text-white mt-1">{summary.totalObjectsTracked}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-emerald-400">Stable Items</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary.stableCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-amber-400">Minor Shifts (&lt; 10cm)</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary.minorMovementCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-[10px] font-mono uppercase text-rose-400">Significant Relocations</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">{summary.significantMovementCount}</div>
        </div>
      </div>

      {/* Detailed Movement Breakdown Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <h2 className="text-sm font-semibold text-white">Physical Displacement Breakdown</h2>
          <span className="text-[11px] sm:text-xs text-slate-400 font-mono">ARCore Umeyama Alignment RMSE: 0.018 m</span>
        </div>

        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between sm:hidden">
          <span>Swipe horizontally to view displacement data</span>
          <span className="font-mono text-sky-400">↔</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item Name / ID</th>
                <th className="py-3 px-4">Original Position</th>
                <th className="py-3 px-4">Current Position</th>
                <th className="py-3 px-4">Displacement Vector</th>
                <th className="py-3 px-4">Confidence & Uncertainty</th>
                <th className="py-3 px-4">Audit Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {summary.events.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-sans font-semibold text-slate-100">
                    <div>{evt.objectName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{evt.persistentId}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    ({evt.baselinePosition.x.toFixed(2)}, {evt.baselinePosition.y.toFixed(2)},{' '}
                    {evt.baselinePosition.z.toFixed(2)}) m
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    ({evt.currentPosition.x.toFixed(2)}, {evt.currentPosition.y.toFixed(2)},{' '}
                    {evt.currentPosition.z.toFixed(2)}) m
                  </td>
                  <td className="py-3 px-4 text-sky-400">
                    Δ: ({evt.displacementVector.x.toFixed(2)}, {evt.displacementVector.y.toFixed(2)},{' '}
                    {evt.displacementVector.z.toFixed(2)}) m
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <div>{evt.confidenceScore}%</div>
                    <div className="text-[10px] text-slate-400">±{Math.round(evt.uncertaintyRadiusMeters * 100)} cm</div>
                  </td>
                  <td className="py-3 px-4 font-sans">
                    <span className="font-semibold text-slate-100 block">{evt.formattedDisplacement}</span>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-mono mt-0.5 ${
                        evt.movementStatus === 'SIGNIFICANT_MOVEMENT'
                          ? 'bg-rose-500/10 text-rose-400'
                          : evt.movementStatus === 'MINOR_MOVEMENT'
                          ? 'bg-amber-500/10 text-amber-400'
                          : evt.movementStatus === 'ROTATED_ONLY'
                          ? 'bg-sky-500/10 text-sky-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {evt.movementStatus.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
