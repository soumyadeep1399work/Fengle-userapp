import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { colors, fonts, radii } from '../theme';
import { HISTORY, getItem } from '../data/mock';
import { useOrders } from '../context/OrdersContext';
import { useCart } from '../context/CartContext';
import { HistoryBadgeTone } from '../types';
import BottomNavBar from '../components/BottomNavBar';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderHistory'>;

const BADGE_STYLE: Record<HistoryBadgeTone, { bg: string; fg: string }> = {
  active: { bg: colors.primaryTint, fg: colors.primaryMid },
  done: { bg: colors.vegTintBg, fg: colors.veg },
  refunded: { bg: colors.greyChipBg, fg: colors.bodyMuted },
  cancelled: { bg: colors.greyChipBg, fg: colors.nonVeg },
};

const STEP_UPPER = ['PLACED', 'ACCEPTED', 'PICKED UP', 'ON THE WAY', 'DELIVERED'];

export default function OrderHistoryScreen({ navigation }: Props) {
  const { orders } = useOrders();
  const { reorderCategory } = useCart();

  const liveCards = orders.map((o) => {
    const delivered = o.statusStep === 4;
    const fullyRated = o.riderRating !== null && (o.restaurantRating !== null || o.restaurantRatingSkipped);
    const badgeTone: HistoryBadgeTone = o.cancelled ? 'cancelled' : delivered ? 'done' : 'active';
    const badgeLabel = o.cancelled ? 'CANCELLED' : STEP_UPPER[o.statusStep];
    const primaryLabel = o.cancelled ? 'Reorder' : delivered ? (fullyRated ? 'Reorder' : 'Rate order') : 'Track order';
    return {
      id: o.id, catId: o.catId, catName: o.catName,
      badgeLabel, badgeTone,
      total: o.total, date: delivered ? 'Delivered' : o.cancelled ? 'Cancelled' : 'Today',
      primaryLabel,
      isLive: true,
    };
  });
  const staticCards = HISTORY.filter((h) => !orders.some((o) => o.id === h.id)).map((h) => ({ ...h, isLive: false }));
  const cards = [...liveCards, ...staticCards];

  function onPrimary(card: (typeof cards)[number]) {
    if (card.primaryLabel === 'Track order' || card.primaryLabel === 'Rate order') {
      navigation.navigate('OrderStatus', { orderId: card.id });
    } else if (card.catId) {
      reorderCategory(card.catId);
      navigation.navigate('Cart');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>Your orders</Text>
      <ScrollView contentContainerStyle={styles.scroll} style={{ flex: 1 }}>
        {cards.map((card) => {
          const tone = BADGE_STYLE[card.badgeTone];
          const liveOrder = card.isLive ? orders.find((o) => o.id === card.id) : undefined;
          return (
            <View key={card.id} style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.catName}>{card.catName}</Text>
                <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                  <Text style={[styles.badgeLabel, { color: tone.fg }]}>{card.badgeLabel}</Text>
                </View>
              </View>
              <Text style={styles.summary} numberOfLines={1}>
                {liveOrder ? summaryText(liveOrder.items) : (card as any).itemsSummary}
              </Text>
              <Text style={styles.meta}>₹{card.total} · {card.date} · #{card.id}</Text>
              <View style={styles.actionsRow}>
                <Pressable onPress={() => onPrimary(card)} style={styles.actionBtn}>
                  <Text style={styles.actionLabel}>{card.primaryLabel}</Text>
                </Pressable>
                <View style={styles.actionDivider} />
                <Pressable onPress={() => navigation.navigate('Invoice', { orderId: card.id })} style={styles.actionBtn}>
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

function summaryText(items: Record<string, number>) {
  return Object.entries(items).map(([id, qty]) => `${qty} × ${getItem(id).name}`).join(', ');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  title: { paddingHorizontal: 18, paddingTop: 20, paddingBottom: 10, fontFamily: fonts.heading, fontSize: 22, color: colors.ink },
  scroll: { paddingHorizontal: 18, paddingBottom: 24 },
  card: { borderRadius: radii.md, borderWidth: 1, borderColor: colors.borderAlt, padding: 14, marginBottom: 12 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  catName: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.ink },
  badge: { borderRadius: 99, paddingHorizontal: 9, paddingVertical: 3 },
  badgeLabel: { fontSize: 10, fontFamily: fonts.bodyExtraBold },
  summary: { marginTop: 4, fontSize: 12.5, color: colors.bodyMuted },
  meta: { marginTop: 8, fontSize: 12, color: colors.mutedLight },
  actionsRow: { flexDirection: 'row', marginTop: 10, borderTopWidth: 1, borderTopColor: '#EFE6E1', paddingTop: 8 },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  actionLabel: { fontSize: 12.5, fontFamily: fonts.bodyBold, color: colors.primaryMid },
  actionDivider: { width: 1, backgroundColor: '#EFE6E1' },
});
