import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii, spacing } from '../theme';
import { useAddresses } from '../context/AddressContext';
import { BackChevronIcon, PinIcon } from '../components/Icons';
import PrimaryButton from '../components/PrimaryButton';
import { Coords, geocodeAddress, getCurrentPlace } from '../utils/location';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAddress'>;

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : 'Something went wrong. Please try again.';
}

export default function AddAddressScreen({ navigation, route }: Props) {
  const editId = route.params?.editId;
  const firstTime = !!route.params?.firstTime;
  const picked = route.params?.picked;
  const { addresses, addAddress, updateAddress } = useAddresses();
  const existing = editId ? addresses.find((a) => a.id === editId) : undefined;

  const [label, setLabel] = useState(existing?.label ?? '');
  const [detail, setDetail] = useState(existing?.detail ?? '');
  const [coords, setCoords] = useState<Coords | null>(existing ? { lat: existing.lat, lng: existing.lng } : null);
  // 'gps' / 'map' pins are explicit choices and trusted as-is; a null source
  // means the coordinates (if any) came from the saved address or geocoding.
  const [pinSource, setPinSource] = useState<'gps' | 'map' | null>(null);
  // True while the address text was filled in by us (GPS / map), so a later
  // pin can replace it without wiping something the user typed themselves.
  const [autoFilled, setAutoFilled] = useState(false);
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const valid = label.trim().length > 0 && detail.trim().length > 0;

  function applyPin(source: 'gps' | 'map', pin: Coords, address: string) {
    setCoords(pin);
    setPinSource(source);
    if (address && (!detail.trim() || autoFilled)) {
      setDetail(address);
      setAutoFilled(true);
    }
  }

  // Result coming back from the map picker.
  useEffect(() => {
    if (picked) applyPin('map', { lat: picked.lat, lng: picked.lng }, picked.address);
  }, [picked]);

  async function handleUseLocation() {
    setLocating(true);
    setError('');
    try {
      const place = await getCurrentPlace();
      applyPin('gps', place.coords, place.address);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLocating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const text = detail.trim();
      let target = coords;
      // A chosen pin is trusted as-is; otherwise locate the typed address
      // whenever it's new or was changed, so the saved coordinates match the text.
      if (!target || (text !== existing?.detail && !pinSource)) {
        target = await geocodeAddress(text);
        if (!target) {
          throw new Error(
            'We couldn’t find that address on the map. Add the area, city and PIN code, or choose it on the map.'
          );
        }
      }
      const input = { label: label.trim(), detail: text, lat: target.lat, lng: target.lng };
      if (existing) {
        await updateAddress(existing.id, input);
      } else {
        await addAddress(input);
      }
      navigation.goBack();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const title = firstTime ? 'Where should we deliver?' : existing ? 'Edit address' : 'Add a new address';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -24}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {firstTime && (
            <Text style={styles.intro}>Add your address so we can show the kitchens that can reach you.</Text>
          )}

          <Pressable onPress={handleUseLocation} disabled={locating} style={styles.locateBtn}>
            <PinIcon size={16} />
            <Text style={styles.locateLabel}>{locating ? 'Finding you…' : 'Use my current location'}</Text>
          </Pressable>
          {pinSource && (
            <Text style={styles.pinned}>
              {pinSource === 'gps' ? 'Pinned to your current location' : 'Pinned on the map'}
            </Text>
          )}

          <Text style={styles.fieldLabel}>Label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Home, Work, ..."
            placeholderTextColor={colors.faint}
            maxLength={50}
            style={styles.input}
          />

          <View style={styles.fieldLabelRow}>
            <Text style={[styles.fieldLabel, styles.fieldLabelInRow]}>Full address</Text>
            <Pressable
              onPress={() => navigation.navigate('MapPicker', coords ? { lat: coords.lat, lng: coords.lng } : undefined)}
              hitSlop={8}
              style={styles.mapLink}
            >
              <PinIcon size={13} color={colors.primaryMid} />
              <Text style={styles.mapLinkLabel}>Select on map</Text>
            </Pressable>
          </View>
          <TextInput
            value={detail}
            onChangeText={(t) => {
              setDetail(t);
              setAutoFilled(false);
            }}
            placeholder="House / flat, street, area, city, PIN"
            placeholderTextColor={colors.faint}
            maxLength={255}
            style={[styles.input, styles.multiline]}
            multiline
            numberOfLines={3}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton
            label={saving ? 'Saving…' : existing ? 'Save changes' : 'Save address'}
            disabled={!valid || saving}
            onPress={handleSave}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  scroll: { padding: 18 },
  intro: { fontSize: 13, lineHeight: 19, color: colors.bodyMuted, marginBottom: spacing.lg },
  locateBtn: {
    height: 48, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.primaryMid, backgroundColor: colors.primaryTint,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  locateLabel: { fontSize: 13.5, fontFamily: fonts.bodyExtraBold, color: colors.primaryMid },
  pinned: { marginTop: 8, fontSize: 11.5, fontFamily: fonts.bodyBold, color: colors.veg, textAlign: 'center' },
  fieldLabel: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight, marginTop: spacing.lg, marginBottom: 8 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  fieldLabelInRow: { marginTop: spacing.lg },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  mapLinkLabel: { fontSize: 12.5, fontFamily: fonts.bodyExtraBold, color: colors.primaryMid },
  input: {
    height: 50, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.lg, fontSize: 14.5, fontFamily: fonts.bodyMedium, color: colors.ink,
  },
  multiline: { height: 88, paddingTop: 14, textAlignVertical: 'top' },
  error: { marginTop: spacing.lg, fontSize: 12.5, lineHeight: 18, fontFamily: fonts.bodyBold, color: colors.conflictRed },
  footer: { padding: 14, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.borderAlt },
});
