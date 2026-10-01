import { ProfileRow } from '../types';

export const PROFILE_ROWS: ProfileRow[] = [
  { label: 'Saved addresses', sub: 'Manage delivery addresses', target: 'Addresses' },
  { label: 'Payment methods', sub: 'UPI, Card, Cash on delivery', target: null },
  { label: 'Platter credits', sub: 'Refunds & goodwill', target: 'Wallet' },
  { label: 'Coupons', sub: 'Offers you can use', target: 'Coupons' },
  { label: 'Favourites', sub: 'Dishes you’ve hearted', target: 'Favorites' },
  { label: 'Notifications', sub: 'Order updates and offers', target: 'NotificationSettings' },
  { label: 'Help & support', sub: 'Chat or call us', target: null },
];
