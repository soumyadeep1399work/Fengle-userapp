import { apiFetch } from './client';

export interface AuthUser {
  id: number;
  phone: string;
  name: string | null;
  type: 'customer';
}

// Customers use the same OTP flow for new and returning users: the first
// successful verify creates the account, so purpose is always 'login'.
const PURPOSE = 'login';

export function requestOtp(phone: string) {
  return apiFetch<{ message: string; expires_in_minutes: number }>('/auth/otp/request', {
    method: 'POST',
    auth: false,
    body: { phone, purpose: PURPOSE },
  });
}

export function verifyOtp(phone: string, otp: string) {
  return apiFetch<{ token: string; user: AuthUser }>('/auth/otp/verify', {
    method: 'POST',
    auth: false,
    body: { phone, otp, purpose: PURPOSE },
  });
}

export function fetchSession(timeoutMs?: number) {
  return apiFetch<{ user: AuthUser }>('/auth/session', { timeoutMs });
}

// Sending the push token lets the backend stop notifying this device.
export function logoutRequest(deviceToken?: string | null) {
  return apiFetch<unknown>('/auth/logout', { method: 'POST', body: deviceToken ? { device_token: deviceToken } : {} });
}
