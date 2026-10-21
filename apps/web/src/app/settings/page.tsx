'use client';

import React, { useState } from 'react';
import {
  User,
  Sliders,
  Save,
  Check,
  Building,
  Mail,
  Briefcase,
  Sparkles,
  Shield,
  Palette,
  Heart,
} from 'lucide-react';
import { DEFAULT_MOVEMENT_CONFIG } from '@roomtrace/config';
import { useUserProfile, UserProfile } from '../../lib/profile';

const AVATAR_GRADIENTS = [
  { label: 'Sky to Indigo', value: 'from-sky-500 to-indigo-600' },
  { label: 'Emerald to Teal', value: 'from-emerald-500 to-teal-600' },
  { label: 'Purple to Fuchsia', value: 'from-purple-500 to-fuchsia-600' },
  { label: 'Rose to Amber', value: 'from-rose-500 to-amber-600' },
  { label: 'Cyan to Blue', value: 'from-cyan-500 to-blue-600' },
];

export default function SettingsPage() {
  const { profile, updateProfile } = useUserProfile();
  const [activeTab, setActiveTab] = useState<'profile' | 'engine'>('profile');

  // Profile edit form state
  const [profileForm, setProfileForm] = useState<UserProfile>(profile);
  const [profileSaved, setProfileSaved] = useState(false);

  // Synchronize when profile loads
  React.useEffect(() => {
    setProfileForm(profile);
  }, [profile]);

  // Spatial engine config state
  const [engineConfig, setEngineConfig] = useState({
    noiseThresholdCm: DEFAULT_MOVEMENT_CONFIG.noiseThresholdMeters * 100, // 2 cm
    minorThresholdCm: DEFAULT_MOVEMENT_CONFIG.minorMovementThresholdMeters * 100, // 10 cm
    rotationThresholdDeg: DEFAULT_MOVEMENT_CONFIG.rotationThresholdDegrees, // 15 deg
    minTrackingConf: DEFAULT_MOVEMENT_CONFIG.minTrackingConfidence * 100, // 60%
    maxRmseCm: DEFAULT_MOVEMENT_CONFIG.maxRegistrationRmseMeters * 100, // 8 cm
  });
  const [engineSaved, setEngineSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(profileForm);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleSaveEngine = (e: React.FormEvent) => {
    e.preventDefault();
    setEngineSaved(true);
    setTimeout(() => setEngineSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex flex-wrap items-center gap-2">
            Profile & Engine Settings
            <span className="text-[10px] sm:text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Made by Hasim
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your user profile details, credentials, and customize spatial measurement thresholds.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('engine')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'engine'
                ? 'bg-sky-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Engine</span>
          </button>
        </div>
      </div>

      {/* TAB 1: USER PROFILE EDIT */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Profile Edit Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSaveProfile}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-semibold text-white">Edit Profile Details</h2>
                  <p className="text-xs text-slate-400">This information will be displayed across reports and scans.</p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-sky-500/10 text-sky-400 text-xs font-medium">
                  <Sparkles className="w-3 h-3" />
                  <span>Verified User</span>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        placeholder="e.g. Hasim"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        placeholder="hasim@roomtrace.io"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Role / Position
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileForm.role}
                        onChange={(e) => setProfileForm({ ...profileForm, role: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        placeholder="Creator & Spatial Lead"
                      />
                    </div>
                  </div>

                  {/* Organization */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Organization
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={profileForm.organization}
                        onChange={(e) => setProfileForm({ ...profileForm, organization: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                        placeholder="Hasim Spatial Labs"
                      />
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Bio / Description
                  </label>
                  <textarea
                    rows={3}
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    placeholder="Short description of your role or work in spatial scanning..."
                  />
                </div>

                {/* Avatar Color Theme */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-sky-400" />
                    Avatar Color Theme
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {AVATAR_GRADIENTS.map((grad) => (
                      <button
                        key={grad.value}
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, avatarBg: grad.value })}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${
                          profileForm.avatarBg === grad.value
                            ? 'border-sky-500 bg-sky-500/15 text-sky-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${grad.value}`}></span>
                        <span>{grad.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Units */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Preferred Coordinate Units
                  </label>
                  <div className="grid grid-cols-2 gap-3 max-w-xs">
                    <button
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, measurementUnits: 'metric' })}
                      className={`p-2.5 rounded-lg border text-xs text-center font-mono transition-colors ${
                        profileForm.measurementUnits === 'metric'
                          ? 'border-sky-500 bg-sky-500/15 text-sky-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      Metric (Meters / cm)
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileForm({ ...profileForm, measurementUnits: 'imperial' })}
                      className={`p-2.5 rounded-lg border text-xs text-center font-mono transition-colors ${
                        profileForm.measurementUnits === 'imperial'
                          ? 'border-sky-500 bg-sky-500/15 text-sky-300 font-semibold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      Imperial (Feet / in)
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div>
                  {profileSaved && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium animate-bounce">
                      <Check className="w-4 h-4" /> Profile updated and saved!
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition-colors shadow-lg shadow-sky-500/20"
                >
                  <Save className="w-3.5 h-3.5" /> Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live Profile Preview Card */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Live Profile Preview</h3>
              <div className="flex flex-col items-center text-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-tr ${profileForm.avatarBg || 'from-sky-500 to-indigo-600'} flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-sky-500/10 mb-3`}>
                  {profileForm.name ? profileForm.name.charAt(0).toUpperCase() : 'H'}
                </div>
                <div className="text-base font-bold text-white">{profileForm.name}</div>
                <div className="text-xs text-sky-400 font-medium">{profileForm.role}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{profileForm.organization}</div>
                <p className="text-xs text-slate-300 mt-3 border-t border-slate-800/80 pt-3 italic">
                  "{profileForm.bio || 'No bio entered yet'}"
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    ● Active Session
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20 text-[10px] font-mono">
                    {profileForm.measurementUnits}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gradient-to-r from-sky-950/40 via-indigo-950/40 to-slate-900 rounded-lg border border-sky-900/40 text-xs space-y-1">
                <div className="font-semibold text-sky-300 flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> Made by Hasim
                </div>
                <p className="text-slate-400 text-[11px]">
                  RoomTrace is designed and engineered by Hasim for centimeter-precision spatial tracking.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPATIAL ENGINE THRESHOLDS */}
      {activeTab === 'engine' && (
        <form onSubmit={handleSaveEngine} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 shadow-xl">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider text-slate-300 font-mono">
              Spatial Displacement & Tolerance Thresholds
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Sensor Noise / Jitter Threshold (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={engineConfig.noiseThresholdCm}
                  onChange={(e) => setEngineConfig({ ...engineConfig, noiseThresholdCm: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Displacements below this value are classified as STABLE.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Minor Movement Boundary (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={engineConfig.minorThresholdCm}
                  onChange={(e) => setEngineConfig({ ...engineConfig, minorThresholdCm: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Displacements above this value are marked SIGNIFICANT_MOVEMENT.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  In-Place Rotation Threshold (degrees)
                </label>
                <input
                  type="number"
                  value={engineConfig.rotationThresholdDeg}
                  onChange={(e) => setEngineConfig({ ...engineConfig, rotationThresholdDeg: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Minimum orientation change required to classify as ROTATED_ONLY.
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Max Allowed Alignment RMSE (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={engineConfig.maxRmseCm}
                  onChange={(e) => setEngineConfig({ ...engineConfig, maxRmseCm: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Higher residual errors flag the scan as UNCERTAIN_TRACKING.
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {engineSaved ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Engine thresholds saved!
              </span>
            ) : <span />}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-xs transition-colors shadow-lg shadow-sky-500/20"
            >
              <Save className="w-3.5 h-3.5" /> Save Configuration
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
