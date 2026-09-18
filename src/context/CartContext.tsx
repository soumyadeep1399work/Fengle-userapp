import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CartState, CategoryId, Item, PendingAdd, SheetKind } from '../types';
import { CLUB, DELIVERY_FEE, MIN_ORDER_VALUE, getCategory, getItem } from '../data/mock';

const EMPTY_CART: CartState = { cat: null, club: null, items: {} };

interface CartContextValue {
  cart: CartState;
  sheet: SheetKind;
  pending: PendingAdd;

  /** Mirrors the flatboard's onAddClick: adds directly, or opens the lock/club sheet. */
  requestAdd: (item: Item) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  qtyOf: (itemId: string) => number;

  itemCount: number;
  subtotal: number;
  fee: number;
  tax: number;
  toPay: number;

  /** Same-kitchen partner categories not yet in the cart (the "alongside" suggestion). */
  alongsidePartners: CategoryId[];
  /** Set once cart.cat's minimum order value isn't met yet. */
  nudgeAmount: number;
  canCheckout: boolean;

  clearCart: () => void;
  /** Lock sheet "Finish my X order" — keeps the cart, just closes the sheet. */
  confirmFinishCurrent: () => void;
  /** Lock sheet "Start a new Y order" — replaces the cart, returns the new category id to navigate to. */
  confirmStartNew: () => CategoryId | null;
  /** Club sheet "Add it to this order". */
  confirmClub: () => void;
  dismissSheet: () => void;
  /** History "Reorder" — seeds the cart with that category's first two items. */
  reorderCategory: (catId: CategoryId) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [pending, setPending] = useState<PendingAdd>(null);

  const addItem = useCallback((id: string, catId: CategoryId) => {
    setCart((prev) => {
      const items = { ...prev.items, [id]: (prev.items[id] ?? 0) + 1 };
      const base = prev.cat || catId;
      const club = catId !== base ? catId : prev.club;
      return { cat: base, club, items };
    });
    setSheet(null);
    setPending(null);
  }, []);

  const requestAdd = useCallback(
    (item: Item) => {
      const curCat = cart.cat;
      if (!curCat || curCat === item.categoryId) {
        addItem(item.id, item.categoryId);
        return;
      }
      const mode: 'club' | 'lock' = (CLUB[curCat] || []).includes(item.categoryId) ? 'club' : 'lock';
      setPending({ id: item.id, cat: item.categoryId, name: item.name });
      setSheet(mode);
    },
    [cart.cat, addItem]
  );

  const incrementItem = useCallback(
    (itemId: string) => {
      addItem(itemId, getItem(itemId).categoryId);
    },
    [addItem]
  );

  const decrementItem = useCallback((itemId: string) => {
    setCart((prev) => {
      const n = (prev.items[itemId] ?? 0) - 1;
      const items = { ...prev.items };
      if (n <= 0) delete items[itemId];
      else items[itemId] = n;

      const remainingIds = Object.keys(items);
      if (!remainingIds.length) return EMPTY_CART;

      const remainingCats = new Set(remainingIds.map((id) => getItem(id).categoryId));
      const cat = remainingCats.has(prev.cat as CategoryId) ? prev.cat : getItem(remainingIds[0]).categoryId;
      const club = prev.club && remainingCats.has(prev.club) ? prev.club : null;
      return { cat, club, items };
    });
  }, []);

  const qtyOf = useCallback((itemId: string) => cart.items[itemId] ?? 0, [cart.items]);

  const clearCart = useCallback(() => setCart(EMPTY_CART), []);

  const dismissSheet = useCallback(() => {
    setSheet(null);
    setPending(null);
  }, []);

  const confirmFinishCurrent = useCallback(() => dismissSheet(), [dismissSheet]);

  const confirmStartNew = useCallback((): CategoryId | null => {
    if (!pending) return null;
    const targetCat = pending.cat;
    setCart({ cat: targetCat, club: null, items: { [pending.id]: 1 } });
    dismissSheet();
    return targetCat;
  }, [pending, dismissSheet]);

  const confirmClub = useCallback(() => {
    if (pending) addItem(pending.id, pending.cat);
  }, [pending, addItem]);

  const reorderCategory = useCallback((catId: CategoryId) => {
    const cat = getCategory(catId);
    const flatIds = cat.sections.flatMap((s) => s.itemIds);
    const items: Record<string, number> = {};
    if (flatIds[0]) items[flatIds[0]] = 2;
    if (flatIds[1]) items[flatIds[1]] = 1;
    setCart({ cat: catId, club: null, items });
  }, []);

  const { itemCount, subtotal } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const [id, qty] of Object.entries(cart.items)) {
      count += qty;
      total += getItem(id).price * qty;
    }
    return { itemCount: count, subtotal: total };
  }, [cart.items]);

  const fee = subtotal > 0 ? DELIVERY_FEE : 0;
  const tax = Math.round(subtotal * 0.05);
  const toPay = subtotal + fee + tax;

  const alongsidePartners = useMemo(() => {
    if (!cart.cat) return [];
    const inCart = new Set([cart.cat, cart.club].filter(Boolean) as CategoryId[]);
    return (CLUB[cart.cat] || []).filter((p) => !inCart.has(p));
  }, [cart.cat, cart.club]);

  const nudgeAmount = useMemo(() => {
    if (!cart.cat || subtotal <= 0) return 0;
    const min = getCategory(cart.cat).min;
    return subtotal < min ? min - subtotal : 0;
  }, [cart.cat, subtotal]);

  const canCheckout = itemCount > 0 && nudgeAmount === 0;

  const value: CartContextValue = {
    cart, sheet, pending,
    requestAdd, incrementItem, decrementItem, qtyOf,
    itemCount, subtotal, fee, tax, toPay,
    alongsidePartners, nudgeAmount, canCheckout,
    clearCart, confirmFinishCurrent, confirmStartNew, confirmClub, dismissSheet, reorderCategory,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
