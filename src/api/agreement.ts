import { apiFetch } from './client';

/**
 * Bump this whenever the terms text changes. The backend rejects a
 * submission whose version doesn't match its own current one (409), so a
 * stale app build can't silently accept outdated terms.
 */
export const AGREEMENT_VERSION = 1;

/**
 * POST /profile/accept-agreement — the server records its own clock as the
 * acceptance time; that's the evidentiary timestamp, not anything sent here.
 */
export function acceptAgreement(): Promise<{ agreementAcceptedAt: string }> {
  return apiFetch<{ agreementAcceptedAt: string }>('/profile/accept-agreement', {
    method: 'POST',
    body: { agreement_version: AGREEMENT_VERSION },
  });
}
