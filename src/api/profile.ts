import { Profile } from '../types';
import { apiFetch } from './client';
import { ApiProfile, mapProfile } from './mappers';

export async function fetchProfile(): Promise<Profile> {
  const { profile } = await apiFetch<{ profile: ApiProfile }>('/profile/me');
  return mapProfile(profile);
}

export async function patchProfile(patch: { name?: string; email?: string }): Promise<Profile> {
  const { profile } = await apiFetch<{ profile: ApiProfile }>('/profile/me', { method: 'PATCH', body: patch });
  return mapProfile(profile);
}

/** Syncs the veg-only choice across devices. */
export async function patchVegOnly(vegOnly: boolean): Promise<void> {
  await apiFetch<unknown>('/profile/preferences', { method: 'PATCH', body: { veg_only: vegOnly } });
}

export async function patchNotificationSettings(patch: {
  orderUpdates?: boolean;
  promotions?: boolean;
}): Promise<{ orderUpdates: boolean; promotions: boolean }> {
  const { notification_prefs } = await apiFetch<{ notification_prefs: { order_updates: boolean; promotions: boolean } }>(
    '/notifications/settings',
    {
      method: 'PATCH',
      body: {
        ...(patch.orderUpdates != null ? { order_updates: patch.orderUpdates } : {}),
        ...(patch.promotions != null ? { promotions: patch.promotions } : {}),
      },
    }
  );
  return { orderUpdates: notification_prefs.order_updates, promotions: notification_prefs.promotions };
}
