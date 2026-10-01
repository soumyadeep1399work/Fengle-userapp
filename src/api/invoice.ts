import { File, Paths } from 'expo-file-system';
import { API_BASE_URL } from './config';
import { apiFetch } from './client';
import { getToken } from './token';

export interface Invoice {
  invoiceNumber: string;
  orderId: number;
  /** ISO order date. */
  date: string;
  issuer: { name: string; gstin: string; fssai: string; address: string };
  billedTo: { name: string | null; address: string };
  lines: { description: string; amount: number }[];
  taxableValue: number;
  cgstAmount: number;
  sgstAmount: number;
  deliveryFee: number;
  invoiceTotal: number;
  note: string;
}

export async function fetchInvoice(orderId: string): Promise<Invoice> {
  const { invoice } = await apiFetch<{ invoice: Invoice }>(`/orders/${orderId}/invoice`);
  return invoice;
}

/**
 * Downloads the invoice PDF into the app's cache and returns its file URI. The
 * endpoint needs the login token, so a plain link can't be opened: the request
 * carries the bearer header itself.
 */
export async function downloadInvoicePdf(orderId: string, invoiceNumber: string): Promise<string> {
  const token = getToken();
  const file = new File(Paths.cache, `${invoiceNumber.replace(/[^A-Za-z0-9-]/g, '-')}.pdf`);
  const downloaded = await File.downloadFileAsync(`${API_BASE_URL}/orders/${orderId}/invoice/pdf`, file, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    idempotent: true,
  });

  // An error response must never be handed on as if it were the invoice.
  const head = (await downloaded.bytes()).slice(0, 4);
  if (String.fromCharCode(...head) !== '%PDF') {
    downloaded.delete();
    throw new Error('The server didn’t return the invoice PDF. Please try again.');
  }
  return downloaded.uri;
}
