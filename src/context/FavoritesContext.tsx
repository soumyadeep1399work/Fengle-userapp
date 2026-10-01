import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Item } from '../types';
import { addFavoriteRequest, fetchFavorites, removeFavoriteRequest } from '../api/favorites';
import { registerItems } from '../data/catalogStore';
import { useAuth } from './AuthContext';

type FavoritesStatus = 'idle' | 'loading' | 'ready' | 'error';

interface FavoritesContextValue {
  /** The favourite dishes, newest hearted first. */
  favorites: Item[];
  status: FavoritesStatus;
  isFavorite: (itemId: string) => boolean;
  /** Hearts or un-hearts a dish; the heart flips at once and flips back if the server refuses. */
  toggleFavorite: (item: Item) => void;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [status, setStatus] = useState<FavoritesStatus>('idle');
  const favoritesRef = useRef<Item[]>([]);

  const commit = useCallback((next: Item[]) => {
    favoritesRef.current = next;
    setFavorites(next);
  }, []);

  const refreshFavorites = useCallback(async () => {
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const list = await fetchFavorites();
      registerItems(list); // so a favourite can be added to the cart from any screen
      commit(list);
      setStatus('ready');
    } catch {
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [commit]);

  // Load on login, clear on logout so hearts never carry over between accounts.
  useEffect(() => {
    if (!user) {
      commit([]);
      setStatus('idle');
      return;
    }
    refreshFavorites();
  }, [user?.id, commit, refreshFavorites]);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const isFavorite = useCallback((itemId: string) => favoriteIds.has(itemId), [favoriteIds]);

  const toggleFavorite = useCallback(
    (item: Item) => {
      const before = favoritesRef.current;
      const adding = !before.some((f) => f.id === item.id);
      commit(adding ? [item, ...before] : before.filter((f) => f.id !== item.id));
      registerItems([item]);
      (adding ? addFavoriteRequest(item.id) : removeFavoriteRequest(item.id)).catch((e) => {
        commit(before);
        Alert.alert('Couldn’t update favourites', e instanceof Error ? e.message : 'Please try again.');
      });
    },
    [commit]
  );

  return (
    <FavoritesContext.Provider value={{ favorites, status, isFavorite, toggleFavorite, refreshFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within a FavoritesProvider');
  return ctx;
}
