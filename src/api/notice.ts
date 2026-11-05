import { apiFetch } from './client';

export interface AppNotice {
  id: number;
  /** Goes up whenever an admin edits the wording, so an edited notice is shown again. */
  revision: number;
  title: string;
  body: string | null;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaTarget: 'none' | 'coupons';
}

interface ApiNotice {
  id: number;
  revision: number;
  title: string;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_target: 'none' | 'coupons';
}

/** The newest live popup notice the admin has posted, or null when there is none. Public; a short timeout so a slow network just means no popup. */
export async function fetchLiveNotice(): Promise<AppNotice | null> {
  const { notice } = await apiFetch<{ notice: ApiNotice | null }>('/app-notice', { auth: false, timeoutMs: 4000 });
  if (!notice || !notice.title) return null;
  return {
    id: notice.id,
    revision: notice.revision,
    title: notice.title,
    body: notice.body,
    imageUrl: notice.image_url,
    ctaLabel: notice.cta_target !== 'none' ? notice.cta_label : null,
    ctaTarget: notice.cta_target,
  };
}
