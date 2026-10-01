import { PaymentMethod } from '../types';
import { apiFetch } from './client';

export interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  enabled: boolean;
  /** Fengle credits balance; only on the wallet method. */
  balance?: number;
}

export interface PaymentMethodsResult {
  methods: PaymentMethodOption[];
  /** Razorpay's public key id, needed to open Checkout; null while Razorpay isn't configured (dev-stub mode). */
  razorpayKeyId: string | null;
}

export async function fetchPaymentMethods(): Promise<PaymentMethodsResult> {
  const { methods, razorpay_key_id } = await apiFetch<{
    methods: { id: string; label: string; enabled: boolean; balance?: number | string }[];
    razorpay_key_id?: string | null;
  }>('/payments/methods');
  return {
    methods: methods
      .filter((m): m is typeof m & { id: PaymentMethod } => ['upi', 'card', 'cod', 'wallet'].includes(m.id))
      .map((m) => ({
        id: m.id,
        label: m.label,
        enabled: m.enabled,
        balance: m.balance == null ? undefined : Number(m.balance),
      })),
    razorpayKeyId: razorpay_key_id ?? null,
  };
}
