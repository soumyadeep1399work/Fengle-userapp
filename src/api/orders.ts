import { OrderLine, OrderRecord, PaymentMethod } from '../types';
import { Coords } from '../utils/location';
import { formatClock, formatDay } from '../utils/time';
import { apiFetch } from './client';

/** Shown as the payment label for cash on delivery (nothing has been paid yet). */
export const COD_PAY_LABEL = 'Cash on delivery';

const PAY_LABEL: Record<string, string> = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net banking',
  cod: COD_PAY_LABEL,
  wallet: 'Fengle credits',
};

export const STATUS_STEP: Record<string, number> = {
  placed: 0,
  accepted: 1,
  picked_up: 2,
  on_the_way: 3,
  delivered: 4,
  cancelled: 0,
};

// Order rows come straight from MySQL: DECIMAL columns arrive as strings.
export interface ApiOrder {
  id: number;
  status: string;
  item_total: string | number;
  delivery_fee: string | number;
  cgst_amount: string | number;
  sgst_amount: string | number;
  grand_total: string | number;
  payment_method: string;
  payment_status: string;
  created_at: string;
  /** ISO time until which the order can be cancelled; null once it is no longer 'placed'. */
  cancellable_until?: string | null;
  /** Customer-only: never present on a restaurant/rider/admin read of the same order. */
  delivery_otp?: string | null;
}

export interface ApiPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  /** True while Razorpay keys aren't configured: the backend accepts a dummy confirmation. */
  dev_stub?: boolean;
}

export interface PlacedOrder {
  order: ApiOrder;
  payment: ApiPayment | null;
}

export interface PlaceOrderResult {
  /** Set when the backend had to split the cart into two orders. */
  message?: string;
  placed: PlacedOrder[];
}

export async function placeOrderRequest(input: {
  items: Record<string, number>;
  coords: Coords;
  address: string;
  method: PaymentMethod;
  couponCode?: string | null;
}): Promise<PlaceOrderResult> {
  const data = await apiFetch<{
    order?: ApiOrder;
    payment?: ApiPayment | null;
    message?: string;
    orders?: PlacedOrder[];
  }>('/orders', {
    method: 'POST',
    timeoutMs: 30000,
    body: {
      items: Object.entries(input.items).map(([id, quantity]) => ({ item_id: Number(id), quantity })),
      delivery_lat: input.coords.lat,
      delivery_lng: input.coords.lng,
      delivery_address: input.address,
      payment_method: input.method,
      ...(input.couponCode ? { coupon_code: input.couponCode } : {}),
    },
  });
  if (data.orders) return { message: data.message, placed: data.orders };
  return { placed: [{ order: data.order as ApiOrder, payment: data.payment ?? null }] };
}

