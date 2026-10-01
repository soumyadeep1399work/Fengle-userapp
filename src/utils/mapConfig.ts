// OpenStreetMap's public tile server is fine for development and light use, but
// its usage policy doesn't allow heavy commercial traffic. Before launch, point
// these at a hosted OSM provider (MapTiler, Stadia, ...) or self-hosted tiles
// via EXPO_PUBLIC_MAP_TILE_URL / EXPO_PUBLIC_MAP_ATTRIBUTION — no code change needed.
export const MAP_TILE_URL = process.env.EXPO_PUBLIC_MAP_TILE_URL ?? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export const MAP_ATTRIBUTION =
  process.env.EXPO_PUBLIC_MAP_ATTRIBUTION ??
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
