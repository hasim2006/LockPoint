'use client';

import { useState, useEffect } from 'react';

export interface UserProfile {
  name: string;
  email: string;
  role: string;
  organization: string;
  bio: string;
  avatarBg: string;
  measurementUnits: 'metric' | 'imperial';
}

export const DEFAULT_PROFILE: UserProfile = {
  name: 'Hasim',
  email: 'hasim@roomtrace.spatial',
  role: 'Creator & Lead Spatial Architect',
  organization: 'Hasim Spatial Labs',
  bio: 'Creator and engineer of RoomTrace 3D indoor tracking & ARCore movement engine.',
  avatarBg: 'from-sky-500 to-indigo-600',
  measurementUnits: 'metric',
};

const STORAGE_KEY = 'roomtrace_user_profile';
const EVENT_KEY = 'roomtrace_profile_update';

export function getStoredProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveStoredProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent(EVENT_KEY, { detail: profile }));
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    setProfile(getStoredProfile());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UserProfile>;
      if (customEvent.detail) {
        setProfile(customEvent.detail);
      } else {
        setProfile(getStoredProfile());
      }
    };

    window.addEventListener(EVENT_KEY, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(EVENT_KEY, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateProfile = (newProfile: UserProfile) => {
    saveStoredProfile(newProfile);
    setProfile(newProfile);
  };

  return { profile, updateProfile };
}
