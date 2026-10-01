import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, spacing } from '../theme';
import PrimaryButton from '../components/PrimaryButton';
import { requestOtp } from '../api/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Phone'>;

export default function PhoneScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const valid = phone.length === 10;

  async function handleSend() {
    setSending(true);
    setError('');
    try {
      await requestOtp(phone);
      navigation.navigate('Otp', { phone });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -24}
      >
        <Text style={styles.title}>What&apos;s your number?</Text>
        <Text style={styles.subtitle}>We&apos;ll text you a one-time code to verify.</Text>

        <View style={styles.inputRow}>
          <Text style={styles.prefix}>+91</Text>
          <View style={styles.divider} />
          <TextInput
            value={phone}
            onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, '').slice(0, 10))}
            keyboardType="number-pad"
            placeholder="10-digit mobile number"
            placeholderTextColor={colors.faint}
            style={styles.input}
            maxLength={10}
          />
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.flex} />
        <PrimaryButton label={sending ? 'Sending…' : 'Send OTP'} disabled={!valid || sending} onPress={handleSend} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 26, paddingTop: 48, paddingBottom: 32 },
  flex: { flex: 1 },
  title: { fontFamily: fonts.heading, fontSize: 25, color: colors.ink, letterSpacing: -0.7 },
  subtitle: { marginTop: spacing.xs, fontFamily: fonts.body, fontSize: 13.5, lineHeight: 20, color: colors.bodyMuted },
  inputRow: {
    marginTop: 22, flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    height: 56, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: spacing.lg,
  },
  prefix: { fontSize: 16, fontFamily: fonts.bodyBold, color: colors.bodyMuted },
  divider: { width: 1, height: 24, backgroundColor: colors.borderAlt },
  input: { flex: 1, fontSize: 16, fontFamily: fonts.bodyBold, letterSpacing: 0.5, color: colors.ink },
  error: { marginTop: 12, fontSize: 12.5, lineHeight: 18, fontFamily: fonts.bodyBold, color: colors.conflictRed },
});
