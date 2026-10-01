import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { patchVegOnly } from '../api/profile';
import { useProfile } from './ProfileContext';

interface PreferencesContextValue {
  vegOnly: boolean;
  toggleVeg: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

// App-wide "Veg only" preference — set from Home, Category, or Search, and
// stays on everywhere else until the user turns it off again themselves. It is
// also saved to the account, so it follows the user to a new phone.
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useProfile();
  const [vegOnly, setVegOnly] = useState(false);
  const vegRef = useRef(false);
  const syncedForUser = useRef<number | null>(null);

  // Adopt the saved choice once per login. Later profile refreshes must not
  // overwrite what the user has just toggled.
  useEffect(() => {
    if (!profile) {
      syncedForUser.current = null;
      vegRef.current = false;
      setVegOnly(false);
      return;
    }
    if (syncedForUser.current !== profile.id) {
      syncedForUser.current = profile.id;
      vegRef.current = profile.vegOnly;
      setVegOnly(profile.vegOnly);
    }
  }, [profile]);

  const toggleVeg = useCallback(() => {
    const previous = vegRef.current;
    const next = !previous;
    vegRef.current = next;
    setVegOnly(next);
    patchVegOnly(next).catch((e) => {
      vegRef.current = previous;
      setVegOnly(previous);
      Alert.alert('Couldn’t save your veg-only choice', e instanceof Error ? e.message : 'Please try again.');
    });
  }, []);

  return <PreferencesContext.Provider value={{ vegOnly, toggleVeg }}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}