export interface RazorpayConfirmation {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export function confirmPaymentRequest(orderId: number | string, confirmation: RazorpayConfirmation) {
  return apiFetch<{ message: string }>(`/orders/${orderId}/confirm-payment`, {
    method: 'POST',
    body: confirmation,
  });
}

// Only valid while Razorpay isn't configured (the backend then accepts any values).
export function confirmDevPayment(orderId: number | string) {
  return confirmPaymentRequest(orderId, {
    razorpay_payment_id: `dev_pay_${orderId}`,
    razorpay_order_id: `dev_order_${orderId}`,
    razorpay_signature: 'dev_signature',
  });
}

export function cancelOrderRequest(orderId: number | string) {
  return apiFetch<{ order?: unknown }>(`/orders/${orderId}/cancel`, { method: 'POST' });
}

export interface OrderStatusPoll {
  status: 'placed' | 'accepted' | 'picked_up' | 'on_the_way' | 'delivered' | 'cancelled';
  cancelled: boolean;
  eta_minutes: number | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  rider_assigned: boolean;
  cancellable_until?: string | null;
}

export function fetchOrderStatus(orderId: number | string) {
  return apiFetch<OrderStatusPoll>(`/orders/${orderId}/status`);
}

// ---------------------------------------------------------------------------
// Reading orders (history + detail) and rating them
// ---------------------------------------------------------------------------

// The list and the detail both spread the raw MySQL row, so ratings, ETA and
// timestamps are snake_case columns in either.
interface ApiOrderRow extends ApiOrder {
  rider_rating?: number | null;
  rider_rating_comment?: string | null;
  restaurant_rating?: number | null;
  restaurant_rating_comment?: string | null;
  restaurant_rating_skipped?: boolean | number;
  eta_minutes?: number | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  category_name?: string;
  categories?: { id: number; name: string }[];
  /** Detail only. */
  rider?: { name: string; phone: string } | null;
}

interface ApiOrderLine {
  item_id: number;
  name: string;
  quantity: number;
  /** Detail only. */
  unit_price?: string | number;
  /** Detail only: 'confirmed' | 'dropped_unavailable'. */
  status?: string;
}

export function etaLabelFor(pickedUpAt: string | null | undefined, etaMinutes: number | null | undefined): string | null {
  if (etaMinutes == null || !pickedUpAt) return null;
  const clock = formatClock(new Date(pickedUpAt).getTime() + etaMinutes * 60000);
  return clock ? `Arriving by ${clock}` : null;
}

function mapOrder(row: ApiOrderRow, apiLines: ApiOrderLine[]): OrderRecord {
  const lines: OrderLine[] = apiLines
    .filter((l) => l.status == null || l.status === 'confirmed')
    .map((l) => ({
      id: String(l.item_id),
      name: l.name,
      qty: Number(l.quantity),
      unitPrice: l.unit_price == null ? null : Number(l.unit_price),
    }));
  const categoryIds = (row.categories ?? []).map((c) => String(c.id));
  const createdClock = formatClock(row.created_at);

  return {
    id: String(row.id),
    catId: categoryIds[0] ?? null,
    categoryIds,
    catName: row.category_name || 'Your order',
    prep: '',
    lines,
    subtotal: Number(row.item_total),
    fee: Number(row.delivery_fee),
    tax: Number(row.cgst_amount) + Number(row.sgst_amount),
    total: Number(row.grand_total),
    payLabel: PAY_LABEL[row.payment_method] ?? row.payment_method,
    statusStep: STATUS_STEP[row.status] ?? 0,
    placedTime: createdClock ?? '',
    placedDate: formatDay(row.created_at),
    cancellableUntil: row.cancellable_until ? Date.parse(row.cancellable_until) : null,
    deliveryOtp: row.delivery_otp ?? null,
    cancelled: row.status === 'cancelled',
    refunded: row.payment_status === 'refunded',
    riderRating: row.rider_rating ?? null,
    riderRatingComment: row.rider_rating_comment ?? null,
    restaurantRating: row.restaurant_rating ?? null,
    restaurantRatingComment: row.restaurant_rating_comment ?? null,
    restaurantRatingSkipped: Boolean(row.restaurant_rating_skipped),
    riderName: row.rider?.name ?? '',
    riderPhone: row.rider?.phone ?? '',
    etaLabel: etaLabelFor(row.picked_up_at, row.eta_minutes),
    stepTimes: [createdClock, null, formatClock(row.picked_up_at), null, formatClock(row.delivered_at)],
  };
}

/** Every order of the signed-in customer, newest first (no prices per line). */
export async function fetchOrders(): Promise<OrderRecord[]> {
  const { orders } = await apiFetch<{ orders: (ApiOrderRow & { items?: ApiOrderLine[] })[] }>('/orders');
  return orders.map((o) => mapOrder(o, o.items ?? []));
}

/** One order in full: line prices, rider and ratings. */
export async function fetchOrderDetail(orderId: string): Promise<OrderRecord> {
  const { order, items } = await apiFetch<{ order: ApiOrderRow; items: ApiOrderLine[] }>(`/orders/${orderId}`);
  return mapOrder(order, items);
}

export function rateRiderRequest(orderId: string, rating: number, comment?: string) {
  return apiFetch<unknown>(`/orders/${orderId}/rate-rider`, {
    method: 'POST',
    body: { rating, ...(comment ? { comment } : {}) },
  });
}

export function rateRestaurantRequest(orderId: string, rating: number, comment?: string) {
  return apiFetch<unknown>(`/orders/${orderId}/rate-restaurant`, {
    method: 'POST',
    body: { rating, ...(comment ? { comment } : {}) },
  });
}

export function skipRestaurantRatingRequest(orderId: string) {
  return apiFetch<unknown>(`/orders/${orderId}/skip-restaurant-rating`, { method: 'POST' });
}
