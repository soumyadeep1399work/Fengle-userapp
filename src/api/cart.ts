import { CategoryId } from '../types';
import { Coords } from '../utils/location';
import { apiFetch } from './client';

export interface CartQuote {
  /** True when the cart can be ordered as-is (one kitchen can serve it AND the minimum is met). */
  valid: boolean;
  minOrderOk: boolean;
  categoryIds: CategoryId[];
  /** False = no single nearby kitchen can serve the whole cart (the Lock case). */
  clubbable: boolean;
  isClubbed: boolean;
  itemTotal: number;
  /** The price fields below are only meaningful when `clubbable` is true. */
  deliveryFee: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
  reason: string | null;
  /** Amount knocked off grandTotal by the applied coupon; 0 when none is applied. */
  couponDiscount: number;
  /** Why the requested coupon didn't apply (expired, minimum not met, not eligible); null when it applied fine or none was requested. */
  couponError: string | null;
}

interface ApiQuote {
  valid: boolean;
  minOrderOk: boolean;
  categoryIds: number[];
  clubbable: boolean;
  isClubbed?: boolean;
  itemTotal: number | string;
  deliveryFee?: number | string;
  cgstAmount?: number | string;
  sgstAmount?: number | string;
  grandTotal?: number | string;
  reason: string | null;
  couponDiscount?: number | string;
  couponError?: string | null;
}

/** Item ids that aren't real backend ids (the legacy demo catalog) can't be priced. */
export function isQuotable(items: Record<string, number>): boolean {
  return Object.keys(items).every((id) => /^\d+$/.test(id));
}

export async function quoteCart(items: Record<string, number>, coords: Coords, couponCode?: string | null): Promise<CartQuote> {
  const q = await apiFetch<ApiQuote>('/cart/quote', {
    method: 'POST',
    body: {
      items: Object.entries(items).map(([id, quantity]) => ({ item_id: Number(id), quantity })),
      delivery_lat: coords.lat,
      delivery_lng: coords.lng,
      ...(couponCode ? { coupon_code: couponCode } : {}),
    },
  });
  return {
    valid: Boolean(q.valid),
    minOrderOk: Boolean(q.minOrderOk),
    categoryIds: (q.categoryIds ?? []).map(String),
    clubbable: Boolean(q.clubbable),
    isClubbed: Boolean(q.isClubbed),
    itemTotal: Number(q.itemTotal ?? 0),
    deliveryFee: Number(q.deliveryFee ?? 0),
    cgst: Number(q.cgstAmount ?? 0),
    sgst: Number(q.sgstAmount ?? 0),
    grandTotal: Number(q.grandTotal ?? 0),
    reason: q.reason ?? null,
    couponDiscount: Number(q.couponDiscount ?? 0),
    couponError: q.couponError ?? null,
  };
}
