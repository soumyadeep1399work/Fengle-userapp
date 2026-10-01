import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { CartState, CategoryId, Item, PendingAdd, SheetKind } from '../types';
import { getCategory, getClubPartners, getItem } from '../data/catalogStore';
import { CartQuote, isQuotable, quoteCart } from '../api/cart';
import { round2 } from '../utils/money';
import { useAuth } from './AuthContext';
import { useCatalog } from './CatalogContext';

const EMPTY_CART: CartState = { cat: null, club: null, items: {} };

// GST is a flat 5% (2.5% CGST + 2.5% SGST) — used only to keep the bill
// looking right for the instant between a cart change and its server quote.
const GST_RATE = 0.05;
const QUOTE_DEBOUNCE_MS = 250;

type QuoteStatus = 'idle' | 'loading' | 'ready' | 'error';

interface CartContextValue {
  cart: CartState;
  sheet: SheetKind;
  pending: PendingAdd;
  /** True while the server is deciding whether an item from another category can join the cart. */
  checking: boolean;

  /** Adds directly, or asks the server (club vs lock) when the item is from another category. */
  requestAdd: (item: Item) => void;
  incrementItem: (itemId: string) => void;
  decrementItem: (itemId: string) => void;
  qtyOf: (itemId: string) => number;

  itemCount: number;
  subtotal: number;
  fee: number;
  tax: number;
  toPay: number;
  /** True once the bill above is the server's own quote for exactly this cart. */
  billReady: boolean;
  quoteStatus: QuoteStatus;
  /** Why the cart can't be ordered as-is (nothing nearby, pricing failed, no address); null if fine. */
  blockReason: string | null;
  refreshQuote: () => void;

  /** The coupon code currently applied to this cart, if any. */
  couponCode: string | null;
  /** Amount it knocks off toPay; 0 until the server confirms it applies. */
  couponDiscount: number;
  /** Why the applied code doesn't apply right now (expired, minimum not met, not eligible); null when it's fine or none is applied. */
  couponError: string | null;
  /** True while the server is re-quoting after a coupon was just applied. */
  couponChecking: boolean;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;

