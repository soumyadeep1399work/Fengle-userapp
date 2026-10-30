import { Address, Category, Item, Profile } from '../types';

// Backend rows use snake_case, numeric ids, and DECIMAL columns that arrive as
// strings — everything is converted here so screens only see app-shaped data.

export interface ApiAddress {
  id: number;
  label: string;
  address_line: string;
  lat: string | number;
  lng: string | number;
  is_default: boolean | number;
}

export interface ApiProfile {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  photo_url: string | null;
  veg_only: boolean;
  wallet_balance: number | string;
  notification_prefs?: { order_updates?: boolean; promotions?: boolean } | null;
  agreementRequired?: boolean;
}

// The backend stores one address line; Home shows a compact locality, so take
// the first two parts after a leading house/flat number.
function deriveArea(line: string): string {
  const parts = line.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 2) return parts.join(', ') || line;
  const start = /\d/.test(parts[0]) ? 1 : 0;
  return parts.slice(start, start + 2).join(', ');
}

export function mapAddress(a: ApiAddress): Address {
  return {
    id: String(a.id),
    label: a.label,
    area: deriveArea(a.address_line),
    detail: a.address_line,
    isDefault: Boolean(a.is_default),
    lat: Number(a.lat),
    lng: Number(a.lng),
  };
}

export interface ApiCategory {
  id: number;
  name: string;
  blurb: string | null;
  image_url: string | null;
  prepTimeMinMinutes: number | null;
  prepTimeMaxMinutes: number | null;
  minOrder: number | string;
  clubPartnerIds?: number[];
}

export interface ApiItem {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: number | string;
  /** Discounted price, only while an offer is in force right now (the server does the clock logic). */
  offer_price?: number | string | null;
  offer_ends_at?: string | null;
  /** What is charged right now: offer_price when in force, else price. */
  effective_price?: number | string | null;
  image_url: string | null;
  /** Server-built label such as "3 pc" / "500 gm"; the raw fields below are the fallback. */
  portion_label?: string | null;
  quantity_value?: number | string | null;
  quantity_unit?: string | null;
  is_veg: boolean | number;
  avgRating: number | null;
  ratingCount: number;
}

// "35–45 min", "30 min", or '' when the backend has no prep time for the category.
function formatPrep(min: number | null, max: number | null): string {
  if (min && max) return min === max ? `${min} min` : `${min}–${max} min`;
  const one = min ?? max;
  return one ? `${one} min` : '';
}

export function mapCategory(c: ApiCategory): Category {
  return {
    id: String(c.id),
    name: c.name,
    blurb: c.blurb ?? '',
    prep: formatPrep(c.prepTimeMinMinutes, c.prepTimeMaxMinutes),
    min: Number(c.minOrder),
    img: c.image_url,
    clubPartnerIds: (c.clubPartnerIds ?? []).map(String),
  };
}

/** "3 pc", "500 gm", or null when the dish has no quantity set. */
export function portionLabel(i: { portion_label?: string | null; quantity_value?: number | string | null; quantity_unit?: string | null }): string | null {
  if (i.portion_label && i.portion_label.trim()) return i.portion_label.trim();
  const value = Number(i.quantity_value);
  if (i.quantity_value == null || !Number.isFinite(value) || value <= 0 || !i.quantity_unit) return null;
  return `${value} ${i.quantity_unit}`;
}

export function mapItem(i: ApiItem): Item {
  const price = Number(i.price);
  const offerPrice = i.offer_price == null ? null : Number(i.offer_price);
  return {
    id: String(i.id),
    categoryId: String(i.category_id),
    name: i.name,
    price,
    offerPrice,
    offerEndsAt: offerPrice == null ? null : i.offer_ends_at ?? null,
    effectivePrice: i.effective_price != null ? Number(i.effective_price) : offerPrice ?? price,
    veg: Boolean(i.is_veg),
    desc: i.description ?? '',
    imageUrl: i.image_url,
    portion: portionLabel(i),
    avgRating: i.avgRating == null ? null : Number(i.avgRating),
    ratingCount: Number(i.ratingCount ?? 0),
  };
}

export function mapProfile(p: ApiProfile): Profile {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    photoUrl: p.photo_url,
    vegOnly: Boolean(p.veg_only),
    walletBalance: Number(p.wallet_balance),
    notificationPrefs: {
      orderUpdates: p.notification_prefs?.order_updates ?? true,
      promotions: p.notification_prefs?.promotions ?? true,
    },
    agreementRequired: Boolean(p.agreementRequired),
  };
}
