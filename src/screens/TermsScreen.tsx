import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii } from '../theme';
import { acceptAgreement } from '../api/agreement';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';

// TODO(client): placeholder terms — the client must supply the real legal
// text before launch (same status as the invoice issuer fields).
const TERMS_TEXT = `Welcome to Fengle. Before you place your first order, please read and accept these terms.

1. Ordering. Prices, delivery fees and taxes are shown before you pay. Placing an order is an offer to buy, which the kitchen may decline if an item becomes unavailable.

2. Payment. UPI, card and cash on delivery are accepted where shown. Platter credits, once used, are not refundable to a bank account.

3. Cancellations & refunds. Orders can be cancelled free of charge only within the short window shown after placing, before the kitchen accepts. Eligible refunds are credited to your Fengle wallet.

4. Delivery. Estimated times are our best guess, not a guarantee. Please be reachable at the address and phone number on your account.

5. Your account. You're responsible for the OTP and device used to access your account, and for keeping your saved addresses accurate.

6. Changes. We may update these terms from time to time; continued use of the app after a change means you accept the update.

By ticking the box below, you confirm you have read and agree to these terms.`;

export default function TermsScreen({ onAccepted }: { onAccepted: () => void }) {
  const { logout } = useAuth();
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (scrolledToEnd) return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 24) setScrolledToEnd(true);
  }

  async function handleAgree() {
    setBusy(true);
    setError('');
    try {
      await acceptAgreement();
      onAccepted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Text style={styles.title}>A quick agreement</Text>
      <Text style={styles.subtitle}>Please read and accept our terms to start ordering. This only takes a moment.</Text>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.termsBox} onScroll={onScroll} scrollEventThrottle={64}>
        <Text style={styles.termsText}>{TERMS_TEXT}</Text>
        {!scrolledToEnd && <Text style={styles.scrollHint}>Scroll to the end to continue</Text>}
      </ScrollView>

      <Pressable
        onPress={() => scrolledToEnd && setChecked((c) => !c)}
        style={[styles.checkboxRow, !scrolledToEnd && styles.checkboxRowDisabled]}
      >
        <View style={[styles.checkbox, checked && styles.checkboxOn]}>{checked && <Text style={styles.checkboxTick}>✓</Text>}</View>
        <Text style={styles.checkboxLabel}>I have read and agree to the terms & conditions.</Text>
      </Pressable>

      {!!error && <Text style={styles.error}>{error}</Text>}

      <PrimaryButton label={busy ? 'Please wait…' : 'Agree & continue'} disabled={!checked || busy} onPress={handleAgree} style={styles.cta} />
      <Text style={styles.logout} onPress={() => !busy && logout()}>
        Not you? Log out
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 22 },
  title: { marginTop: 14, fontFamily: fonts.heading, fontSize: 22, letterSpacing: -0.5, color: colors.ink },
  subtitle: { marginTop: 6, fontSize: 13, lineHeight: 19, color: colors.bodyMuted },
  scroll: { flex: 1, marginTop: 16, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt },
  termsBox: { padding: 16 },
  termsText: { fontSize: 13, lineHeight: 20, color: colors.body },
  scrollHint: { marginTop: 16, textAlign: 'center', fontSize: 11.5, fontFamily: fonts.bodyBold, color: colors.mutedLight },
  checkboxRow: { marginTop: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkboxRowDisabled: { opacity: 0.4 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxTick: { fontSize: 13, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream },
  checkboxLabel: { flex: 1, fontSize: 13, lineHeight: 19, fontFamily: fonts.bodyBold, color: colors.ink },
  error: { marginTop: 10, fontSize: 12.5, lineHeight: 18, fontFamily: fonts.bodyBold, color: colors.conflictRed },
  cta: { marginTop: 16 },
  logout: { marginTop: 14, marginBottom: 10, textAlign: 'center', fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.mutedLight },
});