  /** Same-kitchen partner categories not yet in the cart (the "alongside" suggestion). */
  alongsidePartners: CategoryId[];
  /** Minimum order value of the cart's category. */
  minOrder: number;
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
  /** History "Reorder" — replaces the cart with these item ids/quantities (all must be known to the catalog store). */
  replaceCart: (items: Record<string, number>) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { location } = useCatalog();
  const [cart, setCart] = useState<CartState>(EMPTY_CART);
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [pending, setPending] = useState<PendingAdd>(null);
  const [checking, setChecking] = useState(false);
  const checkingRef = useRef(false);

  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteStatus, setQuoteStatus] = useState<QuoteStatus>('idle');
  const [quoteError, setQuoteError] = useState('');
  const [retryTick, setRetryTick] = useState(0);
  const quoteRequestId = useRef(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);

  // A different account must never inherit the previous one's cart.
  useEffect(() => {
    if (!user) {
      setCart(EMPTY_CART);
      setSheet(null);
      setPending(null);
      setCouponCode(null);
    }
  }, [user]);

  const applyCoupon = useCallback((code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) setCouponCode(trimmed);
  }, []);

  const removeCoupon = useCallback(() => setCouponCode(null), []);

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
      if (checkingRef.current) return;
      const curCat = cart.cat;
      if (!curCat || curCat === item.categoryId || cart.club === item.categoryId) {
        addItem(item.id, item.categoryId);
        return;
      }

      const request: PendingAdd = { id: item.id, cat: item.categoryId, name: item.name };

      // A clubbed order holds at most two categories, so a third is always a lock.
      if (cart.club) {
        setPending(request);
        setSheet('lock');
        return;
      }

      if (!location) {
        Alert.alert('Add a delivery address', 'We need your address to check which kitchen can cook this.');
        return;
      }

      // Different category: ask the server whether one nearby kitchen can cook both.
      checkingRef.current = true;
      setChecking(true);
      const proposed = { ...cart.items, [item.id]: (cart.items[item.id] ?? 0) + 1 };
      quoteCart(proposed, location)
        .then((q) => {
          setPending(request);
          setSheet(q.clubbable ? 'club' : 'lock');
        })
        .catch((e) => {
          Alert.alert('Couldn’t check this item', e instanceof Error ? e.message : 'Please try again.');
        })
        .finally(() => {
          checkingRef.current = false;
          setChecking(false);
        });
    },
    [cart, location, addItem]
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
      const club = prev.club && remainingCats.has(prev.club) && prev.club !== cat ? prev.club : null;
      return { cat, club, items };
    });
  }, []);

  const qtyOf = useCallback((itemId: string) => cart.items[itemId] ?? 0, [cart.items]);

  const clearCart = useCallback(() => {
    setCart(EMPTY_CART);
    setCouponCode(null);
  }, []);

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

  const replaceCart = useCallback((items: Record<string, number>) => {
    const ids = Object.keys(items);
    if (ids.length === 0) {
      setCart(EMPTY_CART);
      return;
    }
    // First category becomes the main one; a second, different one is the club.
    const categories = Array.from(new Set(ids.map((id) => getItem(id).categoryId)));
    setCart({ cat: categories[0], club: categories[1] ?? null, items });
  }, []);

  const { itemCount, subtotal } = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const [id, qty] of Object.entries(cart.items)) {
      count += qty;
      total += getItem(id).price * qty;
    }
    return { itemCount: count, subtotal: round2(total) };
  }, [cart.items]);

  // Server-computed bill: re-quoted (debounced) whenever the cart or delivery
  // address changes. A newer request always wins over an older, slower one.
  useEffect(() => {
    if (itemCount === 0 || !location) {
      quoteRequestId.current++;
      setQuote(null);
      setQuoteStatus('idle');
      return;
    }
    if (!isQuotable(cart.items)) {
      quoteRequestId.current++;
      setQuote(null);
      setQuoteError('This demo order can’t be priced.');
      setQuoteStatus('error');
      return;
    }
    const id = ++quoteRequestId.current;
    setQuoteStatus('loading');
    const timer = setTimeout(() => {
      quoteCart(cart.items, location, couponCode)
        .then((q) => {
          if (id !== quoteRequestId.current) return;
          setQuote(q);
          setQuoteStatus('ready');
        })
        .catch((e) => {
          if (id !== quoteRequestId.current) return;
          setQuoteError(e instanceof Error ? e.message : 'Couldn’t price your cart.');
          setQuoteStatus('error');
        });
    }, QUOTE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [cart.items, itemCount, location, retryTick, couponCode]);

  const refreshQuote = useCallback(() => setRetryTick((t) => t + 1), []);

  const serverBill = quoteStatus === 'ready' && quote?.clubbable ? quote : null;
  const billReady = !!serverBill;
  const fee = quote?.clubbable ? quote.deliveryFee : 0;
  const tax = serverBill ? round2(serverBill.cgst + serverBill.sgst) : round2(subtotal * GST_RATE);
  const toPay = serverBill ? serverBill.grandTotal : round2(subtotal + fee + tax);

  let blockReason: string | null = null;
  if (itemCount > 0) {
    if (!location) blockReason = 'Add a delivery address to see your bill.';
    else if (quoteStatus === 'error') blockReason = quoteError;
    else if (quoteStatus === 'ready' && quote && !quote.clubbable) blockReason = quote.reason;
  }

  const alongsidePartners = useMemo(() => {
    if (!cart.cat) return [];
    const inCart = new Set([cart.cat, cart.club].filter(Boolean) as CategoryId[]);
    return getClubPartners(cart.cat).filter((p) => !inCart.has(p));
  }, [cart.cat, cart.club]);

  const minOrder = cart.cat ? getCategory(cart.cat).min : 0;

  const nudgeAmount = useMemo(() => {
    if (!cart.cat || subtotal <= 0) return 0;
    return subtotal < minOrder ? round2(minOrder - subtotal) : 0;
  }, [cart.cat, subtotal, minOrder]);

  const canCheckout = itemCount > 0 && nudgeAmount === 0 && billReady && !!quote?.valid;

  const couponDiscount = couponCode && quoteStatus === 'ready' ? (quote?.couponDiscount ?? 0) : 0;
  const couponError = couponCode && quoteStatus === 'ready' ? (quote?.couponError ?? null) : null;
  const couponChecking = !!couponCode && quoteStatus === 'loading';

  const value: CartContextValue = {
    cart, sheet, pending, checking,
    requestAdd, incrementItem, decrementItem, qtyOf,
    itemCount, subtotal, fee, tax, toPay, billReady, quoteStatus, blockReason, refreshQuote,
    couponCode, couponDiscount, couponError, couponChecking, applyCoupon, removeCoupon,
    alongsidePartners, minOrder, nudgeAmount, canCheckout,
    clearCart, confirmFinishCurrent, confirmStartNew, confirmClub, dismissSheet, replaceCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
