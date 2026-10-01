import { Coupon } from '../types';
import { apiFetch } from './client';

interface ApiCoupon {
  id: number;
  code: string;
  title: string;
  description?: string | null;
  discount_type: 'flat' | 'percent';
  discount_value: number | string;
  max_discount_amount?: number | string | null;
  min_order_value?: number | string | null;
  valid_until?: string | null;
  already_used?: boolean;
}

function mapCoupon(c: ApiCoupon): Coupon {
  return {
    id: String(c.id),
    code: c.code,
    title: c.title,
    description: c.description ?? '',
    discountType: c.discount_type,
    discountValue: Number(c.discount_value),
    maxDiscountAmount: c.max_discount_amount == null ? null : Number(c.max_discount_amount),
    minOrderValue: Number(c.min_order_value ?? 0),
    validUntil: c.valid_until ?? null,
    alreadyUsed: Boolean(c.already_used),
  };
}

/** Coupons currently valid and targeted at the signed-in customer. */
export async function fetchMyCoupons(): Promise<Coupon[]> {
  const { coupons } = await apiFetch<{ coupons: ApiCoupon[] }>('/coupons/mine');
  return coupons.map(mapCoupon);
}
