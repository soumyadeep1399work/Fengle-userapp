import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii, spacing } from '../theme';
import { useProfile } from '../context/ProfileContext';
import { BackChevronIcon } from '../components/Icons';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EditProfileScreen({ navigation }: Props) {
  const { profile, updateProfile } = useProfile();
  const [name, setName] = useState(profile?.name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const emailOk = email.trim() === '' || EMAIL_RE.test(email.trim());
  const valid = name.trim().length > 0 && emailOk;

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const patch: { name?: string; email?: string } = { name: name.trim() };
      if (email.trim() && email.trim() !== profile?.email) patch.email = email.trim();
      await updateProfile(patch);
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Your profile</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -24}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.faint}
            autoCapitalize="words"
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>Email (optional)</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.faint}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          {!emailOk && <Text style={styles.error}>Enter a valid email address.</Text>}

          <Text style={styles.fieldLabel}>Phone</Text>
          <View style={[styles.input, styles.readOnly]}>
            <Text style={styles.readOnlyText}>+91 {profile?.phone}</Text>
          </View>
          <Text style={styles.note}>Your phone number is your login, so it can’t be changed here.</Text>

          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={saving ? 'Saving…' : 'Save'} disabled={!valid || saving} onPress={handleSave} />
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
    paddingHorizontal: spacing.lg, fontSize: 14.5, fontFamily: fonts.bodyMedium, color: colors.ink, justifyContent: 'center',
  },
  readOnly: { backgroundColor: colors.surfaceAlt, borderColor: colors.borderAlt },
  readOnlyText: { fontSize: 14.5, fontFamily: fonts.bodyMedium, color: colors.mutedLight },
  note: { marginTop: 8, fontSize: 11.5, lineHeight: 17, color: colors.mutedLight },
  error: { marginTop: 8, fontSize: 12.5, lineHeight: 18, fontFamily: fonts.bodyBold, color: colors.conflictRed },
  footer: { padding: 14, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: colors.borderAlt },
});
