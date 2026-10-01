import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Category, Item } from '../types';
import { CategoryDetail, fetchCategories, fetchCategoryDetail, fetchPopularItems, searchItemsRequest } from '../api/catalog';
import { registerItems, setCategories, upsertCategory } from '../data/catalogStore';
import { Coords } from '../utils/location';
import { useAddresses } from './AddressContext';

export interface PopularPick {
  item: Item;
  categoryName: string;
}

interface CatalogContextValue {
  categories: Category[];
  categoriesStatus: 'loading' | 'ready' | 'error';
  reloadCategories: () => Promise<void>;
  /** Coordinates of the selected delivery address; null until the user has one. */
  location: Coords | null;
  /** Items + sections for one category, filtered to kitchens that reach the delivery address. */
  fetchCategory: (id: string) => Promise<CategoryDetail>;
  search: (query: string, veg: boolean) => Promise<Item[]>;
  popularPicks: PopularPick[];
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

const POPULAR_MAX = 6;

/**
 * Thrown when a location-based read is attempted without a delivery location.
 * The kind matters: "loading" should just wait, "failed" means the saved
 * address couldn't be fetched (retry), "none" means the user has no address.
 */
export class LocationError extends Error {
  kind: 'loading' | 'failed' | 'none';
  constructor(kind: 'loading' | 'failed' | 'none') {
    super(
      kind === 'none'
        ? 'Add a delivery address to see what’s cooking near you.'
        : kind === 'failed'
          ? 'Couldn’t load your delivery address. Check your connection and try again.'
          : 'Loading your delivery address…'
    );
    this.name = 'LocationError';
    this.kind = kind;
  }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { selectedAddress, loaded, loadFailed } = useAddresses();
  const [categories, setCategoryList] = useState<Category[]>([]);
  const [categoriesStatus, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [popularPicks, setPopularPicks] = useState<PopularPick[]>([]);

  const location = useMemo<Coords | null>(
    () => (selectedAddress ? { lat: selectedAddress.lat, lng: selectedAddress.lng } : null),
    [selectedAddress?.lat, selectedAddress?.lng]
  );

  // With a delivery location the list only holds categories that can actually
  // be ordered near it; `reloadCategories` changes when the location does.
  const reloadCategories = useCallback(async () => {
    setStatus('loading');
    try {
      const list = await fetchCategories(location);
      setCategories(list);
      setCategoryList(list);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [location]);

  // Wait until the saved address has been resolved (loaded, missing, or failed)
  // so the tiles don't appear unfiltered and then shrink once it arrives.
  const addressResolved = !!location || loaded || loadFailed;
  useEffect(() => {
    if (addressResolved) reloadCategories();
  }, [addressResolved, reloadCategories]);

  // Keep trying quietly if the menu couldn't be loaded (backend down at start).
  useEffect(() => {
    if (categoriesStatus !== 'error') return;
    const timer = setInterval(reloadCategories, 5000);
    return () => clearInterval(timer);
  }, [categoriesStatus, reloadCategories]);

  const locationError = (): LocationError => new LocationError(loadFailed ? 'failed' : !loaded ? 'loading' : 'none');

  const fetchCategory = useCallback(
    async (id: string): Promise<CategoryDetail> => {
      if (!location) throw locationError();
      const detail = await fetchCategoryDetail(id, location);
      registerItems(detail.sections.flatMap((s) => s.items));
      upsertCategory(detail.category);
      return detail;
    },
    [location, loaded, loadFailed]
  );

  const search = useCallback(
    async (query: string, veg: boolean): Promise<Item[]> => {
      if (!location) throw locationError();
      const found = await searchItemsRequest(query, veg, location);
      registerItems(found);
      return found;
    },
    [location, loaded, loadFailed]
  );

  // Home's "Popular picks": one location-filtered call; items only carry a
  // category id, so the name comes from the categories list.
  useEffect(() => {
    if (!location || categories.length === 0) {
      setPopularPicks([]);
      return;
    }
    let cancelled = false;
    fetchPopularItems(location, POPULAR_MAX)
      .then((found) => {
        if (cancelled) return;
        registerItems(found);
        const names = new Map(categories.map((c) => [c.id, c.name]));
        setPopularPicks(found.map((item) => ({ item, categoryName: names.get(item.categoryId) ?? '' })));
      })
      .catch(() => {
        if (!cancelled) setPopularPicks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [categories, location]);

  const value: CatalogContextValue = {
    categories, categoriesStatus, reloadCategories, location, fetchCategory, search, popularPicks,
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within a CatalogProvider');
  return ctx;
}
