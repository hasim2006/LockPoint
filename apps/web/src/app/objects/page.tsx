'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, Boxes, Edit2, Check, X, ArrowUpRight } from 'lucide-react';
import { TrackedObject } from '@roomtrace/types';

export default function ObjectsPage() {
  const [objects, setObjects] = useState<TrackedObject[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetch('/api/v1/rooms/room-conf-3b/objects')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setObjects(res.data);
      });
  }, []);

  const handleStartEdit = (obj: TrackedObject) => {
    setEditingId(obj.id);
    setEditName(obj.userDefinedName);
  };

  const handleSaveEdit = async (id: string) => {
    const res = await fetch(`/api/v1/objects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userDefinedName: editName }),
    }).then((r) => r.json());

    if (res.success) {
      setObjects(objects.map((o) => (o.id === id ? { ...o, userDefinedName: editName } : o)));
      setEditingId(null);
    }
  };

  const filtered = objects.filter((o) => {
    const matchesSearch =
      o.userDefinedName.toLowerCase().includes(search.toLowerCase()) ||
      o.persistentId.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || o.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Tracked Objects Inventory</h1>
        <p className="text-sm text-slate-400 mt-1">
          Catalog of physical items with persistent identities across multi-temporal scans.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or persistent ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Categories</option>
            <option value="chair">Chairs</option>
            <option value="table">Tables</option>
            <option value="laptop">Laptops</option>
            <option value="box">Boxes</option>
            <option value="plant">Plants</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 flex items-center justify-between sm:hidden">
          <span>Swipe horizontally to view full table</span>
          <span className="font-mono text-sky-400">↔</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Item & Identifier</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Baseline Coordinates (X, Y, Z)</th>
                <th className="py-3 px-4">Approx Dimensions</th>
                <th className="py-3 px-4">Movement Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((obj) => (
                <tr key={obj.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    {editingId === obj.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-950 border border-sky-500 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(obj.id)}
                          className="p-1 hover:text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100">{obj.userDefinedName}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {obj.persistentId}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 capitalize">{obj.category}</td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    X: {obj.baselinePosition.x.toFixed(2)}m, Y: {obj.baselinePosition.y.toFixed(2)}m, Z:{' '}
                    {obj.baselinePosition.z.toFixed(2)}m
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {obj.baselineDimensions.width.toFixed(2)}m × {obj.baselineDimensions.height.toFixed(2)}m ×{' '}
                    {obj.baselineDimensions.depth.toFixed(2)}m
                  </td>
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleStartEdit(obj)}
                      className="p-1 text-slate-400 hover:text-slate-200"
                      title="Rename item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
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
