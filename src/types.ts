export type CategoryId =
  | 'bengali'
  | 'south'
  | 'north'
  | 'mughlai'
  | 'biryani'
  | 'chinese'
  | 'tiffin'
  | 'chaat'
  | 'sweets'
  | 'continental'
  | 'thali';

export interface CategorySection {
  name: string;
  itemIds: string[];
}

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
  prep: string;
  min: number;
  img: string;
  sections: CategorySection[];
}

export interface Item {
  id: string;
  categoryId: CategoryId;
  name: string;
  price: number;
  veg: boolean;
  desc: string;
  avgRating: number;
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

export type PaymentMethod = 'upi' | 'card' | 'credits';

export type OrderStatusStep = 'placed' | 'accepted' | 'picked_up' | 'on_the_way' | 'delivered';

export interface OrderRecord {
  id: string;
  catId: CategoryId | null;
  catName: string;
  prep: string;
  items: Record<string, number>;
  subtotal: number;
  fee: number;
  tax: number;
  total: number;
  payLabel: string;
  statusStep: number; // 0-4
  placedTime: string;
  placedAt: number;
  cancelled: boolean;
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
  riderName: string;
  riderPhone: string;
}

export interface Address {
  id: string;
  label: string;
  /** Short locality shown compactly on Home, e.g. "Salt Lake, Sector V". */
  area: string;
  detail: string;
  isDefault: boolean;
  feeNote: string;
  feeIsFree: boolean;
}

export interface ProfileRow {
  label: string;
  sub: string;
  target: 'Addresses' | 'Wallet' | null;
}

export interface WalletEntry {
  id: string;
  label: string;
  sub: string;
  sign: '+' | '−';
  amount: number;
}

export type HistoryBadgeTone = 'active' | 'done' | 'refunded' | 'cancelled';

export interface HistoryOrder {
  id: string;
  catId: CategoryId;
  catName: string;
  badgeLabel: string;
  badgeTone: HistoryBadgeTone;
  itemsSummary: string;
  total: number;
  date: string;
  primaryLabel: string;
}
