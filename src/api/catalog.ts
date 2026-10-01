import { Category, CategorySection, Item } from '../types';
import { Coords } from '../utils/location';
import { apiFetch } from './client';
import { ApiCategory, ApiItem, mapCategory, mapItem } from './mappers';

/**
 * With coordinates the backend returns only categories that have a dish in
 * stock at a kitchen in range; without them it returns every active category.
 */
export async function fetchCategories(coords?: Coords | null): Promise<Category[]> {
  const { categories } = await apiFetch<{ categories: ApiCategory[] }>('/categories', {
    auth: false,
    query: coords ? { lat: coords.lat, lng: coords.lng } : undefined,
  });
  // The backend lists categories alphabetically; the design's order is the id
  // order (there's no sort field yet), so keep that on Home.
  return categories.map(mapCategory).sort((a, b) => Number(a.id) - Number(b.id));
}

export interface CategoryDetail {
  category: Category;
  sections: CategorySection[];
}

// Catalog reads are location-filtered on the server: only items a kitchen
// within range can actually deliver to `coords` come back.
export async function fetchCategoryDetail(id: string, coords: Coords): Promise<CategoryDetail> {
  const data = await apiFetch<{
    category: ApiCategory;
    sections: { title: string; items: ApiItem[] }[];
  }>(`/categories/${id}`, { auth: false, query: { lat: coords.lat, lng: coords.lng } });

  return {
    category: mapCategory(data.category),
    sections: data.sections
      .map((s) => ({ name: s.title, items: s.items.map(mapItem) }))
      .filter((s) => s.items.length > 0),
  };
}

export async function fetchPopularItems(coords: Coords, limit = 6): Promise<Item[]> {
  const { items } = await apiFetch<{ items: ApiItem[] }>('/items/popular', {
    auth: false,
    query: { lat: coords.lat, lng: coords.lng, limit },
  });
  return items.map(mapItem);
}

export async function searchItemsRequest(query: string, veg: boolean, coords: Coords): Promise<Item[]> {
  const { items } = await apiFetch<{ items: ApiItem[] }>('/items/search', {
    auth: false,
    query: { q: query, veg: veg ? 'true' : undefined, lat: coords.lat, lng: coords.lng },
  });
  return items.map(mapItem);
}
