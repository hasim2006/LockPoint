'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DoorOpen, Plus, Search, Layers, Calendar, ChevronRight, Check } from 'lucide-react';
import { Room } from '@roomtrace/types';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newFloor, setNewFloor] = useState('2nd Floor');
  const [newBuilding, setNewBuilding] = useState('Building A');

  useEffect(() => {
    fetch('/api/v1/rooms')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setRooms(res.data);
      });
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;

    const res = await fetch('/api/v1/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoomName,
        floor: newFloor,
        building: newBuilding,
      }),
    }).then((r) => r.json());

    if (res.success) {
      setRooms([...rooms, res.data]);
      setShowModal(false);
      setNewRoomName('');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Monitored Rooms</h1>
          <p className="text-sm text-slate-400 mt-1">
            Physical environments configured for spatial mapping, tracking, and rescan alignment.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 transition-colors shadow-lg shadow-sky-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Room
        </button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                  <DoorOpen className="w-5 h-5" />
                </div>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300">
                  {room.objectCount} objects
                </span>
              </div>

              <h2 className="text-base font-semibold text-white mt-4">{room.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                {room.floor} • {room.building}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Dimensions</span>
                  <span className="text-slate-300">
                    {room.dimensions
                      ? `${room.dimensions.width}m × ${room.dimensions.depth}m`
                      : 'Not recorded'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Baseline</span>
                  <span className="text-emerald-400">
                    {room.baselineScanId ? 'Registered' : 'Scan needed'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
              <Link
                href={`/rooms/${room.id}`}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1"
              >
                Inspect 3D Room <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/scan?roomId=${room.id}`}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Rescan Room
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Room Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h2 className="text-lg font-bold text-white">Create New Monitored Room</h2>
            <form onSubmit={handleCreateRoom} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Room Name</label>
                <input
                  type="text"
                  required
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="e.g. Research Lab 102"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Floor</label>
                  <input
                    type="text"
                    value={newFloor}
                    onChange={(e) => setNewFloor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Building</label>
                  <input
                    type="text"
                    value={newBuilding}
                    onChange={(e) => setNewBuilding(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
