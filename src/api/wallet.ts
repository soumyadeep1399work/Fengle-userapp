import { WalletEntry } from '../types';
import { formatDay } from '../utils/time';
import { apiFetch } from './client';

interface ApiLedgerRow {
  id: number;
  entry_type: 'credit' | 'debit';
  amount: string | number;
  reason: string;
  related_order_id: number | null;
  notes: string | null;
  created_at: string;
}

// A customer's ledger only ever holds refunds, payments and adjustments; the
// rider-side reasons (COD collection, settlements) are mapped defensively.
function labelFor(row: ApiLedgerRow): string {
  switch (row.reason) {
    case 'order_refund':
      return 'Refund';
    case 'order_payment':
      return 'Credits used';
    case 'manual_adjustment':
      return row.entry_type === 'credit' ? 'Credits added' : 'Adjustment';
    default:
      return row.entry_type === 'credit' ? 'Credit' : 'Debit';
  }
}

function mapEntry(row: ApiLedgerRow): WalletEntry {
  const day = formatDay(row.created_at);
  return {
    id: String(row.id),
    label: labelFor(row),
    sub: row.related_order_id ? `Order #PL-${row.related_order_id} · ${day}` : day,
    sign: row.entry_type === 'credit' ? '+' : '−',
    amount: Number(row.amount),
  };
}

export async function fetchWalletBalance(): Promise<number> {
  const { balance } = await apiFetch<{ balance: number | string }>('/wallet/balance');
  return Number(balance);
}

/** Newest first. */
export async function fetchWalletLedger(limit = 50, offset = 0): Promise<WalletEntry[]> {
  const { ledger } = await apiFetch<{ ledger: ApiLedgerRow[] }>('/wallet/ledger', { query: { limit, offset } });
  return ledger.map(mapEntry);
}
