import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { useAddresses } from '../context/AddressContext';
import { BackChevronIcon } from '../components/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Addresses'>;

export default function AddressesScreen({ navigation }: Props) {
  const { addresses, selectedId, selectAddress, deleteAddress } = useAddresses();

  function confirmDelete(id: string, label: string) {
    if (addresses.length <= 1) {
      Alert.alert('Can’t delete', 'You need at least one saved address.');
      return;
    }
    Alert.alert('Delete address', `Remove "${label}" from your saved addresses?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          deleteAddress(id).catch((e) =>
            Alert.alert('Couldn’t delete address', e instanceof Error ? e.message : 'Please try again.')
          ),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Saved addresses</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {addresses.map((a) => {
          const selected = a.id === selectedId;
          return (
            <Pressable
              key={a.id}
              onPress={() => selectAddress(a.id)}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <View style={styles.labelRow}>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.label}>{a.label}</Text>
                {selected && (
                  <View style={styles.selectedBadge}><Text style={styles.selectedLabel}>DELIVERING HERE</Text></View>
                )}
              </View>
              <Text style={styles.detail}>{a.detail}</Text>
              <View style={styles.actionsRow}>
                <Pressable onPress={() => navigation.navigate('AddAddress', { editId: a.id })} style={styles.actionBtn}>
                  <Text style={styles.actionLabel}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(a.id, a.label)} style={styles.actionBtn}>
                  <Text style={[styles.actionLabel, styles.deleteLabel]}>Delete</Text>
                </Pressable>
              </View>
            </Pressable>
          );
        })}

        <Pressable onPress={() => navigation.navigate('AddAddress')} style={styles.addBtn}>
          <Text style={styles.addLabel}>+ Add a new address</Text>
        </Pressable>
        <Text style={styles.footerNote}>Your address decides which of our kitchens can reach you, and whether delivery is free.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  scroll: { padding: 18 },
  card: { borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.borderAlt, padding: 14, marginBottom: 12 },
  cardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  radioSelected: {},
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  label: { fontSize: 14.5, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  selectedBadge: { backgroundColor: colors.primary, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 },
  selectedLabel: { fontSize: 9, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream },
  detail: { marginTop: 6, fontSize: 12.5, lineHeight: 19, color: colors.bodyMuted },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { height: 32, paddingHorizontal: 14, borderRadius: 99, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  actionLabel: { fontSize: 12, fontFamily: fonts.bodyBold, color: colors.ink },
  deleteLabel: { color: colors.nonVeg },
  addBtn: { height: 48, borderRadius: radii.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  addLabel: { fontSize: 13.5, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  footerNote: { marginTop: 14, fontSize: 11, lineHeight: 16, color: colors.mutedLight },
});
