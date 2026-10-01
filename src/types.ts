// The backend's numeric category id, as a string.
export type CategoryId = string;

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  /** Display string built from the backend's min/max prep minutes, e.g. "35–45 min". */
  prep: string;
  /** Minimum order value for this category. */
  min: number;
  img: string | null;
  /** Other categories that share a kitchen somewhere — a hint; /cart/quote decides for real. */
  clubPartnerIds: CategoryId[];
}

export interface CategorySection {
  name: string;
  items: Item[];
}

export interface Item {
  id: string;
  categoryId: CategoryId;
  name: string;
  price: number;
  veg: boolean;
  desc: string;
  imageUrl: string | null;
  /** null until at least one delivered order containing it has been rated. */
  avgRating: number | null;
  ratingCount: number;
}

// Mirrors the flatboard's own cart shape exactly: one active category, an
// optional clubbed-in second category (same kitchen), and a flat item->qty
// map. Only one order can be in progress at a time.
export interface CartState {
  cat: CategoryId | null;
  club: CategoryId | null;
  items: Record<string, number>;
}

export type AddMode = 'ok' | 'club' | 'lock';

export type PendingAdd = { id: string; cat: CategoryId; name: string } | null;

export type SheetKind = 'lock' | 'club' | 'addr' | null;

export type PaymentMethod = 'upi' | 'card' | 'cod' | 'wallet';

export type OrderStatusStep = 'placed' | 'accepted' | 'picked_up' | 'on_the_way' | 'delivered';

export interface OrderLine {
  /** Backend item id. */
  id: string;
  name: string;
  qty: number;
  /** Price at the time of ordering; null when only the order list (no prices) has been loaded. */
  unitPrice: number | null;
}

export interface OrderRecord {
  id: string;
  catId: CategoryId | null;
  /** All categories in the order (two for a clubbed order), in the order they were added. */
  categoryIds: CategoryId[];
  /** "Bengali" or "Bengali + Chinese (Indo)". */
  catName: string;
  /** Usual prep time; only known for an order placed in this session. */
  prep: string;
  lines: OrderLine[];
  subtotal: number;
  fee: number;
  tax: number;
  total: number;
  payLabel: string;
  statusStep: number; // 0-4
  placedTime: string;
  /** Short date for lists: "Today" or "21 Aug". */
  placedDate: string;
  /** Server-time (ms) until which the order can still be cancelled; null once it's accepted, cancelled or delivered. */
  cancellableUntil: number | null;
  /** 4-digit code shown to the customer, read aloud to the rider at drop-off; null once delivered/cancelled or for orders placed before this existed. */
  deliveryOtp: string | null;
  cancelled: boolean;
  /** True once a cancelled/failed order's payment has been refunded. */
  refunded: boolean;
  riderRating: number | null;
  /** Free-text collected only when riderRating is 1-2, so a bad rating always
   * comes with a reason. */
  riderRatingComment: string | null;
  /** General rating for the kitchen behind this order's category — the user
   * never sees a restaurant name/identity, only the category ("Bengali",
   * "Biryani", ...); admin-side tooling maps it to the actual restaurant. */
  restaurantRating: number | null;
  /** Free-text collected only when restaurantRating is 1-2. */
  restaurantRatingComment: string | null;
  /** True once the user has explicitly dismissed the post-delivery rating
   * prompt without rating — unblocks placing another order, but the rating
   * can still be given later from Order History / Order Status. */
  restaurantRatingSkipped: boolean;
  /** Empty until a rider has been assigned. */
  riderName: string;
  riderPhone: string;
  /** "Arriving by 8:52 PM" once the backend has set the one-time ETA; null until then. */
  etaLabel: string | null;
  /** Clock time per tracker step (placed, accepted, picked up, on the way, delivered); null where the backend has no timestamp. */
  stepTimes: (string | null)[];
}

export interface Address {
  id: string;
  label: string;
  /** Short locality shown compactly on Home, e.g. "Salt Lake, Sector V". */
  area: string;
  detail: string;
  isDefault: boolean;
  lat: number;
  lng: number;
}

export interface Profile {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  vegOnly: boolean;
  walletBalance: number;
  notificationPrefs: { orderUpdates: boolean; promotions: boolean };
  /** True until the one-time terms & conditions acceptance is done; absent on an older backend, so this defaults to false (fail open). */
  agreementRequired: boolean;
}

export interface ProfileRow {
  label: string;
  sub: string;
  target: 'Addresses' | 'Wallet' | 'Favorites' | 'NotificationSettings' | 'Coupons' | null;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  /** Cap on the discount amount; only meaningful for a percent coupon. */
  maxDiscountAmount: number | null;
  minOrderValue: number;
  /** ISO string; null means no expiry set. */
  validUntil: string | null;
  /** True once this customer has used up their allowance on this coupon. */
  alreadyUsed: boolean;
}

export interface WalletEntry {
  id: string;
  label: string;
  sub: string;
  sign: '+' | '−';
  amount: number;
}

export type HistoryBadgeTone = 'active' | 'done' | 'refunded' | 'cancelled';
