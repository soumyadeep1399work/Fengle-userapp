import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { Address } from '../types';
import * as api from '../api/addresses';
import { useAuth } from './AuthContext';

export interface AddressInput {
  label: string;
  detail: string;
  lat: number;
  lng: number;
}

interface AddressContextValue {
  addresses: Address[];
  /** True once the saved addresses have been fetched from the server. */
  loaded: boolean;
  loadFailed: boolean;
  selectedId: string;
  /** null until loaded, or when the user has no saved address yet. */
  selectedAddress: Address | null;
  selectAddress: (id: string) => void;
  addAddress: (input: AddressInput) => Promise<void>;
  updateAddress: (id: string, input: AddressInput) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  refreshAddresses: () => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | undefined>(undefined);

// "Which address am I ordering to" is the server-side default address, so the
// choice follows the user across sessions and devices. Selecting one anywhere
// (Home, Addresses list, Checkout sheet) updates it everywhere.
export function AddressProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const selectedIdRef = useRef('');

  const apply = useCallback((list: Address[]) => {
    const id = list.find((a) => a.isDefault)?.id ?? list[0]?.id ?? '';
    selectedIdRef.current = id;
    setAddresses(list);
    setSelectedId(id);
  }, []);

  const refreshAddresses = useCallback(async () => {
    try {
      apply(await api.listAddresses());
      setLoaded(true);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, [apply]);

  // Load on login, clear on logout so one user's addresses never show for another.
  useEffect(() => {
    if (!user) {
      apply([]);
      setLoaded(false);
      setLoadFailed(false);
      return;
    }
    refreshAddresses();
  }, [user?.id, apply, refreshAddresses]);

  // If the list couldn't be loaded (e.g. the backend was down when the app
  // opened) keep retrying quietly, and retry as soon as the app is foregrounded,
  // so the catalog gets its location without the user having to do anything.
  useEffect(() => {
    if (!user || !loadFailed) return;
    const timer = setInterval(refreshAddresses, 5000);
    return () => clearInterval(timer);
  }, [user, loadFailed, refreshAddresses]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && user && !loaded) refreshAddresses();
    });
    return () => sub.remove();
  }, [user, loaded, refreshAddresses]);

  const selectAddress = useCallback(
    (id: string) => {
      const previous = selectedIdRef.current;
      if (id === previous) return;
      selectedIdRef.current = id;
      setSelectedId(id);
      api.setDefaultAddress(id).then(setAddresses).catch((e) => {
        selectedIdRef.current = previous;
        setSelectedId(previous);
        Alert.alert('Couldn’t switch address', e instanceof Error ? e.message : 'Please try again.');
      });
    },
    []
  );

  const addAddress = useCallback(
    async (input: AddressInput) => {
      // A newly added address becomes the delivery address.
      apply(
        await api.createAddress({
          label: input.label,
          address_line: input.detail,
          lat: input.lat,
          lng: input.lng,
          is_default: true,
        })
      );
      setLoaded(true);
    },
    [apply]
  );

  const updateAddress = useCallback(async (id: string, input: AddressInput) => {
    const updated = await api.updateAddress(id, {
      label: input.label,
      address_line: input.detail,
      lat: input.lat,
      lng: input.lng,
    });
    setAddresses((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  const deleteAddress = useCallback(
    async (id: string) => {
      await api.deleteAddress(id);
      // The server promotes another address to default when the default is deleted.
      apply(await api.listAddresses());
    },
    [apply]
  );

  const selectedAddress = addresses.find((a) => a.id === selectedId) ?? null;

  const value: AddressContextValue = {
    addresses, loaded, loadFailed, selectedId, selectedAddress,
    selectAddress, addAddress, updateAddress, deleteAddress, refreshAddresses,
  };

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddresses(): AddressContextValue {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error('useAddresses must be used within an AddressProvider');
  return ctx;
}
