import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Profile } from '../types';
import { Alert } from 'react-native';
import { fetchProfile, patchNotificationSettings, patchProfile } from '../api/profile';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  /** null until fetched (or when logged out). */
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: { name?: string; email?: string }) => Promise<void>;
  /** Saves notification choices; the switch flips at once and flips back if the server refuses. */
  updateNotificationPrefs: (patch: { orderUpdates?: boolean; promotions?: boolean }) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      setProfile(await fetchProfile());
    } catch {
      // Keep whatever we have; the next refresh (or screen focus) retries.
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    refreshProfile();
  }, [user?.id, refreshProfile]);

  const updateProfile = useCallback(async (patch: { name?: string; email?: string }) => {
    setProfile(await patchProfile(patch));
  }, []);

  const updateNotificationPrefs = useCallback(async (patch: { orderUpdates?: boolean; promotions?: boolean }) => {
    let previous: Profile | null = null;
    setProfile((p) => {
      previous = p;
      return p ? { ...p, notificationPrefs: { ...p.notificationPrefs, ...patch } } : p;
    });
    try {
      const saved = await patchNotificationSettings(patch);
      setProfile((p) => (p ? { ...p, notificationPrefs: saved } : p));
    } catch (e) {
      setProfile(previous);
      Alert.alert('Couldn’t save', e instanceof Error ? e.message : 'Please try again.');
    }
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile, updateProfile, updateNotificationPrefs }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}

export function initialsOf(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
