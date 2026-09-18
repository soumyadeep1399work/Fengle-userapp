import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fengle.auth.phone';

interface AuthContextValue {
  isLoading: boolean;
  isLoggedIn: boolean;
  phone: string | null;
  login: (phone: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Persists "is this device already logged in" so the app can skip
// Splash/Onboarding/Phone/OTP on every relaunch, not just within one session.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => setPhone(stored))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (newPhone: string) => {
    await AsyncStorage.setItem(STORAGE_KEY, newPhone);
    setPhone(newPhone);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setPhone(null);
  }, []);

  const value: AuthContextValue = { isLoading, isLoggedIn: !!phone, phone, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
