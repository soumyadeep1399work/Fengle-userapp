import { Category, CategoryId, Item } from '../types';

// Synchronous lookups for the catalog the backend has served so far. The cart
// and sheets read items/categories by id at render time, so everything the
// catalog screens fetch is registered here.

let categories: Category[] = [];
const items = new Map<string, Item>();

export function setCategories(list: Category[]) {
  categories = list;
}

export function upsertCategory(category: Category) {
  const i = categories.findIndex((c) => c.id === category.id);
  if (i >= 0) categories = categories.map((c) => (c.id === category.id ? { ...category, clubPartnerIds: c.clubPartnerIds } : c));
}

export function registerItems(list: Item[]) {
  for (const item of list) items.set(item.id, item);
}

export function findCategory(id: CategoryId): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategory(id: CategoryId): Category {
  const c = findCategory(id);
  if (!c) throw new Error(`Unknown category ${id}`);
  return c;
}

export function getItem(id: string): Item {
  const item = items.get(id);
  if (!item) throw new Error(`Unknown item ${id}`);
  return item;
}

/** Categories that may share an order with `id` — a hint; /cart/quote is authoritative. */
export function getClubPartners(id: CategoryId): CategoryId[] {
  return findCategory(id)?.clubPartnerIds ?? [];
}
