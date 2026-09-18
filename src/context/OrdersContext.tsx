import React, { createContext, useCallback, useContext, useState } from 'react';
import { CartState, OrderRecord } from '../types';
import { getCategory, getItem, RIDER } from '../data/mock';

interface PlaceOrderInput {
  cart: CartState;
  subtotal: number;
  fee: number;
  tax: number;
  total: number;
  payLabel: string;
}

interface OrdersContextValue {
  orders: OrderRecord[];
  /** The most recent delivered, non-cancelled order whose kitchen rating is
   * still unresolved (neither rated nor explicitly skipped) — while this is
   * set, placing another order is blocked until it's rated or skipped. */
  pendingRestaurantRating: OrderRecord | undefined;
  placeOrder: (input: PlaceOrderInput) => OrderRecord;
  advanceStatus: (orderId: string) => void;
  cancelOrder: (orderId: string) => void;
  rateRider: (orderId: string, rating: number, comment?: string) => void;
  rateRestaurant: (orderId: string, rating: number, comment?: string) => void;
  skipRestaurantRating: (orderId: string) => void;
  getOrder: (orderId: string) => OrderRecord | undefined;
}

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

let seq = 4821;

// The flatboard's own demo default (ui.orderId defaults to 'PL-4821', an
// in-progress Bengali order) — seeded so "Track order" on the History list
// and the OrderStatus screen have a real record to show, exactly matching
// the flatboard's historyList[0] ("ON THE WAY", 2×Kosha Mangsho + 1×Basanti Pulao, ₹806).
const SEED_ORDER: OrderRecord = {
  id: 'PL-4821',
  catId: 'bengali',
  catName: 'Bengali',
  prep: '35–45 min',
  items: { b2: 2, b5: 1 },
  subtotal: 740,
  fee: 29,
  tax: 37,
  total: 806,
  payLabel: 'UPI',
  statusStep: 3, // "on the way"
  placedTime: '8:04 PM',
  placedAt: Date.now() - 27 * 60 * 1000, // long past the cancel window
  cancelled: false,
  riderRating: null,
  riderRatingComment: null,
  restaurantRating: null,
  restaurantRatingComment: null,
  restaurantRatingSkipped: false,
  riderName: RIDER.name,
  riderPhone: RIDER.phone,
};

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<OrderRecord[]>([SEED_ORDER]);

  const placeOrder = useCallback((input: PlaceOrderInput): OrderRecord => {
    seq += 1;
    const cat = input.cart.cat ? getCategory(input.cart.cat) : null;
    const record: OrderRecord = {
      id: `PL-${seq}`,
      catId: input.cart.cat,
      catName: cat?.name ?? 'Bengali',
      prep: cat?.prep ?? '35–45 min',
      items: input.cart.items,
      subtotal: input.subtotal,
      fee: input.fee,
      tax: input.tax,
      total: input.total,
      payLabel: input.payLabel,
      statusStep: 0,
      placedTime: '8:04 PM',
      placedAt: Date.now(),
      cancelled: false,
      riderRating: null,
      riderRatingComment: null,
      restaurantRating: null,
      restaurantRatingComment: null,
      restaurantRatingSkipped: false,
      riderName: RIDER.name,
      riderPhone: RIDER.phone,
    };
    setOrders((prev) => [record, ...prev]);
    return record;
  }, []);

  const advanceStatus = useCallback((orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId && !o.cancelled ? { ...o, statusStep: Math.min(4, o.statusStep + 1) } : o))
    );
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, cancelled: true } : o)));
  }, []);

  const rateRider = useCallback((orderId: string, rating: number, comment?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, riderRating: rating, riderRatingComment: comment?.trim() || null } : o))
    );
  }, []);

  const rateRestaurant = useCallback((orderId: string, rating: number, comment?: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, restaurantRating: rating, restaurantRatingComment: comment?.trim() || null } : o))
    );
  }, []);

  const skipRestaurantRating = useCallback((orderId: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, restaurantRatingSkipped: true } : o)));
  }, []);

  const getOrder = useCallback((orderId: string) => orders.find((o) => o.id === orderId), [orders]);

  const pendingRestaurantRating = orders.find(
    (o) => o.statusStep === 4 && !o.cancelled && o.restaurantRating === null && !o.restaurantRatingSkipped
  );

  return (
    <OrdersContext.Provider
      value={{
        orders, pendingRestaurantRating, placeOrder, advanceStatus, cancelOrder,
        rateRider, rateRestaurant, skipRestaurantRating, getOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders(): OrdersContextValue {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within an OrdersProvider');
  return ctx;
}

export function summaryLinesFor(order: OrderRecord) {
  return Object.entries(order.items).map(([id, qty]) => {
    const item = getItem(id);
    return { id, name: item.name, qty, line: item.price * qty };
  });
}
