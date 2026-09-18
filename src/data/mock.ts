import { Address, Category, CategoryId, HistoryOrder, Item, ProfileRow, WalletEntry } from '../types';

// Verbatim from the flatboard's own CATS/CLUB data (see script tag in
// "Fengle Platter App Flatboard FInal.html" — const CATS / const CLUB).
// Wikimedia Commons "Special:FilePath" links are hotlinked directly, exactly
// as the flatboard does, rather than re-hosting placeholder photography.

const WIKI = 'https://commons.wikimedia.org/wiki/Special:FilePath/';

interface RawCategory {
  id: CategoryId;
  name: string;
  blurb: string;
  prep: string;
  min: number;
  img: string;
  sec: { name: string; it: [string, string, number, boolean, string][] }[];
}

const RAW_CATS: RawCategory[] = [
  {
    id: 'bengali', name: 'Bengali', blurb: 'Fish, rice & sweet endings', prep: '35–45 min', min: 50,
    img: WIKI + 'Cooked_shorshe_illish.jpg',
    sec: [
      { name: 'Popular', it: [
        ['b1', 'Shorshe Ilish', 280, false, 'Mustard fish curry'],
        ['b2', 'Kosha Mangsho', 310, false, 'Slow-cooked mutton, dark gravy'],
        ['b3', 'Aloo Posto', 130, true, 'Poppy seed paste'],
      ] },
      { name: 'More', it: [
        ['b4', 'Doi Katla', 215, false, 'Yoghurt gravy'],
        ['b5', 'Basanti Pulao', 120, true, 'Sweet yellow pulao, ghee'],
        ['b6', 'Mishti Doi', 70, true, 'Clay-pot sweet yoghurt'],
      ] },
    ],
  },
  {
    id: 'south', name: 'South Indian', blurb: 'Dosa, idli, filter coffee', prep: '30–40 min', min: 50,
    img: WIKI + 'Masala_Dosa_(Bengaluru).JPG',
    sec: [
      { name: 'Popular', it: [
        ['s1', 'Masala Dosa', 90, true, 'Crisp rice crepe, potato filling'],
        ['s2', 'Idli Sambar', 70, true, 'Steamed rice cakes, lentil stew'],
        ['s3', 'Uttapam', 90, true, 'Thick savoury pancake'],
      ] },
      { name: 'More', it: [
        ['s4', 'Rava Dosa', 100, true, 'Crisp semolina crepe'],
        ['s5', 'Medu Vada', 60, true, 'Fried lentil doughnut'],
        ['s6', 'Filter Coffee', 45, true, 'South Indian filter coffee'],
      ] },
    ],
  },
  {
    id: 'north', name: 'North Indian', blurb: 'Dal, tandoor, rich gravies', prep: '35–45 min', min: 50,
    img: WIKI + 'Paneer_Butter_Masala.jpg',
    sec: [
      { name: 'Popular', it: [
        ['n1', 'Rajma Chawal', 150, true, 'Kidney beans, steamed rice'],
        ['n2', 'Chole Bhature', 140, true, 'Spiced chickpeas, fried bread'],
        ['n3', 'Dal Makhani', 195, true, 'Black dal, cooked overnight'],
      ] },
      { name: 'More', it: [
        ['n4', 'Butter Naan', 45, true, 'Tandoor, brushed with butter'],
        ['n5', 'Paneer Butter Masala', 225, true, 'Tomato, cashew, butter'],
      ] },
    ],
  },
  {
    id: 'mughlai', name: 'Mughlai', blurb: 'Slow-cooked, rich spice', prep: '35–45 min', min: 50,
    img: WIKI + 'Galouti_Kebab.jpg',
    sec: [
      { name: 'Popular', it: [
        ['m1', 'Butter Chicken', 260, false, 'Tomato, cream, char'],
        ['m2', 'Mutton Rogan Josh', 340, false, 'Kashmiri red gravy'],
      ] },
      { name: 'More', it: [
        ['m3', 'Galouti Kebab', 240, false, 'Melt-in-mouth minced kebab'],
        ['m4', 'Sheermal', 50, true, 'Saffron sweet flatbread'],
      ] },
    ],
  },
  {
    id: 'biryani', name: 'Biryani', blurb: 'Layered rice, slow dum', prep: '30–40 min', min: 50,
    img: WIKI + 'Hyderabadi_Chicken_Biryani.jpg',
    sec: [
      { name: 'Popular', it: [
        ['br1', 'Chicken Biryani', 260, false, 'Dum-cooked, layered rice'],
        ['br2', 'Mutton Biryani', 320, false, 'Slow-cooked mutton, rice'],
      ] },
      { name: 'More', it: [
        ['br3', 'Veg Biryani', 180, true, 'Mixed vegetable, rice'],
        ['br4', 'Raita', 40, true, 'Cooling yoghurt side'],
      ] },
    ],
  },
  {
    id: 'chinese', name: 'Chinese (Indo)', blurb: 'Indo-Chinese wok classics', prep: '25–35 min', min: 50,
    img: WIKI + 'Veg_Hakka_Noodles.jpg',
    sec: [
      { name: 'Popular', it: [
        ['c1', 'Hakka Noodles', 160, true, 'Wok-tossed noodles'],
        ['c2', 'Chilli Chicken', 220, false, 'Dry-tossed, spiced'],
        ['c3', 'Chilli Paneer', 195, true, 'Veg, tossed on high flame'],
      ] },
      { name: 'More', it: [
        ['c4', 'Veg Manchurian', 150, true, 'Fried veg balls, gravy'],
        ['c5', 'Chicken Fried Rice', 190, false, 'Wok-fried rice'],
      ] },
    ],
  },
  {
    id: 'tiffin', name: 'Tiffin / Breakfast', blurb: 'Light breakfast plates', prep: '15–25 min', min: 50,
    img: WIKI + 'Kanda_poha.jpg',
    sec: [
      { name: 'Popular', it: [
        ['t1', 'Kanda Poha', 60, true, 'Flattened rice, onion, peanuts'],
        ['t2', 'Upma', 55, true, 'Savoury semolina porridge'],
      ] },
      { name: 'More', it: [
        ['t3', 'Sabudana Khichdi', 65, true, 'Tapioca pearls, peanuts'],
        ['t4', 'Masala Omelette', 70, false, 'Spiced onion omelette'],
      ] },
    ],
  },
  {
    id: 'chaat', name: 'Chaat & Snacks', blurb: 'Street-side tang & crunch', prep: '15–20 min', min: 50,
    img: WIKI + 'Papdi_chaat.jpg',
    sec: [
      { name: 'Popular', it: [
        ['ch1', 'Pani Puri', 70, true, 'Tangy water, crisp shells'],
        ['ch2', 'Sev Puri', 80, true, 'Crisp discs, chutneys'],
      ] },
      { name: 'More', it: [
        ['ch3', 'Bhel Puri', 70, true, 'Puffed rice, tangy mix'],
        ['ch4', 'Aloo Tikki', 60, true, 'Spiced potato patty'],
      ] },
    ],
  },
  {
    id: 'sweets', name: 'Sweets', blurb: 'Bengali sweet-shop favourites', prep: '15–20 min', min: 50,
    img: WIKI + 'Rosogolla.jpg',
    sec: [
      { name: 'Popular', it: [
        ['sw1', 'Rosogolla', 80, true, 'Spongy cottage-cheese balls'],
        ['sw2', 'Gulab Jamun', 70, true, 'Fried milk-solid, syrup'],
      ] },
      { name: 'More', it: [
        ['sw3', 'Rasmalai', 90, true, 'Cottage cheese, saffron milk'],
        ['sw4', 'Kaju Katli', 150, true, 'Cashew fudge diamonds'],
      ] },
    ],
  },
  {
    id: 'continental', name: 'Continental', blurb: 'Grills, pastas & salads', prep: '30–40 min', min: 50,
    img: WIKI + "Penne_all'arrabbiata.jpg",
    sec: [
      { name: 'Popular', it: [
        ['co1', 'Grilled Chicken', 280, false, 'Herb-marinated, char-grilled'],
        ['co2', 'Pasta Arrabbiata', 220, true, 'Spicy tomato, garlic'],
      ] },
      { name: 'More', it: [
        ['co3', 'Caesar Salad', 190, true, 'Romaine, parmesan, croutons'],
        ['co4', 'Garlic Bread', 90, true, 'Toasted, herb butter'],
      ] },
    ],
  },
  {
    id: 'thali', name: 'Thali / Combos', blurb: 'Complete home-style meals', prep: '25–35 min', min: 50,
    img: WIKI + 'Veg_Thali.jpg',
    sec: [
      { name: 'Popular', it: [
        ['th1', 'Veg Thali', 150, true, 'Dal, sabzi, rice, roti'],
        ['th2', 'Non-Veg Thali', 220, false, 'Curry, rice, roti'],
      ] },
      { name: 'More', it: [
        ['th3', 'Mini Thali', 110, true, 'Smaller portions, same variety'],
      ] },
    ],
  },
];

