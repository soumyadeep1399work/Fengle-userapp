import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { WALLET_BALANCE, WALLET_ENTRIES } from '../data/mock';
import BottomNavBar from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Wallet'>;

export default function WalletScreen({}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Credits</Text>
      <ScrollView contentContainerStyle={styles.scroll} style={{ flex: 1 }}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceEyebrow}>Platter credits</Text>
          <Text style={styles.balanceValue}>₹{WALLET_BALANCE.toFixed(2)}</Text>
          <Text style={styles.balanceNote}>Applied automatically at checkout. Credits come from refunds and goodwill — there&apos;s nothing to top up.</Text>
        </View>

        <Text style={styles.sectionHead}>Activity</Text>
        {WALLET_ENTRIES.map((w) => {
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
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconSign: { fontSize: 15, fontFamily: fonts.bodyBold },
  rowLabel: { fontSize: 13.5, fontFamily: fonts.bodyBold, color: colors.ink },
  rowSub: { marginTop: 2, fontSize: 11, color: colors.mutedLight },
  rowAmount: { fontSize: 13.5, fontFamily: fonts.bodyExtraBold },
});
