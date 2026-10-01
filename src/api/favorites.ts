import { Item } from '../types';
import { apiFetch } from './client';
import { ApiItem, mapItem } from './mappers';

export async function fetchFavorites(): Promise<Item[]> {
  const { favorites } = await apiFetch<{ favorites: ApiItem[] }>('/favorites');
  return favorites.map(mapItem);
}

// Both calls are idempotent on the server: re-adding or re-removing is not an error.
export function addFavoriteRequest(itemId: string) {
  return apiFetch<unknown>(`/favorites/${itemId}`, { method: 'POST' });
}

export function removeFavoriteRequest(itemId: string) {
  return apiFetch<unknown>(`/favorites/${itemId}`, { method: 'DELETE' });
}