export const CATEGORIES: Category[] = RAW_CATS.map((c) => ({
  id: c.id, name: c.name, blurb: c.blurb, prep: c.prep, min: c.min, img: c.img,
  sections: c.sec.map((s) => ({ name: s.name, itemIds: s.it.map((i) => i[0]) })),
}));

export const CATEGORY_ORDER: CategoryId[] = CATEGORIES.map((c) => c.id);

// Deterministic per-item "previous ratings" — stable across reloads without
// hand-authoring a rating for every dish. Not real review data.
function seededRating(id: string): { avgRating: number; ratingCount: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const avgRating = Math.round((3.8 + ((h % 100) / 100) * 1.1) * 10) / 10; // 3.8–4.9
  const ratingCount = 35 + (h % 761); // 35–795
  return { avgRating, ratingCount };
}

export const ITEMS: Record<string, Item> = {};
RAW_CATS.forEach((c) => c.sec.forEach((s) => s.it.forEach(([id, name, price, veg, desc]) => {
  ITEMS[id] = { id, categoryId: c.id, name, price, veg, desc, ...seededRating(id) };
})));

export function getCategory(id: CategoryId): Category {
  const c = CATEGORIES.find((c) => c.id === id);
  if (!c) throw new Error(`Unknown category ${id}`);
  return c;
}

