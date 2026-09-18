import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { useOrders } from '../context/OrdersContext';
import { CANCEL_WINDOW_MS } from '../data/mock';
import { CheckIcon } from '../components/Icons';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderConfirmed'>;

export default function OrderConfirmedScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const { getOrder, cancelOrder } = useOrders();
  const order = getOrder(orderId);

  const [now, setNow] = useState(Date.now());
  const canStillCancel = !!order && !order.cancelled && now - order.placedAt < CANCEL_WINDOW_MS;

  useEffect(() => {
    if (!canStillCancel) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [canStillCancel]);

  if (!order) return null;

  const secondsLeft = Math.max(0, Math.ceil((CANCEL_WINDOW_MS - (now - order.placedAt)) / 1000));

  function handleCancel() {
    Alert.alert('Cancel order', 'This order will be cancelled and any payment refunded to your original method.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Cancel order',
        style: 'destructive',
        onPress: () => {
          cancelOrder(orderId);
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <View style={styles.circle}>
          <CheckIcon size={38} color={colors.surfaceCream} strokeWidth={2.8} />
        </View>
        <Text style={styles.title}>Order placed</Text>
        <Text style={styles.subtitle}>Your {order.catName} order is on the fire. We&apos;ll ping you at every step.</Text>

        <View style={styles.card}>
          <Row label="Order" value={`#${order.id}`} />
          <Row label="Paid" value={`₹${order.total} · ${order.payLabel}`} />
          <Row label="Usually takes" value={order.prep} />
        </View>

        <Pressable onPress={() => navigation.replace('OrderStatus', { orderId })} style={styles.trackBtn}>
          <Text style={styles.trackLabel}>Track this order</Text>
        </Pressable>
        <Pressable onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}>
          <Text style={styles.homeLabel}>Back to home</Text>
        </Pressable>
        {canStillCancel && (
          <Pressable onPress={handleCancel}>
            <Text style={styles.cancelLabel}>Cancel order ({secondsLeft}s left)</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 30 },
  circle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  title: { marginTop: 4, fontFamily: fonts.heading, fontSize: 22, color: colors.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 13.5, lineHeight: 20, color: colors.bodyMuted, textAlign: 'center' },
  card: { marginTop: 8, width: '100%', maxWidth: 260, borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, padding: 14, gap: 9 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 13, color: colors.mutedLight },
  rowValue: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.ink },
  trackBtn: { marginTop: 4, width: '100%', maxWidth: 260, height: 50, borderRadius: radii.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  trackLabel: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.surfaceCream },
  homeLabel: { fontSize: 13, fontFamily: fonts.bodyBold, color: colors.bodyMuted },
  cancelLabel: { marginTop: 4, fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.conflictRed },
});
