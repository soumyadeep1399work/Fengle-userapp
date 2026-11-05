import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from './client';

export interface OnboardingSlide {
  id: string;
  imageUrl: string;
  headline: string;
  body: string;
}

interface ApiSlide {
  id: number | string;
  image_url: string | null;
  headline: string | null;
  body: string | null;
}

const CACHE_KEY = 'onboarding_slides_v1';
const MAX_SLIDES = 5;

/** The intro screens the admin has set up. Public: it is shown before anyone is logged in. */
export async function fetchOnboardingSlides(): Promise<OnboardingSlide[]> {
  const { slides } = await apiFetch<{ slides: ApiSlide[] }>('/onboarding-slides', { auth: false, timeoutMs: 2500 });
  return (slides ?? [])
    .filter((s) => !!s.image_url && !!s.headline)
    .slice(0, MAX_SLIDES)
    .map((s) => ({ id: String(s.id), imageUrl: s.image_url as string, headline: s.headline as string, body: s.body ?? '' }));
}

export async function loadCachedOnboardingSlides(): Promise<OnboardingSlide[] | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as OnboardingSlide[]) : null;
    return parsed && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export async function cacheOnboardingSlides(slides: OnboardingSlide[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(slides));
  } catch {
    // The cache is only a speed-up.
  }
}
