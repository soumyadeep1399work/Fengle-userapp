import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../theme';
import { Address } from '../types';
import BottomSheet from './BottomSheet';
import PrimaryButton from './PrimaryButton';

interface Props {
  visible: boolean;
  addresses: Address[];
  selectedId: string;
  onSelect: (id: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  onAddNew?: () => void;
}

export default function AddressSheet({ visible, addresses, selectedId, onSelect, onConfirm, onClose, onAddNew }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} gap={6}>
      <Text style={styles.title}>Deliver to</Text>
      {addresses.map((a) => {
        const selected = a.id === selectedId;
        return (
          <Pressable key={a.id} onPress={() => onSelect(a.id)} style={[styles.card, selected ? styles.cardSelected : styles.cardIdle]}>
            <View style={[styles.radio, selected && styles.radioSelected]}>
              {selected && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{a.label}</Text>
              <Text style={styles.detail}>{a.detail}</Text>
              <Text style={[styles.feeNote, { color: a.feeIsFree ? colors.veg : colors.addressMuted }]}>{a.feeNote}</Text>
            </View>
          </Pressable>
        );
      })}
      {onAddNew && (
        <Pressable onPress={onAddNew} style={styles.addNewRow}>
          <Text style={styles.addNewLabel}>+ Add a new address</Text>
        </Pressable>
      )}
      <PrimaryButton label="Use this address" onPress={onConfirm} style={{ marginTop: 6 }} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 13, borderRadius: radii.md, borderWidth: 1.5, marginBottom: 10 },
  cardIdle: { borderColor: colors.borderAlt, backgroundColor: colors.white },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  radioSelected: {},
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  label: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  detail: { marginTop: 2, fontSize: 12, color: colors.bodyMuted },
  feeNote: { marginTop: 3, fontSize: 11, fontFamily: fonts.bodyBold },
  addNewRow: { height: 44, borderRadius: radii.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  addNewLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.primaryMid },
});
