import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { HistoryBadgeTone, Item, OrderRecord } from '../types';
import { displayOrderId, useOrders } from '../context/OrdersContext';
import { useCatalog } from '../context/CatalogContext';
import { useCart } from '../context/CartContext';
import { formatMoney } from '../utils/money';
import BottomNavBar from '../components/BottomNavBar';
import PrimaryButton from '../components/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderHistory'>;

const BADGE_STYLE: Record<HistoryBadgeTone, { bg: string; fg: string }> = {
  active: { bg: colors.primaryTint, fg: colors.primaryMid },
  done: { bg: colors.vegTintBg, fg: colors.veg },
  refunded: { bg: colors.greyChipBg, fg: colors.bodyMuted },
  cancelled: { bg: colors.greyChipBg, fg: colors.nonVeg },
};

const STEP_UPPER = ['PLACED', 'ACCEPTED', 'PICKED UP', 'ON THE WAY', 'DELIVERED'];

type PrimaryAction = 'Track order' | 'Rate order' | 'Reorder';

function describe(o: OrderRecord): { tone: HistoryBadgeTone; label: string; action: PrimaryAction } {
  if (o.cancelled) {
    return o.refunded
      ? { tone: 'refunded', label: 'REFUNDED', action: 'Reorder' }
      : { tone: 'cancelled', label: 'CANCELLED', action: 'Reorder' };
  }
  if (o.statusStep === 4) {
    const fullyRated = o.riderRating !== null && (o.restaurantRating !== null || o.restaurantRatingSkipped);
    return { tone: 'done', label: STEP_UPPER[4], action: fullyRated ? 'Reorder' : 'Rate order' };
  }
  return { tone: 'active', label: STEP_UPPER[o.statusStep], action: 'Track order' };
}

export default function OrderHistoryScreen({ navigation }: Props) {
  const { orders, ordersStatus, refreshOrders } = useOrders();
  const { fetchCategory } = useCatalog();
  const { replaceCart } = useCart();
  const [refreshing, setRefreshing] = useState(false);
  const [reorderingId, setReorderingId] = useState<string | null>(null);

  // Statuses change while the app is closed, so reload whenever this tab is opened.
  useFocusEffect(
    useCallback(() => {
      refreshOrders();
    }, [refreshOrders])
  );

  async function onRefresh() {
    setRefreshing(true);
    await refreshOrders();
    setRefreshing(false);
  }

  // Refills the cart from the order at TODAY's prices and availability: prices
  // and stock may have changed, and some dishes may no longer be offered nearby.
  async function handleReorder(order: OrderRecord) {
    setReorderingId(order.id);
    try {
      const available = new Map<string, Item>();
      for (const categoryId of order.categoryIds) {
        const detail = await fetchCategory(categoryId);
        detail.sections.forEach((s) => s.items.forEach((i) => available.set(i.id, i)));
      }
      const cartItems: Record<string, number> = {};
      const missing: string[] = [];
      for (const line of order.lines) {
        if (available.has(line.id)) cartItems[line.id] = line.qty;
        else missing.push(line.name);
      }
      if (Object.keys(cartItems).length === 0) {
        Alert.alert('Not available right now', 'None of these dishes can be delivered to you at the moment.');
        return;
      }
      replaceCart(cartItems);
      navigation.navigate('Cart');
      if (missing.length > 0) {
        Alert.alert('Some dishes were left out', `${missing.join(', ')} ${missing.length === 1 ? 'is' : 'are'} not available near you right now.`);
      }
    } catch (e) {
      Alert.alert('Couldn’t reorder', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setReorderingId(null);
    }
  }

  function onPrimary(order: OrderRecord, action: PrimaryAction) {
    if (action === 'Reorder') handleReorder(order);
    else navigation.navigate('OrderStatus', { orderId: order.id });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Your orders</Text>
      <ScrollView
        contentContainerStyle={styles.scroll}
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {ordersStatus === 'loading' && orders.length === 0 && <ActivityIndicator style={styles.state} color={colors.primary} />}

        {ordersStatus === 'error' && orders.length === 0 && (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Couldn’t load your orders</Text>
            <Text style={styles.stateBody}>Check your connection and try again.</Text>
            <PrimaryButton label="Try again" onPress={() => refreshOrders()} height={44} style={{ marginTop: 12, alignSelf: 'stretch' }} />
          </View>
        )}

        {ordersStatus === 'ready' && orders.length === 0 && (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>No orders yet</Text>
            <Text style={styles.stateBody}>Your orders will show up here once you place one.</Text>
            <PrimaryButton label="Browse categories" onPress={() => navigation.navigate('Home')} height={44} style={{ marginTop: 12, alignSelf: 'stretch' }} />
          </View>
        )}

        {orders.map((order) => {
          const { tone, label, action } = describe(order);
          const badge = BADGE_STYLE[tone];
          const busy = reorderingId === order.id;
          return (
            <View key={order.id} style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.catName} numberOfLines={1}>{order.catName}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeLabel, { color: badge.fg }]}>{label}</Text>
                </View>
              </View>
              <Text style={styles.summary} numberOfLines={1}>
                {order.lines.map((l) => `${l.qty} × ${l.name}`).join(', ')}
              </Text>
              <Text style={styles.meta}>{formatMoney(order.total)} · {order.placedDate} · #{displayOrderId(order.id)}</Text>
              <View style={styles.actionsRow}>
                <Pressable onPress={() => onPrimary(order, action)} disabled={busy} style={styles.actionBtn}>
                  <Text style={styles.actionLabel}>{busy ? 'Checking…' : action}</Text>
                </Pressable>
                <View style={styles.actionDivider} />
                <Pressable onPress={() => navigation.navigate('Invoice', { orderId: order.id })} style={styles.actionBtn}>
                  <Text style={styles.actionLabel}>GST invoice</Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <BottomNavBar active="history" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  title: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10, fontFamily: fonts.heading, fontSize: 22, color: colors.ink },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  state: { marginTop: 40, alignItems: 'stretch', paddingHorizontal: 8 },
  stateTitle: { fontSize: 15, fontFamily: fonts.bodyExtraBold, color: colors.ink, textAlign: 'center' },
  stateBody: { marginTop: 4, fontSize: 13, color: colors.bodyMuted, textAlign: 'center' },
  card: { borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, padding: 14, marginBottom: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  catName: { flex: 1, fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  badge: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  badgeLabel: { fontSize: 10, fontFamily: fonts.bodyExtraBold },
  summary: { marginTop: 4, fontSize: 12.5, color: colors.bodyMuted },
  meta: { marginTop: 8, fontSize: 12, color: colors.mutedLight },
  actionsRow: { flexDirection: 'row', marginTop: 10, borderTopWidth: 1, borderTopColor: '#EFE6E1', paddingTop: 8 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  actionLabel: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  actionDivider: { width: 1, backgroundColor: '#EFE6E1' },
});
