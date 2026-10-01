import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { Coupon } from '../types';
import { fetchMyCoupons } from '../api/coupons';
import { formatMoney } from '../utils/money';
import { formatFullDate } from '../utils/time';
import { useCart } from '../context/CartContext';
import { BackChevronIcon } from '../components/Icons';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Coupons'>;

function discountLabel(c: Coupon): string {
  if (c.discountType === 'percent') {
    const cap = c.maxDiscountAmount ? ` up to ${formatMoney(c.maxDiscountAmount)}` : '';
    return `${c.discountValue}% off${cap}`;
  }
  return `${formatMoney(c.discountValue)} off`;
}

export default function CouponsScreen({ navigation }: Props) {
  const { couponCode, applyCoupon } = useCart();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      setCoupons(await fetchMyCoupons());
      setStatus('ready');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleApply(c: Coupon) {
    applyCoupon(c.code);
    Alert.alert('Coupon applied', 'It’ll be used on your next checkout.');
  }

  async function handleCopy(c: Coupon) {
    await Clipboard.setStringAsync(c.code);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}><BackChevronIcon size={19} /></Pressable>
        <Text style={styles.headerTitle}>Coupons</Text>
      </View>

      {status === 'loading' && <ActivityIndicator style={styles.state} color={colors.primary} />}

      {status === 'error' && (
        <View style={styles.state}>
          <Text style={styles.stateText}>{error}</Text>
          <PrimaryButton label="Try again" onPress={load} height={44} style={{ marginTop: 12 }} />
        </View>
      )}

      {status === 'ready' && coupons.length === 0 && (
        <View style={styles.state}>
          <Text style={styles.stateText}>No coupons for you right now. Check back soon.</Text>
        </View>
      )}

      {status === 'ready' && coupons.length > 0 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          {coupons.map((c) => {
            const isApplied = couponCode === c.code;
            return (
              <View key={c.id} style={styles.card}>
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.discount}>{discountLabel(c)}</Text>
                    <Text style={styles.title}>{c.title}</Text>
                  </View>
                  <Pressable onPress={() => handleCopy(c)} style={styles.codeChip}>
                    <Text style={styles.codeChipLabel}>{c.code}</Text>
                  </Pressable>
                </View>
                {!!c.description && <Text style={styles.desc}>{c.description}</Text>}
                <View style={styles.metaRow}>
                  {c.minOrderValue > 0 && <Text style={styles.meta}>Min order {formatMoney(c.minOrderValue)}</Text>}
                  {!!c.validUntil && <Text style={styles.meta}>Valid till {formatFullDate(c.validUntil)}</Text>}
                </View>
                {c.alreadyUsed ? (
                  <Text style={styles.usedLabel}>Already used</Text>
                ) : (
                  <PrimaryButton
                    label={isApplied ? 'Applied' : 'Apply'}
                    onPress={() => handleApply(c)}
                    disabled={isApplied}
                    variant={isApplied ? 'outline' : 'solid'}
                    height={42}
                    style={{ marginTop: 12 }}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  headerTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.ink },
  state: { marginTop: 60, paddingHorizontal: 24, alignItems: 'center' },
  stateText: { fontSize: 13.5, lineHeight: 20, color: colors.bodyMuted, textAlign: 'center' },
  scroll: { padding: 18, gap: 14 },
  card: { padding: 16, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, borderStyle: 'dashed' },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  discount: { fontSize: 15.5, fontFamily: fonts.bodyExtraBold, color: colors.primary },
  title: { marginTop: 2, fontSize: 12.5, color: colors.bodyMuted },
  codeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.surfaceCream2 },
  codeChipLabel: { fontSize: 12, fontFamily: fonts.bodyExtraBold, color: colors.ink, letterSpacing: 0.5 },
  desc: { marginTop: 10, fontSize: 12, lineHeight: 17, color: colors.mutedLight },
  metaRow: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  meta: { fontSize: 11, color: colors.mutedLight },
  usedLabel: { marginTop: 12, fontSize: 12, fontFamily: fonts.bodyBold, color: colors.mutedLight },
});
