import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { CartState, OrderRecord } from '../types';
import { getCategory, getItem } from '../data/catalogStore';
import {
  ApiOrder,
  COD_PAY_LABEL,
  OrderStatusPoll,
  STATUS_STEP,
  cancelOrderRequest,
  etaLabelFor,
  fetchOrderDetail,
  fetchOrders,
  rateRestaurantRequest,
  rateRiderRequest,
  skipRestaurantRatingRequest,
} from '../api/orders';
import { formatClock, formatDay } from '../utils/time';
import { useAuth } from './AuthContext';

export { COD_PAY_LABEL };

interface PlacedOrderMeta {
  cart: CartState;
  payLabel: string;
}

type OrdersStatus = 'idle' | 'loading' | 'ready' | 'error';

interface OrdersContextValue {
  orders: OrderRecord[];
  ordersStatus: OrdersStatus;
  /** Reloads the list. Resolves with the fresh orders (or the current ones if the request fails). */
  refreshOrders: () => Promise<OrderRecord[]>;
  /** Loads one order in full (line prices, rider, ratings) and merges it in. */
  loadOrder: (orderId: string) => Promise<void>;
  /** The most recent delivered, non-cancelled order whose kitchen rating is
   * still unresolved (neither rated nor explicitly skipped) — while this is
   * set, placing another order is blocked until it's rated or skipped. */
  pendingRestaurantRating: OrderRecord | undefined;
  /** Records an order the backend just created, so the confirmation/status screens can show it. */
  addPlacedOrder: (order: ApiOrder, meta: PlacedOrderMeta) => OrderRecord;
  /** Resolves true when the server confirmed the cancellation. */
  cancelOrder: (orderId: string) => Promise<boolean>;
  /** Applies the backend's latest status for an order. */
  applyServerStatus: (orderId: string, poll: OrderStatusPoll) => void;
  /** Rating calls resolve true once the backend has saved them. */
  rateRider: (orderId: string, rating: number, comment?: string) => Promise<boolean>;
  rateRestaurant: (orderId: string, rating: number, comment?: string) => Promise<boolean>;
  skipRestaurantRating: (orderId: string) => Promise<boolean>;
  getOrder: (orderId: string) => OrderRecord | undefined;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

/** The order number shown to the customer ("PL-12"); the backend id is just a number. */
export function displayOrderId(orderId: string): string {
  return `PL-${orderId}`;
}

/** A delivered, non-cancelled order whose kitchen rating is neither given nor skipped. */
export function findPendingRating(orders: OrderRecord[]): OrderRecord | undefined {
  return orders.find(
    (o) => o.statusStep === 4 && !o.cancelled && o.restaurantRating === null && !o.restaurantRatingSkipped
  );
}

// A freshly loaded copy may lack what an earlier, richer load had (the list has
// no line prices, only the detail has the rider), so keep those when merging.
function mergeOrder(existing: OrderRecord | undefined, next: OrderRecord): OrderRecord {
  if (!existing) return next;
  const prices = new Map(existing.lines.map((l) => [l.id, l.unitPrice]));
  return {
    ...next,
    prep: existing.prep || next.prep,
    lines: next.lines.map((l) => ({ ...l, unitPrice: l.unitPrice ?? prices.get(l.id) ?? null })),
    riderName: next.riderName || existing.riderName,
    riderPhone: next.riderPhone || existing.riderPhone,
  };
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : 'Please try again.';
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrdersState] = useState<OrderRecord[]>([]);
  const [ordersStatus, setOrdersStatus] = useState<OrdersStatus>('idle');
  // Mirrors `orders` so async code can read the latest list without stale closures.
  const ordersRef = useRef<OrderRecord[]>([]);

  const commit = useCallback((next: OrderRecord[]) => {
    ordersRef.current = next;
    setOrdersState(next);
  }, []);

  const update = useCallback(
    (fn: (prev: OrderRecord[]) => OrderRecord[]) => commit(fn(ordersRef.current)),
    [commit]
  );

