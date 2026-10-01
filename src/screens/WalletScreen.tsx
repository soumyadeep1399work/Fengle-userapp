import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { WalletEntry } from '../types';
import { fetchWalletBalance, fetchWalletLedger } from '../api/wallet';
import { useProfile } from '../context/ProfileContext';
import BottomNavBar from '../components/BottomNavBar';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Wallet'>;

export default function WalletScreen({}: Props) {
  const { refreshProfile } = useProfile();
  const [balance, setBalance] = useState<number | null>(null);
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, ledger] = await Promise.all([fetchWalletBalance(), fetchWalletLedger()]);
      setBalance(b);
      setEntries(ledger);
      setStatus('ready');
      refreshProfile(); // keeps the balance shown on the Account screen in step
    } catch {
      setStatus((s) => (s === 'ready' ? s : 'error'));
    }
  }, [refreshProfile]);

  // Credits change when orders are paid or refunded, so reload whenever this tab opens.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Credits</Text>
      <ScrollView
        contentContainerStyle={styles.scroll}
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceEyebrow}>Fengle credits</Text>
          <Text style={styles.balanceValue}>{balance == null ? '—' : `₹${balance.toFixed(2)}`}</Text>
          <Text style={styles.balanceNote}>Use them as a payment option at checkout. Credits come from refunds and goodwill — there&apos;s nothing to top up.</Text>
        </View>

        <Text style={styles.sectionHead}>Activity</Text>

        {status === 'loading' && <ActivityIndicator style={styles.state} color={colors.primary} />}

        {status === 'error' && (
          <View style={styles.state}>
            <Text style={styles.stateText}>Couldn’t load your credits.</Text>
            <PrimaryButton label="Try again" onPress={load} height={42} style={{ marginTop: 10 }} />
          </View>
        )}

        {status === 'ready' && entries.length === 0 && (
          <Text style={[styles.stateText, styles.state]}>No credit activity yet.</Text>
        )}

        {entries.map((w) => {
          const positive = w.sign === '+';
          return (
            <View key={w.id} style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: positive ? colors.vegTintBg : colors.greyChipBg }]}>
                <Text style={[styles.iconSign, { color: positive ? colors.veg : colors.bodyMuted }]}>{w.sign}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{w.label}</Text>
                <Text style={styles.rowSub}>{w.sub}</Text>
              </View>
              <Text style={[styles.rowAmount, { color: positive ? colors.veg : colors.ink }]}>{w.sign}₹{w.amount}</Text>
            </View>
          );
        })}
      </ScrollView>
      <BottomNavBar active="wallet" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  title: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10, fontFamily: fonts.heading, fontSize: 22, color: colors.ink },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  balanceCard: { borderRadius: radii.lg, backgroundColor: colors.ink, padding: 20 },
  balanceEyebrow: { fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(255,248,244,0.65)' },
  balanceValue: { marginTop: 6, fontFamily: fonts.heading, fontSize: 28, color: colors.surfaceCream, letterSpacing: -0.7 },
  balanceNote: { marginTop: 8, fontSize: 11.5, lineHeight: 17, color: 'rgba(255,248,244,0.65)' },
  sectionHead: { marginTop: 18, fontSize: 11, fontFamily: fonts.bodyBold, letterSpacing: 1.2, textTransform: 'uppercase', color: colors.mutedLight },
  state: { marginTop: 24 },
  stateText: { fontSize: 13, color: colors.bodyMuted, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconSign: { fontSize: 15, fontFamily: fonts.bodyBold },
  rowLabel: { fontSize: 13.5, fontFamily: fonts.bodyBold, color: colors.ink },
  rowSub: { marginTop: 2, fontSize: 11, color: colors.mutedLight },
  rowAmount: { fontSize: 13.5, fontFamily: fonts.bodyExtraBold },
});
