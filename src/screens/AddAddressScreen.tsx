import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii, spacing } from '../theme';
import { useAddresses } from '../context/AddressContext';
import { BackChevronIcon } from '../components/Icons';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'AddAddress'>;

export default function AddAddressScreen({ navigation, route }: Props) {
  const editId = route.params?.editId;
  const { addresses, addAddress, updateAddress } = useAddresses();
  const existing = editId ? addresses.find((a) => a.id === editId) : undefined;

  const [label, setLabel] = useState(existing?.label ?? '');
  const [area, setArea] = useState(existing?.area ?? '');
  const [detail, setDetail] = useState(existing?.detail ?? '');

  const valid = label.trim().length > 0 && area.trim().length > 0 && detail.trim().length > 0;

  function handleSave() {
    const input = { label: label.trim(), area: area.trim(), detail: detail.trim() };
    if (existing) {
      updateAddress(existing.id, input);
    } else {
      addAddress(input);
    }
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>{existing ? 'Edit address' : 'Add a new address'}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -24}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.fieldLabel}>Label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="Home, Work, ..."
            placeholderTextColor={colors.faint}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Area / locality</Text>
          <TextInput
            value={area}
            onChangeText={setArea}
            placeholder="e.g. Salt Lake, Sector V"
            placeholderTextColor={colors.faint}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Full address</Text>
          <TextInput
            value={detail}
            onChangeText={setDetail}
            placeholder="House / flat, street, city, PIN"
            placeholderTextColor={colors.faint}
            style={[styles.input, styles.multiline]}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.note}>We don&apos;t geolocate this in the demo build — delivery fee and distance are estimated once you check out.</Text>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={existing ? 'Save changes' : 'Save address'} disabled={!valid} onPress={handleSave} />
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
  fieldLabel: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight, marginTop: spacing.lg, marginBottom: 8 },
  input: {
    height: 50, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.border,
    paddingHorizontal: spacing.lg, fontSize: 14.5, fontFamily: fonts.bodyMedium, color: colors.ink,
  },
  multiline: { height: 88, paddingTop: 14, textAlignVertical: 'top' },
  note: { marginTop: spacing.xl, fontSize: 11.5, lineHeight: 17, color: colors.mutedLight },
  footer: { padding: 14, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.borderAlt },
});
