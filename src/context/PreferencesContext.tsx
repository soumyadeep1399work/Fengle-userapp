import React, { createContext, useCallback, useContext, useState } from 'react';

interface PreferencesContextValue {
  vegOnly: boolean;
  toggleVeg: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

// App-wide "Veg only" preference — set from Home, Category, or Search, and
// stays on everywhere else until the user turns it off again themselves.
export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [vegOnly, setVegOnly] = useState(false);
  const toggleVeg = useCallback(() => setVegOnly((v) => !v), []);
  return <PreferencesContext.Provider value={{ vegOnly, toggleVeg }}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}
