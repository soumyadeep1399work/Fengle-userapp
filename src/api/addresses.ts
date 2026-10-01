import { Address } from '../types';
import { apiFetch } from './client';
import { ApiAddress, mapAddress } from './mappers';

export interface AddressPayload {
  label: string;
  address_line: string;
  lat: number;
  lng: number;
  is_default?: boolean;
}

export async function listAddresses(): Promise<Address[]> {
  const { addresses } = await apiFetch<{ addresses: ApiAddress[] }>('/addresses');
  return addresses.map(mapAddress);
}

export async function createAddress(payload: AddressPayload): Promise<Address[]> {
  const { addresses } = await apiFetch<{ addresses: ApiAddress[] }>('/addresses', { method: 'POST', body: payload });
  return addresses.map(mapAddress);
}

export async function updateAddress(id: string, payload: Partial<AddressPayload>): Promise<Address> {
  const { address } = await apiFetch<{ address: ApiAddress }>(`/addresses/${id}`, { method: 'PATCH', body: payload });
  return mapAddress(address);
}

export async function deleteAddress(id: string): Promise<void> {
  await apiFetch<unknown>(`/addresses/${id}`, { method: 'DELETE' });
}

export async function setDefaultAddress(id: string): Promise<Address[]> {
  const { addresses } = await apiFetch<{ addresses: ApiAddress[] }>('/profile/default-address', {
    method: 'PATCH',
    body: { address_id: Number(id) },
  });
  return addresses.map(mapAddress);
}
