import { Coords } from './location';

// Photon (OpenStreetMap search). The public instance is free but fair-use
// only; before launch point EXPO_PUBLIC_GEOCODE_URL at a self-hosted or hosted
// Photon-compatible service. Other search APIs return a different shape and
// would need a small adapter here.
const SEARCH_URL = process.env.EXPO_PUBLIC_GEOCODE_URL ?? 'https://photon.komoot.io/api/';

// Delivery only happens in India, so keep results inside it.
const INDIA_BBOX = '68.1,6.7,97.4,35.7';

export interface PlaceResult {
  id: string;
  title: string;
  subtitle: string;
  coords: Coords;
}

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    osm_id?: number;
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    postcode?: string;
  };
}

function unique(parts: (string | undefined)[]): string[] {
  return Array.from(new Set(parts.filter((s): s is string => !!s)));
}

export async function searchPlaces(query: string, near: Coords, signal?: AbortSignal): Promise<PlaceResult[]> {
  const params = [
    `q=${encodeURIComponent(query)}`,
    'limit=6',
    'lang=en',
    `lat=${near.lat}`,
    `lon=${near.lng}`,
    `bbox=${INDIA_BBOX}`,
  ].join('&');

  const res = await fetch(`${SEARCH_URL}?${params}`, { signal });
  if (!res.ok) throw new Error(`Place search failed (${res.status})`);
  const data = (await res.json()) as { features?: PhotonFeature[] };

  const results: PlaceResult[] = [];
  (data.features ?? []).forEach((f, i) => {
    const p = f.properties ?? {};
    const c = f.geometry?.coordinates;
    if (!c) return;
    const title = p.name ?? unique([[p.housenumber, p.street].filter(Boolean).join(' ')])[0];
    if (!title) return;
    results.push({
      id: `${p.osm_id ?? i}-${i}`,
      title,
      subtitle: unique([p.street !== title ? p.street : undefined, p.district, p.city, p.state, p.postcode]).join(', '),
      coords: { lat: c[1], lng: c[0] },
    });
  });
  return results;
}