export function getItem(itemId: string): Item {
  const i = ITEMS[itemId];
  if (!i) throw new Error(`Unknown item ${itemId}`);
  return i;
}

const ALL_ITEMS: Item[] = Object.values(ITEMS);

export function searchItems(query: string): Item[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_ITEMS.filter(
    (i) => i.name.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q) || getCategory(i.categoryId).name.toLowerCase().includes(q)
  );
}

export function itemsInSection(catId: CategoryId, sectionName: string): Item[] {
  const cat = getCategory(catId);
  const sec = cat.sections.find((s) => s.name === sectionName);
  return sec ? sec.itemIds.map(getItem) : [];
}

// Which categories can club into the same order as a given category — exact
// pairing from the flatboard's `CLUB` map (not simply symmetric: chinese and
// sweets each only pair with bengali, not with each other).
export const CLUB: Record<CategoryId, CategoryId[]> = {
  bengali: ['chinese', 'sweets'],
  chinese: ['bengali'],
  sweets: ['bengali'],
  north: ['mughlai'],
  mughlai: ['north', 'biryani'],
  biryani: ['mughlai'],
  south: ['chaat', 'tiffin'],
  chaat: ['south'],
  tiffin: ['south'],
  thali: ['continental'],
  continental: ['thali'],
};

export const ADDRESSES: Address[] = [
  { id: 'home', label: 'Home', area: 'Salt Lake, Sector V', detail: '42B Rainbow Apartments, Salt Lake Sector V, Kolkata 700091', isDefault: true, feeNote: '₹29 delivery – beyond the free radius', feeIsFree: false },
  { id: 'work', label: 'Work', area: 'DP Block, Salt Lake', detail: 'Godrej Waterside, Tower 2, DP Block, Salt Lake, Kolkata 700091', isDefault: false, feeNote: 'Free delivery', feeIsFree: true },
];

export const PROFILE_ROWS: ProfileRow[] = [
  { label: 'Saved addresses', sub: 'Home, Work', target: 'Addresses' },
  { label: 'Payment methods', sub: 'UPI, Visa •••• 4412', target: null },
  { label: 'Platter credits', sub: '₹214.00 available', target: 'Wallet' },
  { label: 'Notifications', sub: 'Order updates on', target: null },
  { label: 'Help & support', sub: 'Chat or call us', target: null },
];

export const WALLET_BALANCE = 214.0;

export const WALLET_ENTRIES: WalletEntry[] = [
  { id: 'w1', label: 'Refund · missing side', sub: 'Order #PL-4598 · 3 Aug', sign: '+', amount: 120 },
  { id: 'w2', label: 'Credits used', sub: 'Order #PL-4712 · 21 Aug', sign: '−', amount: 60 },
  { id: 'w3', label: 'Late delivery goodwill', sub: 'Order #PL-4655 · 14 Aug', sign: '+', amount: 100 },
  { id: 'w4', label: 'Welcome credit', sub: 'Joined 12 Jul', sign: '+', amount: 54 },
];

// PL-4821 (the in-progress Bengali order) is seeded directly into
// OrdersContext instead — see SEED_ORDER there — so its live status and
// invoice stay consistent. These three are past orders only (no live
// OrdersContext record; Invoice reconstructs a consistent breakdown from
// `total` for them, see InvoiceScreen).
export const HISTORY: HistoryOrder[] = [
  { id: 'PL-4712', catId: 'south', catName: 'South Indian', badgeLabel: 'DELIVERED', badgeTone: 'done', itemsSummary: '2 × Ghee Roast Dosa, 1 × Filter Coffee', total: 366, date: '21 Aug', primaryLabel: 'Reorder' },
  { id: 'PL-4655', catId: 'biryani', catName: 'Biryani', badgeLabel: 'DELIVERED', badgeTone: 'done', itemsSummary: '1 × Kolkata Mutton Biryani, 1 × Raita', total: 411, date: '14 Aug', primaryLabel: 'Reorder' },
  { id: 'PL-4598', catId: 'chaat', catName: 'Chaat & Snacks', badgeLabel: 'REFUNDED', badgeTone: 'refunded', itemsSummary: '2 × Papdi Chaat, 2 × Veg Chop', total: 412, date: '2 Aug', primaryLabel: 'Reorder' },
];

export const MIN_ORDER_VALUE = 50;
export const DELIVERY_FEE = 29;
export const GST_RATE = 0.05;

// How long a freshly-placed order can still be cancelled — the restaurant
// hasn't necessarily accepted yet, so a short buffer lets a user undo a
// mis-tap without calling support.
export const CANCEL_WINDOW_MS = 60_000;

// Single mock rider assigned to every order once it's picked up — there's no
// dispatch backend yet, so every in-flight order "shares" this one rider.
export const RIDER = { name: 'Rahul Kumar', phone: '+919876543210' };
