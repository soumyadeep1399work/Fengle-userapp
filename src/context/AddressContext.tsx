import React, { createContext, useCallback, useContext, useState } from 'react';
import { Address } from '../types';
import { ADDRESSES as SEED_ADDRESSES } from '../data/mock';

export interface AddressInput {
  label: string;
  area: string;
  detail: string;
}

interface AddressContextValue {
  addresses: Address[];
  selectedId: string;
  selectedAddress: Address;
  selectAddress: (id: string) => void;
  addAddress: (input: AddressInput) => Address;
  updateAddress: (id: string, input: AddressInput) => void;
  deleteAddress: (id: string) => void;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

let seq = 0;

// Global "which address am I ordering to" state — selecting one here (from
// Home, the Addresses list, or the Checkout sheet) applies everywhere else,
// the same way the veg-only preference does.
export function AddressProvider({ children }: { children: React.ReactNode }) {
  const [addresses, setAddresses] = useState<Address[]>(SEED_ADDRESSES);
  const [selectedId, setSelectedId] = useState<string>(
    SEED_ADDRESSES.find((a) => a.isDefault)?.id ?? SEED_ADDRESSES[0].id
  );

  const selectAddress = useCallback((id: string) => setSelectedId(id), []);

  const addAddress = useCallback((input: AddressInput): Address => {
    seq += 1;
    const record: Address = {
      id: `addr-${seq}`,
      label: input.label,
      area: input.area,
      detail: input.detail,
      isDefault: false,
      feeNote: 'Delivery fee calculated at checkout',
      feeIsFree: false,
    };
    setAddresses((prev) => [...prev, record]);
    setSelectedId(record.id);
    return record;
  }, []);

  const updateAddress = useCallback((id: string, input: AddressInput) => {
    setAddresses((prev) => prev.map((a) => (a.id === id ? { ...a, ...input } : a)));
  }, []);

  const deleteAddress = useCallback((id: string) => {
    setAddresses((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setSelectedId((prevSelected) => (prevSelected === id ? next.find((a) => a.isDefault)?.id ?? next[0]?.id ?? '' : prevSelected));
      return next;
    });
  }, []);

  const selectedAddress = addresses.find((a) => a.id === selectedId) ?? addresses[0];

  const value: AddressContextValue = {
    addresses, selectedId, selectedAddress, selectAddress, addAddress, updateAddress, deleteAddress,
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddresses(): AddressContextValue {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddresses must be used within an AddressProvider');
  return ctx;
}
