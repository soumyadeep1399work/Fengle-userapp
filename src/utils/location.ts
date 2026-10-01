import * as Location from 'expo-location';

export interface Coords {
  lat: number;
  lng: number;
}

/** Current GPS position. With `silent`, never prompts for permission. Throws a user-readable Error. */
export async function getCurrentCoords(opts?: { silent?: boolean }): Promise<Coords> {
  let perm = await Location.getForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    if (opts?.silent) throw new Error('Location permission not granted');
    perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') {
      throw new Error('Location permission is off. Allow it in your phone settings, or type your address instead.');
    }
  }
  try {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    throw new Error('Couldn’t get your location. Turn on location services, or type your address instead.');
  }
}

/** Best-effort street address for a point; '' if it can't be resolved. */
export async function reverseGeocode(coords: Coords): Promise<string> {
  try {
    const [p] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
    if (!p) return '';
    const parts = [p.name, p.street, p.district ?? p.subregion, p.city, p.postalCode].filter(
      (s): s is string => !!s
    );
    return Array.from(new Set(parts)).join(', ');
  } catch {
    return '';
  }
}

export async function getCurrentPlace(): Promise<{ coords: Coords; address: string }> {
  const coords = await getCurrentCoords();
  return { coords, address: await reverseGeocode(coords) };
}

/** Turns typed address text into coordinates, or null if it can't be located. */
export async function geocodeAddress(address: string): Promise<Coords | null> {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length > 0) return { lat: results[0].latitude, lng: results[0].longitude };
  } catch {
    // fall through
  }
  return null;
}