  const patchOrder = useCallback(
    (orderId: string, patch: Partial<OrderRecord>) =>
      update((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))),
    [update]
  );

  const refreshOrders = useCallback(async (): Promise<OrderRecord[]> => {
    setOrdersStatus((s) => (s === 'ready' ? s : 'loading'));
    try {
      const list = await fetchOrders();
      const prev = ordersRef.current;
      const merged = list.map((o) => mergeOrder(prev.find((p) => p.id === o.id), o));
      commit(merged);
      setOrdersStatus('ready');
      return merged;
    } catch {
      setOrdersStatus((s) => (s === 'ready' ? s : 'error'));
      return ordersRef.current;
    }
  }, [commit]);

  // Load on login, clear on logout so one account never sees another's orders.
  useEffect(() => {
    if (!user) {
      commit([]);
      setOrdersStatus('idle');
      return;
    }
    refreshOrders();
  }, [user?.id, commit, refreshOrders]);

  const loadOrder = useCallback(
    async (orderId: string) => {
      try {
        const fresh = await fetchOrderDetail(orderId);
        update((prev) => {
          const exists = prev.some((o) => o.id === orderId);
          return exists ? prev.map((o) => (o.id === orderId ? mergeOrder(o, fresh) : o)) : [fresh, ...prev];
        });
      } catch {
        // Keep showing what we have; the next poll or refresh retries.
      }
    },
    [update]
  );

  const addPlacedOrder = useCallback(
    (order: ApiOrder, meta: PlacedOrderMeta): OrderRecord => {
      const { cart } = meta;
      const primary = cart.cat ? getCategory(cart.cat) : null;
      const clubbed = cart.club ? getCategory(cart.club) : null;
      const createdClock = formatClock(order.created_at);
      const record: OrderRecord = {
        id: String(order.id),
        catId: cart.cat,
        categoryIds: [cart.cat, cart.club].filter((c): c is string => !!c),
        catName: primary ? (clubbed ? `${primary.name} + ${clubbed.name}` : primary.name) : 'Your order',
        prep: primary?.prep ?? '',
        lines: Object.entries(cart.items).map(([id, qty]) => {
          const item = getItem(id);
          return { id, name: item.name, qty, unitPrice: item.price };
        }),
        subtotal: Number(order.item_total),
        fee: Number(order.delivery_fee),
        tax: Number(order.cgst_amount) + Number(order.sgst_amount),
        total: Number(order.grand_total),
        payLabel: meta.payLabel,
        statusStep: 0,
        placedTime: createdClock ?? formatClock(Date.now()) ?? '',
        placedDate: formatDay(order.created_at),
        cancellableUntil: order.cancellable_until ? Date.parse(order.cancellable_until) : null,
        deliveryOtp: order.delivery_otp ?? null,
        cancelled: false,
        refunded: false,
        riderRating: null,
        riderRatingComment: null,
        restaurantRating: null,
        restaurantRatingComment: null,
        restaurantRatingSkipped: false,
        riderName: '',
        riderPhone: '',
        etaLabel: null,
        stepTimes: [createdClock, null, null, null, null],
      };
      update((prev) => [record, ...prev.filter((o) => o.id !== record.id)]);
      return record;
    },
    [update]
  );

  const cancelOrder = useCallback(
    async (orderId: string): Promise<boolean> => {
      try {
        await cancelOrderRequest(orderId);
        patchOrder(orderId, { cancelled: true, cancellableUntil: null });
        return true;
      } catch (e) {
        // Usually 409: the kitchen already accepted, or the window has passed.
        Alert.alert('Couldn’t cancel this order', errorText(e));
        loadOrder(orderId);
        return false;
      }
    },
    [patchOrder, loadOrder]
  );

  const applyServerStatus = useCallback(
    (orderId: string, poll: OrderStatusPoll) => {
      update((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const times = [...o.stepTimes];
          times[2] = formatClock(poll.picked_up_at) ?? times[2];
          times[4] = formatClock(poll.delivered_at) ?? times[4];
          return {
            ...o,
            statusStep: poll.cancelled ? o.statusStep : STATUS_STEP[poll.status] ?? o.statusStep,
            cancelled: poll.cancelled,
            cancellableUntil: poll.cancellable_until ? Date.parse(poll.cancellable_until) : null,
            etaLabel: etaLabelFor(poll.picked_up_at, poll.eta_minutes) ?? o.etaLabel,
            stepTimes: times,
          };
        })
      );
    },
    [update]
  );

  const rateRider = useCallback(
    async (orderId: string, rating: number, comment?: string) => {
      try {
        await rateRiderRequest(orderId, rating, comment?.trim() || undefined);
        patchOrder(orderId, { riderRating: rating, riderRatingComment: comment?.trim() || null });
        return true;
      } catch (e) {
        Alert.alert('Couldn’t save your rating', errorText(e));
        return false;
      }
    },
    [patchOrder]
  );

  const rateRestaurant = useCallback(
    async (orderId: string, rating: number, comment?: string) => {
      try {
        await rateRestaurantRequest(orderId, rating, comment?.trim() || undefined);
        patchOrder(orderId, { restaurantRating: rating, restaurantRatingComment: comment?.trim() || null });
        return true;
      } catch (e) {
        Alert.alert('Couldn’t save your rating', errorText(e));
        return false;
      }
    },
    [patchOrder]
  );

  const skipRestaurantRating = useCallback(
    async (orderId: string) => {
      try {
        await skipRestaurantRatingRequest(orderId);
        patchOrder(orderId, { restaurantRatingSkipped: true });
        return true;
      } catch (e) {
        Alert.alert('Couldn’t skip the rating', errorText(e));
        return false;
      }
    },
    [patchOrder]
  );

  const getOrder = useCallback((orderId: string) => orders.find((o) => o.id === orderId), [orders]);

  const value: OrdersContextValue = {
    orders, ordersStatus, refreshOrders, loadOrder,
    pendingRestaurantRating: findPendingRating(orders),
    addPlacedOrder, cancelOrder, applyServerStatus,
    rateRider, rateRestaurant, skipRestaurantRating, getOrder,
  };

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within an OrdersProvider');
  return ctx;
}

/** Lines for the "In this order" list; `priced` is false until the order's detail has been loaded. */
export function summaryLinesFor(order: OrderRecord) {
  return order.lines.map((l) => ({
    id: l.id,
    name: l.name,
    qty: l.qty,
    line: (l.unitPrice ?? 0) * l.qty,
    priced: l.unitPrice != null,
  }));
}
